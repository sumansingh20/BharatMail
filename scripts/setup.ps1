# BhaMail Setup Script for Windows
# This script helps set up BhaMail on Windows systems

Write-Host "🚀 BhaMail Setup Script for Windows" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs to run as Administrator to install Docker" -ForegroundColor Yellow
    Write-Host "Please right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔄 Attempting to restart as Administrator..." -ForegroundColor Cyan
    Start-Process PowerShell -Verb RunAs -ArgumentList "-File `"$PSCommandPath`""
    exit
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check Docker installation
Write-Host "🔍 Checking Docker installation..." -ForegroundColor Cyan

if (Test-Command docker) {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Installing Docker Desktop..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Please follow these steps:" -ForegroundColor Yellow
    Write-Host "1. Download Docker Desktop from: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -ForegroundColor White
    Write-Host "2. Run the installer as Administrator" -ForegroundColor White
    Write-Host "3. Follow the installation wizard" -ForegroundColor White
    Write-Host "4. Restart your computer when prompted" -ForegroundColor White
    Write-Host "5. Start Docker Desktop from the Start menu" -ForegroundColor White
    Write-Host "6. Wait for Docker to start (whale icon in system tray)" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Use Chocolatey package manager:" -ForegroundColor Cyan
    Write-Host "choco install docker-desktop" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Use winget package manager:" -ForegroundColor Cyan
    Write-Host "winget install Docker.DockerDesktop" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Would you like me to try installing via winget? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "📦 Installing Docker Desktop via winget..." -ForegroundColor Cyan
        try {
            winget install Docker.DockerDesktop
            Write-Host "✅ Docker Desktop installation initiated" -ForegroundColor Green
            Write-Host "Please restart your computer and run this script again" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Failed to install via winget: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Please install Docker Desktop manually" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "⏸️  Once Docker is installed, run this script again to continue" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Check if Docker is running
Write-Host "🔍 Checking if Docker is running..." -ForegroundColor Cyan
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and wait for it to be ready" -ForegroundColor Yellow
    Write-Host "Look for the whale icon in your system tray" -ForegroundColor Yellow
    Read-Host "Press Enter once Docker is running"
    
    # Try again
    try {
        docker info | Out-Null
        Write-Host "✅ Docker is now running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker still not responding. Please check Docker Desktop" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit
    }
}

# Check Node.js installation
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Cyan

if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
    
    # Check if version is 18+
    $version = [version]($nodeVersion -replace 'v', '')
    if ($version.Major -ge 18) {
        Write-Host "✅ Node.js version is compatible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Node.js version should be 18+ for best compatibility" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "📥 Installing Node.js..." -ForegroundColor Cyan
    
    $response = Read-Host "Would you like me to install Node.js via winget? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        try {
            winget install OpenJS.NodeJS
            Write-Host "✅ Node.js installation initiated" -ForegroundColor Green
            Write-Host "You may need to restart your terminal" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Failed to install Node.js via winget" -ForegroundColor Red
            Write-Host "Please download from: https://nodejs.org/" -ForegroundColor Yellow
        }
    }
}

# Check npm
if (Test-Command npm) {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  npm not found (should come with Node.js)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🏗️  Setting up BhaMail project..." -ForegroundColor Cyan

# Install API dependencies
if (Test-Path "api/package.json") {
    Write-Host "📦 Installing API dependencies..." -ForegroundColor Cyan
    Set-Location api
    npm install
    Set-Location ..
    Write-Host "✅ API dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  api/package.json not found" -ForegroundColor Yellow
}

# Install Web dependencies
if (Test-Path "web/package.json") {
    Write-Host "📦 Installing Web dependencies..." -ForegroundColor Cyan
    Set-Location web
    npm install
    Set-Location ..
    Write-Host "✅ Web dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  web/package.json not found" -ForegroundColor Yellow
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Cyan
    $envContent = @"
# BhaMail Environment Configuration

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bhamail
DB_USER=bhamail
DB_PASSWORD=bhamail123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Mail Configuration
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_AUTH_USER=
SMTP_AUTH_PASS=

# Storage Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=bhamail-attachments

# Search Configuration
OPENSEARCH_HOST=localhost:9200

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Development
NODE_ENV=development
LOG_LEVEL=debug
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

Write-Host ""
Write-Host "🐳 Starting Docker services..." -ForegroundColor Cyan

# Check if docker-compose command exists (newer versions use 'docker compose')
if (Test-Command docker-compose) {
    $composeCmd = "docker-compose"
} else {
    $composeCmd = "docker compose"
}

# Start services
try {
    & $composeCmd up -d
    Write-Host "✅ Docker services started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start Docker services: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure Docker Desktop is running" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Cyan

$services = @("postgres", "redis", "minio", "opensearch", "mailhog", "api", "web")
foreach ($service in $services) {
    try {
        $status = & $composeCmd ps $service --format "table" | Select-String "running"
        if ($status) {
            Write-Host "✅ $service is running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $service status unclear" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Could not check $service status" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🌱 Seeding database..." -ForegroundColor Cyan

# Seed the database
try {
    if (Test-Path "scripts/seed.js") {
        node scripts/seed.js
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Seed script not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to seed database: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You can try running: node scripts/seed.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 BhaMail setup complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access your BhaMail instance:" -ForegroundColor Cyan
Write-Host "   • Web App: http://localhost:3000" -ForegroundColor White
Write-Host "   • API: http://localhost:3001" -ForegroundColor White
Write-Host "   • API Docs: http://localhost:3001/api-docs" -ForegroundColor White
Write-Host "   • MailHog (Email Testing): http://localhost:8025" -ForegroundColor White
Write-Host "   • MinIO Console: http://localhost:9001" -ForegroundColor White
Write-Host ""
Write-Host "👤 Admin Account:" -ForegroundColor Cyan
Write-Host "   • Email: admin@bhamail.local" -ForegroundColor White
Write-Host "   • Password: password" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "   • Stop services: $composeCmd down" -ForegroundColor White
Write-Host "   • View logs: $composeCmd logs -f" -ForegroundColor White
Write-Host "   • Restart services: $composeCmd restart" -ForegroundColor White
Write-Host "   • Health check: .\scripts\health-check.sh" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation: ./docs/" -ForegroundColor Cyan
Write-Host "🆘 Support: Check README.md for troubleshooting" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"