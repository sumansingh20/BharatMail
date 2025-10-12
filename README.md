# BhaMail - Self-Hosted Email Solution

![BhaMail Logo](./assets/logo.png)

**BhaMail** is a production-ready, self-hosted email solution that provides Gmail-like functionality for individuals, teams, and organizations. Built with modern technologies and designed for easy deployment and maintenance.

## 🌟 Features

### Core Email Features
- **Modern Web Interface** - Gmail-like UI with responsive design
- **Mobile Apps** - Native Flutter apps for iOS and Android
- **Email Protocols** - Full SMTP, IMAP, and POP3 support
- **Conversation Threading** - Smart email grouping and organization
- **Advanced Search** - Powered by OpenSearch with full-text indexing
- **Attachment Support** - File uploads with virus scanning
- **Rich Text Editor** - HTML email composition with formatting
- **Labels and Filters** - Customizable email organization
- **Multiple Accounts** - Support for multiple email domains

### Security & Authentication
- **Two-Factor Authentication (2FA)** - TOTP support
- **DKIM Signing** - Domain-based email authentication
- **JWT Tokens** - Secure API authentication
- **Rate Limiting** - Protection against abuse
- **Virus Scanning** - ClamAV integration for attachments
- **Encrypted Storage** - Secure password hashing

### Administration
- **Admin Panel** - Web-based administration interface
- **User Management** - Create, edit, and manage user accounts
- **Domain Configuration** - Multi-domain email hosting
- **Monitoring** - Health checks and system metrics
- **Backup/Restore** - Automated backup and recovery tools
- **API Access** - RESTful API with OpenAPI documentation

### Infrastructure
- **Docker Compose** - Local development and testing
- **Kubernetes** - Production-ready container orchestration
- **MinIO Storage** - S3-compatible object storage for attachments
- **Redis Cache** - Performance optimization and session management
- **PostgreSQL** - Robust database with full ACID compliance
- **MailHog** - Email testing and development tools

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/bhamail.git
   cd bhamail
   ```

2. **Run setup script**
   ```bash
   ./scripts/setup.sh
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Seed database**
   ```bash
   npm run seed
   ```

5. **Access the application**
   - Web App: http://localhost:3000
   - API Docs: http://localhost:3001/api-docs
   - MailHog: http://localhost:8025
   - Admin: admin@bhamail.local / password

### Production Deployment

See [Production Deployment Guide](./docs/deployment.md) for detailed instructions.

## 📁 Project Structure

```
bhamail/
├── api/                    # Backend API (Node.js + TypeScript)
│   ├── src/               # Source code
│   ├── migrations/        # Database migrations
│   └── package.json
├── web/                   # Frontend web app (React + Vite)
│   ├── src/               # React components and pages
│   ├── public/            # Static assets
│   └── package.json
├── mobile/                # Mobile app (Flutter)
│   ├── lib/               # Dart source code
│   ├── android/           # Android-specific files
│   ├── ios/               # iOS-specific files
│   └── pubspec.yaml
├── infra/                 # Infrastructure as code
│   ├── k8s/               # Kubernetes manifests
│   └── terraform/         # Terraform configurations
├── docs/                  # Documentation
│   ├── api.md             # API documentation
│   ├── deployment.md      # Deployment guide
│   └── architecture.md    # System architecture
├── scripts/               # Utility scripts
│   ├── setup.sh           # Development setup
│   ├── seed.js            # Database seeding
│   ├── backup.sh          # Backup script
│   └── restore.sh         # Restore script
├── tests/                 # Test suites
│   ├── api/               # API tests
│   ├── web/               # Web app tests
│   └── e2e/               # End-to-end tests
└── docker-compose.yml     # Local development environment
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and queues
- **MinIO** - Object storage (S3-compatible)
- **OpenSearch** - Search and analytics
- **ClamAV** - Antivirus scanning

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Query** - Data fetching and state management
- **React Router** - Client-side routing

### Mobile
- **Flutter** - Cross-platform mobile framework
- **Dart** - Programming language
- **Provider/Riverpod** - State management
- **HTTP** - API communication

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Container orchestration
- **Terraform** - Infrastructure as code
- **GitHub Actions** - CI/CD pipelines

## 📖 Documentation

- [API Documentation](./docs/api.md)
- [Architecture Overview](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [Development Guide](./docs/development.md)
- [Security Guide](./docs/security.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🔧 Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bhamail
DB_USER=bhamail
DB_PASSWORD=bhamail123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Mail
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_SECURE=false

# Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=bhamail-attachments

# Search
OPENSEARCH_HOST=localhost:9200
```

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache and queues |
| minio | 9000/9001 | MinIO object storage |
| opensearch | 9200 | OpenSearch cluster |
| mailhog | 1025/8025 | Email testing (SMTP/Web) |
| clamav | 3310 | Antivirus scanning |
| api | 3001 | Backend API server |
| web | 3000 | Frontend web app |

## 🧪 Testing

### API Tests
```bash
cd api
npm test
npm run test:coverage
```

### Web Tests
```bash
cd web
npm test
npm run test:e2e
```

