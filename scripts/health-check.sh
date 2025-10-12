#!/bin/bash

# Health Check Script for BhaMail
# Monitors all services and components

set -e

VERBOSE=${1:-false}
ALERT_WEBHOOK=${ALERT_WEBHOOK:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
HEALTH_RESULTS=()
OVERALL_STATUS="healthy"

log() {
  if [ "$VERBOSE" = "true" ] || [ "$1" = "ERROR" ] || [ "$1" = "WARN" ]; then
    echo -e "${2}[$(date '+%Y-%m-%d %H:%M:%S')] $1: $3${NC}"
  fi
}

check_service() {
  local service=$1
  local expected_status=$2
  local timeout=${3:-10}
  
  log "INFO" "$BLUE" "Checking $service..."
  
  local status=$(docker-compose ps --format json | jq -r --arg service "$service" '.[] | select(.Service == $service) | .State' 2>/dev/null || echo "not_found")
  
  if [ "$status" = "$expected_status" ]; then
    log "INFO" "$GREEN" "✅ $service: $status"
    HEALTH_RESULTS+=("$service:healthy")
    return 0
  else
    log "ERROR" "$RED" "❌ $service: $status (expected: $expected_status)"
    HEALTH_RESULTS+=("$service:unhealthy")
    OVERALL_STATUS="unhealthy"
    return 1
  fi
}

check_port() {
  local service=$1
  local host=$2
  local port=$3
  local timeout=${4:-5}
  
  log "INFO" "$BLUE" "Checking $service port $port..."
  
  if timeout $timeout bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
    log "INFO" "$GREEN" "✅ $service port $port: accessible"
    HEALTH_RESULTS+=("$service-port:healthy")
    return 0
  else
    log "ERROR" "$RED" "❌ $service port $port: not accessible"
    HEALTH_RESULTS+=("$service-port:unhealthy")
    OVERALL_STATUS="unhealthy"
    return 1
  fi
}

check_http() {
  local service=$1
  local url=$2
  local expected_code=${3:-200}
  local timeout=${4:-10}
  
  log "INFO" "$BLUE" "Checking $service HTTP endpoint..."
  
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $timeout "$url" 2>/dev/null || echo "000")
  
  if [ "$http_code" = "$expected_code" ]; then
    log "INFO" "$GREEN" "✅ $service HTTP: $http_code"
    HEALTH_RESULTS+=("$service-http:healthy")
    return 0
  else
    log "ERROR" "$RED" "❌ $service HTTP: $http_code (expected: $expected_code)"
    HEALTH_RESULTS+=("$service-http:unhealthy")
    OVERALL_STATUS="unhealthy"
    return 1
  fi
}

