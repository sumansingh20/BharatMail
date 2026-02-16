#!/bin/bash

# Restore Script for BhaMail
# Restores database, files, and configuration from backup

set -e

BACKUP_NAME=${1}
BACKUP_DIR=${2:-"./backups"}

if [ -z "$BACKUP_NAME" ]; then
  echo "❌ Usage: $0 <backup_name> [backup_dir]"
  echo "   Example: $0 bhamail_backup_20241201_143022"
  exit 1
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
ARCHIVE_PATH="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"

echo "🔄 Restoring BhaMail from backup: $BACKUP_NAME"

# Check if backup exists
if [ ! -f "$ARCHIVE_PATH" ] && [ ! -d "$BACKUP_PATH" ]; then
  echo "❌ Backup not found: $ARCHIVE_PATH or $BACKUP_PATH"
  exit 1
fi

# Extract archive if needed
if [ -f "$ARCHIVE_PATH" ] && [ ! -d "$BACKUP_PATH" ]; then
  echo "📦 Extracting backup archive..."
  cd "$BACKUP_DIR"
  tar xzf "${BACKUP_NAME}.tar.gz"
fi

# Verify backup structure
if [ ! -f "$BACKUP_PATH/backup_info.json" ]; then
  echo "❌ Invalid backup: missing backup_info.json"
  exit 1
fi

# Show backup information
echo "📋 Backup Information:"
cat "$BACKUP_PATH/backup_info.json" | jq -r '
  "   Created: " + .timestamp,
  "   Version: " + .version,
  "   Type: " + .type,
  "   Components: " + (.components | join(", "))
'

# Confirmation prompt
read -p "⚠️  This will replace current data. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Restore cancelled"
  exit 1
fi

echo "🛑 Stopping BhaMail services..."
docker-compose down

echo "🗄️ Restoring PostgreSQL database..."

# Start only PostgreSQL for restore
docker-compose up -d postgres
sleep 10

# Wait for PostgreSQL to be ready
until docker-compose exec postgres pg_isready -U bhamail; do
  echo "   Waiting for PostgreSQL..."
  sleep 2
done

# Drop and recreate database
docker-compose exec postgres psql -U bhamail -c "DROP DATABASE IF EXISTS bhamail;"
docker-compose exec postgres psql -U bhamail -c "CREATE DATABASE bhamail;"

# Restore from custom format backup
if [ -f "$BACKUP_PATH/database.backup" ]; then
  echo "   Restoring from custom format backup..."
  docker-compose exec -T postgres pg_restore \
    -U bhamail \
    -d bhamail \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges < "$BACKUP_PATH/database.backup"
elif [ -f "$BACKUP_PATH/database.sql" ]; then
  echo "   Restoring from SQL backup..."
  docker-compose exec -T postgres psql -U bhamail -d bhamail < "$BACKUP_PATH/database.sql"
else
  echo "❌ No database backup found"
  exit 1
fi

echo "📁 Restoring MinIO files..."

# Stop all services to restore volumes
docker-compose down

# Restore MinIO data
if [ -f "$BACKUP_PATH/minio_data.tar.gz" ]; then
  echo "   Restoring MinIO volume..."
  
  # Remove existing volume
  docker volume rm bhamail_minio_data 2>/dev/null || true
  
  # Create new volume and restore data
  docker volume create bhamail_minio_data
  docker run --rm \
    -v bhamail_minio_data:/target \
    -v "$PWD/$BACKUP_PATH":/backup:ro \
    alpine tar xzf /backup/minio_data.tar.gz -C /target
else
  echo "   No MinIO backup found, skipping..."
fi

echo "🔧 Restoring configuration files..."

# Restore configuration files
if [ -d "$BACKUP_PATH/config" ]; then
  CONFIG_BACKUP_DIR="$BACKUP_PATH/config"
  
  # Backup current config
  if [ -f "docker-compose.yml" ]; then
    mv docker-compose.yml docker-compose.yml.bak.$(date +%s)
  fi
  
  if [ -f ".env" ]; then
    mv .env .env.bak.$(date +%s)
  fi
  
  # Restore config files
  if [ -f "$CONFIG_BACKUP_DIR/docker-compose.yml" ]; then
    cp "$CONFIG_BACKUP_DIR/docker-compose.yml" .
  fi
  
  if [ -f "$CONFIG_BACKUP_DIR/.env" ]; then
    cp "$CONFIG_BACKUP_DIR/.env" .
  fi
  
  if [ -d "$CONFIG_BACKUP_DIR/keys" ]; then
    cp -r "$CONFIG_BACKUP_DIR/keys" .
  fi
  
  if [ -d "$CONFIG_BACKUP_DIR/migrations" ]; then
    mkdir -p api/
    cp -r "$CONFIG_BACKUP_DIR/migrations" api/
  fi
  
  if [ -d "$CONFIG_BACKUP_DIR/infra" ]; then
    cp -r "$CONFIG_BACKUP_DIR/infra" .
  fi
fi

echo "🚀 Starting BhaMail services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🔍 Verifying restore..."

# Check database
DB_STATUS=$(docker-compose exec postgres psql -U bhamail -d bhamail -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")
echo "   Database users: $DB_STATUS"

# Check API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "000")
echo "   API status: $API_STATUS"

# Check web app
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
echo "   Web app status: $WEB_STATUS"

echo ""
if [ "$DB_STATUS" -gt "0" ] && [ "$API_STATUS" = "200" ] && [ "$WEB_STATUS" = "200" ]; then
  echo "✅ Restore completed successfully!"
  echo ""
  echo "🚀 BhaMail is running:"
  echo "   • Web app: http://localhost:3000"
  echo "   • API: http://localhost:3001"
  echo "   • MailHog: http://localhost:8025"
  echo "   • Admin: admin@bhamail.local / password"
else
  echo "⚠️  Restore completed but some services may not be healthy"
  echo "   Check logs: docker-compose logs"
fi

echo ""
echo "🧹 Cleanup:"
echo "   • Remove backup files: rm -rf $BACKUP_PATH"
echo "   • Remove archive: rm $ARCHIVE_PATH"
echo ""
echo "📋 Next Steps:"
echo "   1. Test login and functionality"
echo "   2. Verify email sending/receiving"
echo "   3. Check admin panel"
echo "   4. Update passwords if needed"