### Integration Tests
```bash
npm run test:integration
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for your changes
5. Run the test suite: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [docs](./docs/) for detailed guides
- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/your-org/bhamail/issues)
- **Discussions**: Join community discussions on [GitHub Discussions](https://github.com/your-org/bhamail/discussions)
- **Email**: Contact us at support@bhamail.com

## 🎯 Roadmap

### Version 1.1 (Next Release)
- [ ] Calendar integration
- [ ] Contact management
- [ ] Email templates
- [ ] Mobile push notifications
- [ ] Advanced spam filtering

### Version 1.2 (Future)
- [ ] End-to-end encryption (PGP)
- [ ] Chat integration
- [ ] File sharing and collaboration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Version 2.0 (Long-term)
- [ ] AI-powered email categorization
- [ ] Video calls integration
- [ ] Advanced workflow automation
- [ ] Third-party app marketplace
- [ ] Enterprise features (SSO, LDAP)

## ⭐ Sponsors

Thank you to our sponsors who make this project possible!

[Become a sponsor](https://github.com/sponsors/your-org) and get your logo here.

## 🏆 Acknowledgments

- [Mailcow](https://mailcow.email/) - Inspiration for self-hosted email
- [Gmail](https://gmail.com/) - UI/UX inspiration
- [Postfix](http://www.postfix.org/) - SMTP server reference
- [Dovecot](https://dovecot.org/) - IMAP server reference
- [OpenSearch](https://opensearch.org/) - Search functionality
- [MinIO](https://min.io/) - S3-compatible storage

---

**Made with ❤️ by the BhaMail team** - Open Source Email Service

A production-grade, Gmail-like email service built with modern web technologies. BhaMail provides a complete email solution with web and mobile clients, focusing on privacy, security, and ease of deployment.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+ (for development)
- Git

### Local Development Setup

1. **Clone and Setup**
```bash
git clone <repository-url>
cd BhaMail
cp .env.example .env
```

2. **Start Services**
```bash
docker-compose up -d
```

3. **Initialize Database and Seed Data**
```bash
npm run setup
npm run seed
```

4. **Access the Application**
- Web UI: http://localhost:3000
- API Docs: http://localhost:8000/docs
- MailHog (Email Testing): http://localhost:8025
- Admin Login: `admin@bhamail.local` / `password`

## 📁 Project Structure

```
BhaMail/
├── api/                 # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── controllers/ # API controllers
│   │   ├── services/    # Business logic
│   │   ├── models/      # Database models
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utilities
│   ├── migrations/      # Database migrations
│   ├── tests/           # Backend tests
│   └── package.json
├── web/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom hooks
│   │   └── utils/       # Utilities
│   ├── public/          # Static assets
│   └── package.json
├── mobile/              # Flutter Mobile App
│   ├── lib/
│   │   ├── screens/     # Mobile screens
│   │   ├── widgets/     # Reusable widgets
│   │   └── services/    # API services
│   └── pubspec.yaml
├── infra/               # Infrastructure
│   ├── docker-compose.yml
│   ├── k8s/             # Kubernetes manifests
│   └── helm/            # Helm charts
├── docs/                # Documentation
├── scripts/             # Utility scripts
└── tests/               # Integration & E2E tests
```

## 🛠 Technology Stack

### Backend
- **API**: Node.js + TypeScript + Express
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: BullMQ
- **Search**: OpenSearch
- **Storage**: MinIO (S3-compatible)
- **Mail**: MailHog (dev) / Postfix+Dovecot (prod)
- **Security**: JWT, bcrypt, rate limiting
- **Monitoring**: Prometheus + Grafana

### Frontend
- **Web**: React + Vite + TypeScript
- **Mobile**: Flutter
- **PWA**: Service Workers, offline support
- **UI**: Tailwind CSS, shadcn/ui components

### DevOps
- **Containers**: Docker + Docker Compose
- **Orchestration**: Kubernetes + Helm
- **CI/CD**: GitHub Actions
- **Testing**: Jest, Cypress, k6

## 🔧 Development Commands

### API Development
```bash
cd api
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run migrate      # Run database migrations
```

### Web Development
```bash
cd web
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run preview      # Preview production build
```

### Mobile Development
```bash
cd mobile
flutter pub get
flutter run          # Run on connected device
flutter build apk    # Build Android APK
```

## 📧 Core Features

### Authentication & Security
- ✅ Email/password signup and login
- ✅ JWT + refresh token authentication
- ✅ Password reset via email
- ✅ Two-factor authentication (TOTP)
- ✅ Rate limiting and account lockouts
- ✅ CSRF protection and CORS configuration

### Email Functionality
- ✅ Compose, send, reply, forward emails
- ✅ Conversation threading
- ✅ Drafts auto-save
- ✅ Attachments with virus scanning
- ✅ Labels and folders
- ✅ Email filters and rules
- ✅ Full-text search with OpenSearch
- ✅ Schedule send and snooze
- ✅ Offline support via service workers

### Admin & Enterprise
- ✅ Multi-tenant support
- ✅ User management admin panel
- ✅ Quota management and monitoring
- ✅ Audit logs and compliance features
- ✅ Backup and restore procedures

### Protocols & Integration
- ✅ SMTP sending and receiving
- ✅ IMAP/POP3 support documentation
- ✅ SPF/DKIM/DMARC configuration
- ✅ External client support (Outlook, Thunderbird)

## 🚢 Production Deployment

### VPS Deployment (< $20/month)
See [docs/production-ops.md](docs/production-ops.md) for detailed instructions.

### Kubernetes Deployment
```bash
helm install bhamail ./infra/helm/bhamail
```

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/openapi.yaml)
- [Production Operations](docs/production-ops.md)
- [SPF/DKIM/DMARC Setup](docs/spf-dkim.md)
- [Security Best Practices](docs/security.md)
- [Development Guide](docs/development.md)

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Load Testing
```bash
npm run test:load
```

## 🔐 Security

BhaMail implements security best practices:

- TLS encryption for all communications
- Secure password storage with bcrypt/Argon2
- JWT tokens with secure refresh mechanism
- CSRF tokens and XSS protection
- Rate limiting and DDoS protection
- Virus scanning for attachments
- Audit logging for compliance

## 🌍 Internationalization

Currently supported languages:
- English (default)
- Hindi (example implementation)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## 📞 Support

For support, please open an issue on GitHub or join our community discussions.