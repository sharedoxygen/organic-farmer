# 🌱 Organic Farm Management System (OFMS) Setup Guide

This guide will walk you through setting up the Organic Farm Management System (OFMS) on your local machine.

**Current Status**: ✅ **System is already configured and running on port 3005**

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0.0 or higher)
- **npm** (version 9.0.0 or higher) or **yarn** (version 1.22.0 or higher)
- **PostgreSQL** (version 13.0 or higher)  
- **Git** for version control

### Check Your Versions

```bash
node --version    # Should be 18.0.0+
npm --version     # Should be 9.0.0+
psql --version    # Should be 13.0+
git --version     # Any recent version
```

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd farm-app
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Next.js 14
- React 18
- TypeScript
- Prisma
- All development tools and testing frameworks

### 3. Set Up Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ofms_database"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3005"
NEXTAUTH_SECRET="your-secret-key-here"

# JWT
JWT_SECRET="your-jwt-secret-here"

# App Configuration
APP_NAME="Organic Farm Management System (OFMS)"
APP_VERSION="1.0.0"
NODE_ENV="development"
PORT=3005

# Email (Optional for notifications)
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"
SMTP_FROM="noreply@organicfarms.com"
```

### 4. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL Installation

1. **Install PostgreSQL** (if not already installed):
   - **macOS**: `brew install postgresql`
   - **Ubuntu**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Start PostgreSQL service**:
   - **macOS**: `brew services start postgresql`
   - **Ubuntu**: `sudo systemctl start postgresql`
   - **Windows**: Start via Services or pgAdmin

3. **Create database and user**:
   ```sql
   -- Connect to PostgreSQL as superuser
   sudo -u postgres psql

   -- Create database
   CREATE DATABASE ofms_database;

   -- Create user
   CREATE USER ofms_user WITH ENCRYPTED PASSWORD 'your_secure_password';

   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE ofms_database TO ofms_user;

   -- Exit
   \q
   ```

#### Option B: Docker PostgreSQL (Alternative)

```bash
docker run --name ofms-postgres \
  -e POSTGRES_DB=ofms_database \
  -e POSTGRES_USER=ofms_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -d postgres:13
```

### 5. Set Up Prisma Database

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database with sample data
npm run db:seed
```

### 6. Verify Installation

```bash
# Run all quality checks
npm run quality:check

# Start development server
npm run dev
```