check_database() {
  log "INFO" "$BLUE" "Checking database connectivity..."
  
  local result=$(docker-compose exec -T postgres psql -U bhamail -d bhamail -t -c "SELECT 1;" 2>/dev/null | tr -d ' \n' || echo "")
  
  if [ "$result" = "1" ]; then
    log "INFO" "$GREEN" "✅ Database: connected"
    
    # Check table count
    local table_count=$(docker-compose exec -T postgres psql -U bhamail -d bhamail -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n' || echo "0")
    log "INFO" "$BLUE" "Database tables: $table_count"
    
    # Check user count
    local user_count=$(docker-compose exec -T postgres psql -U bhamail -d bhamail -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n' || echo "0")
    log "INFO" "$BLUE" "Users in database: $user_count"
    
    HEALTH_RESULTS+=("database:healthy")
    return 0
  else
    log "ERROR" "$RED" "❌ Database: connection failed"
    HEALTH_RESULTS+=("database:unhealthy")
    OVERALL_STATUS="unhealthy"
    return 1
  fi
}

check_redis() {
  log "INFO" "$BLUE" "Checking Redis connectivity..."
  
  local result=$(docker-compose exec -T redis redis-cli ping 2>/dev/null || echo "")
  
  if [ "$result" = "PONG" ]; then
    log "INFO" "$GREEN" "✅ Redis: connected"
    
    # Check memory usage
    local memory_used=$(docker-compose exec -T redis redis-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r\n' || echo "unknown")
    log "INFO" "$BLUE" "Redis memory used: $memory_used"
    
    HEALTH_RESULTS+=("redis:healthy")
    return 0
  else
    log "ERROR" "$RED" "❌ Redis: connection failed"
    HEALTH_RESULTS+=("redis:unhealthy")
    OVERALL_STATUS="unhealthy"
    return 1
  fi
}

check_minio() {
  log "INFO" "$BLUE" "Checking MinIO..."
  
  # Check MinIO health endpoint
  local health=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:9000/minio/health/live" 2>/dev/null || echo "000")
  
  if [ "$health" = "200" ]; then
    log "INFO" "$GREEN" "✅ MinIO: healthy"
    HEALTH_RESULTS+=("minio:healthy")
    return 0
  else
    log "ERROR" "$RED" "❌ MinIO: unhealthy ($health)"
    HEALTH_RESULTS+=("minio:unhealthy")
    OVERALL_STATUS="unhealthy"
    return 1
  fi
}

check_opensearch() {
  log "INFO" "$BLUE" "Checking OpenSearch..."
  
  local health=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:9200/_cluster/health" 2>/dev/null || echo "000")
  
  if [ "$health" = "200" ]; then
    log "INFO" "$GREEN" "✅ OpenSearch: healthy"
    
    # Check cluster status
    local cluster_status=$(curl -s --connect-timeout 5 "http://localhost:9200/_cluster/health" 2>/dev/null | jq -r '.status' || echo "unknown")
    log "INFO" "$BLUE" "OpenSearch cluster status: $cluster_status"
    
    HEALTH_RESULTS+=("opensearch:healthy")
    return 0
  else
    log "ERROR" "$RED" "❌ OpenSearch: unhealthy ($health)"
    HEALTH_RESULTS+=("opensearch:unhealthy")
    OVERALL_STATUS="unhealthy"
    return 1
  fi
}

check_disk_space() {
  log "INFO" "$BLUE" "Checking disk space..."
  
  local disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
  local disk_available=$(df -h . | tail -1 | awk '{print $4}')
  
  if [ "$disk_usage" -lt 90 ]; then
    log "INFO" "$GREEN" "✅ Disk space: ${disk_usage}% used, ${disk_available} available"
    HEALTH_RESULTS+=("disk:healthy")
  elif [ "$disk_usage" -lt 95 ]; then
    log "WARN" "$YELLOW" "⚠️ Disk space: ${disk_usage}% used, ${disk_available} available"
    HEALTH_RESULTS+=("disk:warning")
  else
    log "ERROR" "$RED" "❌ Disk space: ${disk_usage}% used, ${disk_available} available"
    HEALTH_RESULTS+=("disk:critical")
    OVERALL_STATUS="unhealthy"
  fi
}

check_memory() {
  log "INFO" "$BLUE" "Checking memory usage..."
  
  local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
  local memory_available=$(free -h | grep Mem | awk '{print $7}')
  
  if [ "$memory_usage" -lt 80 ]; then
    log "INFO" "$GREEN" "✅ Memory: ${memory_usage}% used, ${memory_available} available"
    HEALTH_RESULTS+=("memory:healthy")
  elif [ "$memory_usage" -lt 90 ]; then
    log "WARN" "$YELLOW" "⚠️ Memory: ${memory_usage}% used, ${memory_available} available"
    HEALTH_RESULTS+=("memory:warning")
  else
    log "ERROR" "$RED" "❌ Memory: ${memory_usage}% used, ${memory_available} available"
    HEALTH_RESULTS+=("memory:critical")
    OVERALL_STATUS="unhealthy"
  fi
}

send_alert() {
  local status=$1
  local message=$2
  
  if [ -n "$ALERT_WEBHOOK" ]; then
    log "INFO" "$BLUE" "Sending alert to webhook..."
    
    local payload=$(cat << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "service": "BhaMail",
  "status": "$status",
  "message": "$message",
  "host": "$(hostname)",
  "results": $(printf '%s\n' "${HEALTH_RESULTS[@]}" | jq -R -s 'split("\n")[:-1]')
}
EOF
)
    
    curl -s -X POST "$ALERT_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "$payload" > /dev/null || log "ERROR" "$RED" "Failed to send alert"
  fi
}

# Main health check
echo "🔍 BhaMail Health Check - $(date)"
echo "================================"

# Check Docker Compose services
check_service "postgres" "running"
check_service "redis" "running"
check_service "minio" "running"
check_service "opensearch" "running"
check_service "mailhog" "running"
check_service "clamav" "running"
check_service "api" "running"
check_service "web" "running"

# Check network ports
check_port "api" "localhost" "3001"
check_port "web" "localhost" "3000"
check_port "postgres" "localhost" "5432"
check_port "redis" "localhost" "6379"
check_port "minio" "localhost" "9000"
check_port "opensearch" "localhost" "9200"
check_port "mailhog" "localhost" "8025"

# Check HTTP endpoints
check_http "api" "http://localhost:3001/health"
check_http "web" "http://localhost:3000" "200"
check_http "mailhog" "http://localhost:8025" "200"

# Check service connectivity
check_database
check_redis
check_minio
check_opensearch

# Check system resources
check_disk_space
check_memory

# Summary
echo ""
echo "================================"
if [ "$OVERALL_STATUS" = "healthy" ]; then
  echo -e "${GREEN}✅ Overall Status: HEALTHY${NC}"
  send_alert "healthy" "All BhaMail services are healthy"
else
  echo -e "${RED}❌ Overall Status: UNHEALTHY${NC}"
  send_alert "unhealthy" "One or more BhaMail services are unhealthy"
fi

echo ""
echo "📊 Health Summary:"
for result in "${HEALTH_RESULTS[@]}"; do
  IFS=':' read -r component status <<< "$result"
  case $status in
    "healthy")
      echo -e "   ${GREEN}✅ $component${NC}"
      ;;
    "warning")
      echo -e "   ${YELLOW}⚠️ $component${NC}"
      ;;
    "unhealthy"|"critical")
      echo -e "   ${RED}❌ $component${NC}"
      ;;
    *)
      echo -e "   ${BLUE}ℹ️ $component: $status${NC}"
      ;;
  esac
done

echo ""
echo "🔗 Service URLs:"
echo "   • Web App: http://localhost:3000"
echo "   • API: http://localhost:3001"
echo "   • API Docs: http://localhost:3001/api-docs"
echo "   • MailHog: http://localhost:8025"
echo "   • MinIO Console: http://localhost:9001"

# Exit with appropriate code
if [ "$OVERALL_STATUS" = "healthy" ]; then
  exit 0
else
  exit 1
fi