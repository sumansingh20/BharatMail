#!/bin/bash

# Backup Script for BhaMail
# Creates backups of database, files, and configuration

set -e

BACKUP_DIR=${1:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="bhamail_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "💾 Creating BhaMail backup: $BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Create backup metadata
cat > "$BACKUP_PATH/backup_info.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "type": "full",
  "components": ["database", "files", "config"],
  "hostname": "$(hostname)",
  "created_by": "BhaMail Backup Script"
}
EOF

echo "🗄️ Backing up PostgreSQL database..."

# Database backup
docker-compose exec -T postgres pg_dump -U bhamail -d bhamail --verbose \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges > "$BACKUP_PATH/database.backup"

# Also create a plain SQL backup for easier inspection
docker-compose exec -T postgres pg_dump -U bhamail -d bhamail \
  --verbose \
  --no-owner \
  --no-privileges > "$BACKUP_PATH/database.sql"

echo "📁 Backing up MinIO files..."

# MinIO data backup (if using docker volumes)
if docker volume ls | grep -q "bhamail_minio_data"; then
  echo "   Creating MinIO volume backup..."
  docker run --rm \
    -v bhamail_minio_data:/source:ro \
    -v "$PWD/$BACKUP_PATH":/backup \
    alpine tar czf /backup/minio_data.tar.gz -C /source .
else
  echo "   MinIO volume not found, skipping..."
fi

echo "🔧 Backing up configuration files..."

# Configuration backup
CONFIG_BACKUP_DIR="$BACKUP_PATH/config"
mkdir -p "$CONFIG_BACKUP_DIR"

# Copy important configuration files
if [ -f "docker-compose.yml" ]; then
  cp docker-compose.yml "$CONFIG_BACKUP_DIR/"
fi

if [ -f ".env" ]; then
  cp .env "$CONFIG_BACKUP_DIR/"
fi

if [ -d "api/migrations" ]; then
  cp -r api/migrations "$CONFIG_BACKUP_DIR/"
fi

if [ -d "keys" ]; then
  cp -r keys "$CONFIG_BACKUP_DIR/"
fi

if [ -d "infra" ]; then
  cp -r infra "$CONFIG_BACKUP_DIR/"
fi

echo "📊 Backup statistics:"

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
echo "   Total size: $BACKUP_SIZE"

# File count
FILE_COUNT=$(find "$BACKUP_PATH" -type f | wc -l)
echo "   Files: $FILE_COUNT"

# Database size
if [ -f "$BACKUP_PATH/database.backup" ]; then
  DB_SIZE=$(du -sh "$BACKUP_PATH/database.backup" | cut -f1)
  echo "   Database: $DB_SIZE"
fi

# MinIO size
if [ -f "$BACKUP_PATH/minio_data.tar.gz" ]; then
  MINIO_SIZE=$(du -sh "$BACKUP_PATH/minio_data.tar.gz" | cut -f1)
  echo "   MinIO data: $MINIO_SIZE"
fi

# Create archive
echo "📦 Creating compressed archive..."
cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
ARCHIVE_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)

# Remove uncompressed backup
rm -rf "$BACKUP_NAME"

echo ""
echo "✅ Backup completed successfully!"
echo ""
echo "📦 Archive Details:"
echo "   File: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "   Size: $ARCHIVE_SIZE"
echo "   Created: $(date)"
echo ""
echo "💡 Restore Instructions:"
echo "   1. Extract: tar xzf ${BACKUP_NAME}.tar.gz"
echo "   2. Stop services: docker-compose down"
echo "   3. Restore database: ./scripts/restore.sh $BACKUP_NAME"
echo "   4. Start services: docker-compose up -d"
echo ""
echo "🔧 Backup Retention:"
echo "   • Keep daily backups for 7 days"
echo "   • Keep weekly backups for 4 weeks"  
echo "   • Keep monthly backups for 12 months"
echo ""
echo "⚠️  Security Notes:"
echo "   • Store backups in secure, encrypted location"
echo "   • Test restore procedures regularly"
echo "   • Consider off-site backup storage"