Open [http://localhost:3005](http://localhost:3005) in your browser.

## 🔧 Development Setup

### Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Create a new migration
npm run db:migrate -- --name your_migration_name

# Reset database (⚠️ DESTRUCTIVE - removes all data)
npm run db:reset

# Create database backup
npm run db:backup
```

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check TypeScript types
npm run type-check

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

### Development Workflow

1. **Start development server**: `npm run dev`
2. **Make changes** to the code
3. **Run quality checks**: `npm run quality:check`
4. **Commit changes** with conventional commit messages
5. **Push to repository**

## 🛠️ Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | - | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |
| `PORT` | Development server port | 3005 | ❌ |
| `APP_NAME` | Application name | "Organic Farm Management System (OFMS)" | ❌ |
| `SMTP_HOST` | Email server host | - | ❌ |
| `SMTP_PORT` | Email server port | 587 | ❌ |
| `UPLOAD_MAX_SIZE` | Max file upload size | 10485760 (10MB) | ❌ |

### Features Configuration

Enable/disable features by setting environment variables:

```bash
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_FILE_UPLOAD=true
ENABLE_IOT_SENSORS=true
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js 14 App Router
│   ├── auth/           # Authentication routes
│   ├── dashboard/      # Main dashboard
│   ├── production/     # Production management
│   │   ├── batches/    # Batch tracking
│   │   ├── seeds/      # Seed management
│   │   ├── harvesting/ # Harvest scheduling
│   │   └── environments/ # Environment monitoring
│   ├── inventory/      # Inventory management
│   │   ├── equipment/  # Equipment tracking
│   │   ├── packaging/  # Packaging supplies
│   │   └── stock/      # Stock management
│   ├── quality/        # Quality control
│   │   ├── control/    # Quality inspections
│   │   ├── audits/     # Audit logging
│   │   └── certifications/ # Certifications
│   ├── analytics/      # Analytics and reporting
│   │   ├── yield/      # Yield analysis
│   │   ├── market/     # Market analysis
│   │   └── financial/  # Financial reporting
│   ├── sales/          # Sales management
│   │   ├── orders/     # Order processing
│   │   ├── pricing/    # Pricing management
│   │   ├── b2b-customers/ # B2B customers
│   │   └── b2c-customers/ # B2C customers
│   ├── traceability/   # Traceability system
│   │   ├── lots/       # Lot tracking
│   │   └── seed-to-sale/ # Full traceability
│   ├── tasks/          # Task management
│   │   ├── assignments/ # Team assignments
│   │   └── work-orders/ # Work orders
│   ├── equipment/      # Equipment management
│   │   ├── management/ # Equipment tracking
│   │   ├── maintenance/ # Maintenance scheduling
│   │   └── sensors/    # IoT sensor monitoring
│   └── api/           # API routes
├── components/         # Reusable UI components
├── lib/               # Utility libraries
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── styles/            # CSS modules and global styles
└── utils/             # Helper functions
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Test database connection
psql -h localhost -U ofms_user -d ofms_database
```

#### Port Already in Use

```bash
# Kill process on port 3005
lsof -ti:3005 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

#### Migration Issues

```bash
# Reset Prisma client
rm -rf node_modules/.prisma
npm run db:generate

# Reset database and rerun migrations
npm run db:reset
```

#### TypeScript Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### CSS Warning Fix

If you see warnings about `align-items: end`, they can be fixed by changing to `align-items: flex-end` in the relevant CSS files.

### Getting Help

1. **Check the documentation**: [../dev-docs/](../dev-docs/)
2. **Search existing issues**: [GitHub Issues](https://github.com/your-org/ofms-organic-farm/issues)
3. **Create a new issue**: Include error messages, environment details, and steps to reproduce

## 🎯 Next Steps

After successful setup:

1. **✅ Explore the dashboard**: Navigate to http://localhost:3005 to see the comprehensive system
2. **✅ Review implemented features**: All 57 pages are functional with complete navigation
3. **✅ Test user roles**: Multi-role authentication system is operational
4. **✅ Check data integrity**: All database operations are protected with referential integrity
5. **✅ Review analytics**: Real-time analytics and reporting are available

### Immediate Use - System Ready ✅

The system is fully configured with:
- ✅ Complete navigation system (57 pages)
- ✅ Multi-role authentication
- ✅ Production management with batch tracking
- ✅ Quality control with audit logging
- ✅ Inventory management for all categories
- ✅ Analytics and reporting dashboards
- ✅ Team management and task assignments
- ✅ Traceability and lot tracking
- ✅ IoT sensor integration
- ✅ Professional responsive UI

## 🔒 Security Considerations

1. **Change default secrets**: Use strong, unique values for `NEXTAUTH_SECRET` and `JWT_SECRET`
2. **Database security**: Use strong passwords and consider SSL connections for production
3. **Environment variables**: Never commit `.env.local` to version control
4. **Regular updates**: Keep dependencies updated for security patches
5. **User management**: The system includes comprehensive role-based access control

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [USDA Organic Compliance Guide](https://www.ams.usda.gov/grades-standards/organic)
- [Organic Farm Food Safety Guidelines](https://extension.unr.edu/publication.aspx?PubID=3468)
- [IoT Sensor Integration Guides](https://docs.microsoft.com/en-us/azure/iot-hub/)

## 🏆 System Capabilities

### ✅ Production Features
- Complete batch lifecycle management
- Real-time environmental monitoring
- Automated harvest scheduling
- Equipment maintenance tracking
- IoT sensor integration with alerts

### ✅ Business Operations  
- B2B/B2C customer management
- Contract and pricing management
- Complete order processing
- Financial analytics and reporting
- Market analysis and competitive tracking

### ✅ Quality & Compliance
- Comprehensive quality control system
- Audit logging for regulatory compliance
- Certification management
- Complete lot traceability
- USDA organic compliance features

### ✅ Team Management
- Multi-role user system (6 levels)
- Task assignment and progress tracking
- Work order management
- Real-time notifications
- Comprehensive audit trails

---

**Ready to manage your organic farm efficiently!** 🌱 Your comprehensive farm management system is fully operational and ready for immediate use! 

*Navigate to [http://localhost:3005](http://localhost:3005) to begin using all implemented features.* 