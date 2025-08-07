# Vision-TF Backend

Enterprise-grade authentication and security system for Vision-TF platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (Windows/Mac) or Docker (Linux)
- Git

## Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (Windows/Mac) or Docker (Linux)
- Git

### First Time Setup

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file** with your configuration values

4. **Run setup script:**
   ```bash
   chmod +x scripts/dev-setup.sh
   ./scripts/dev-setup.sh
   ```

The setup script will:
- Check Docker installation
- Start all containers (PostgreSQL, RabbitMQ, Backend)
- Run database migrations
- Seed test data
- Show you the service URLs

### Daily Development

**Start development environment:**
```bash
./scripts/dev/dev-start.sh
```

**View logs:**
```bash
./scripts/dev/dev-logs.sh
```

**Stop development environment:**
```bash
./scripts/dev/dev-stop.sh
```

**Reset everything (when things go wrong):**
```bash
./scripts/dev/dev-reset.sh
```

## Services

Once running, you'll have access to:

- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/v1/health
- **RabbitMQ Management**: http://localhost:15672

## Database Management

**Create backup:**
```bash
./scripts/db/db-backup.sh
```

**Restore from backup:**
```bash
./scripts/db/db-restore.sh ./backups/vision-tf-backup-YYYYMMDD_HHMMSS.sql
```

## Troubleshooting

**Check service health:**
```bash
./scripts/utils/health-check.sh
```

**Clean up Docker resources:**
```bash
./scripts/utils/cleanup.sh
```

**Common issues:**
- Docker not running: Start Docker Desktop
- Port conflicts: Stop local PostgreSQL (`sudo systemctl stop postgresql`)
- Permission errors: Use `sudo` for Docker commands on Linux

## Environment Variables

Key variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://vision_user:vision_password@localhost:5432/vision_tf"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV=development

# Test users (for seeding)
SEED_ADMIN_EMAIL="admin@vision-tf.com"
SEED_ADMIN_PASSWORD="Admin123!"
# ... other seed variables
```

## API Endpoints

### Authentication
- `POST /v1/auth/signup` - Register user
- `POST /v1/auth/login` - User login
- `POST /v1/auth/logout` - User logout
- `POST /v1/auth/refresh` - Refresh token

### User Management
- `GET /v1/auth/profile` - Get profile
- `GET /v1/auth/sessions` - Get sessions
- `POST /v1/auth/sessions/terminate` - Terminate session

### Admin
- `GET /v1/auth/admin/users` - List users
- `POST /v1/auth/admin/change-role` - Change user role
- `GET /v1/auth/audit/logs` - View audit logs
- `GET /v1/auth/security/suspicious-activities` - View security events

## Features

- User authentication with JWT
- Role-based access (CLIENT, DEVELOPER, ADMIN)
- Two-factor authentication
- Session management
- Audit logging
- Suspicious activity detection
- Rate limiting
- Health monitoring

## Tech Stack

- NestJS framework
- PostgreSQL database
- Prisma ORM
- JWT authentication
- Docker containerization
- RabbitMQ messaging

## Testing

```bash
# Run tests
npm run test

# Run with coverage
npm run test:cov
```

## Scripts Reference

See `scripts/README.md` for detailed script documentation.

## Support

For issues:
1. Check `./scripts/utils/health-check.sh`
2. View logs with `./scripts/dev/dev-logs.sh`
3. Reset environment with `./scripts/dev/dev-reset.sh`
4. Contact the development team
