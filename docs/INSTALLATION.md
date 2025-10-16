# OFMS Installation Guide

Complete guide to installing and setting up OFMS on your system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [First Run](#first-run)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher
- **PostgreSQL** 14.0 or higher
- **npm** 9.0.0 or higher (comes with Node.js)
- **Git** (for cloning the repository)

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows

### Check Your Versions

```bash
node --version # Should be v18.0.0 or higher
npm --version # Should be 9.0.0 or higher
psql --version # Should be 14.0 or higher
```

---

## Installation Methods

### Method 1: Standard Installation (Recommended)

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ofms.git
cd ofms
```

#### 2. Install Dependencies

```bash
npm install
```

This will install all required packages. It may take a few minutes.

#### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your preferred text editor:

```bash
nano .env
# or
vim .env
# or
code .env
```

Update the following variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ofms_db"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3005"
```

#### 4. Set Up the Database

```bash
# Create the database schema
npx prisma db push

# Seed with initial data
npx prisma db seed
```

#### 5. Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:3005` in your browser.

---

### Method 2: Docker Installation

#### 1. Install Docker

- [Docker Desktop](https://www.docker.com/products/docker-desktop) for Mac/Windows
- [Docker Engine](https://docs.docker.com/engine/install/) for Linux

#### 2. Clone and Build

```bash
git clone https://github.com/yourusername/ofms.git
cd ofms

# Build the Docker image
docker-compose build

# Start the containers
docker-compose up
```

Visit `http://localhost:3005` in your browser.

---

## Configuration

### Environment Variables

#### Required Variables

```env
# Database connection
DATABASE_URL="postgresql://user:password@host:5432/database"

# Application settings
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3005"
```

#### Optional Variables

```env
# Test credentials (for automation)
TEST_ADMIN_EMAIL="admin@example.com"
TEST_ADMIN_PASSWORD="test_password"

# Source/Target databases (for migration)
SOURCE_DATABASE_URL="postgresql://user:password@host:5432/source_db"
TARGET_DATABASE_URL="postgresql://user:password@host:5432/target_db"
```

### Port Configuration

By default, OFMS runs on port 3005. To change:

```bash
# In package.json, update the dev script:
"dev": "next dev -p 3000"
```

---

## Database Setup

### PostgreSQL Installation

#### macOS (using Homebrew)

```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows

Download and install from [PostgreSQL.org](https://www.postgresql.org/download/windows/)

### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE ofms_db;

# Create user
CREATE USER ofms_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ofms_db TO ofms_user;

# Exit
\q
```

### Initialize Schema

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Seed Data

```bash
# Seed with demo data
npx prisma db seed
```

This creates:
- Default admin user
- Sample farms
- Demo production data

---

## First Run

### 1. Start the Server

```bash
npm run dev
```

You should see:

```
✓ Ready in 3.2s
○ Local: http://localhost:3005
○ Network: http://192.168.1.100:3005
```

### 2. Access the Application

Open your browser and navigate to:

```
http://localhost:3005
```

### 3. Login

Use the default credentials:

```
Email: admin@example.com
Password: change_me_in_production
```

**⚠️ IMPORTANT: Change the default password immediately!**

### 4. Initial Setup

1. **Change Password**
 - Go to Settings → Profile
 - Update your password

2. **Configure Farm**
 - Go to Settings → Farm Settings
 - Update farm name and details

3. **Add Team Members**
 - Go to Settings → Users
 - Invite your team

---

## Troubleshooting

### Port Already in Use

```bash
# Error: Port 3005 is already in use

# Solution 1: Kill the process
lsof -ti:3005 | xargs kill -9

# Solution 2: Use a different port
npm run dev -- -p 3006
```

### Database Connection Error

```bash
# Error: Can't reach database server

# Check PostgreSQL is running
pg_isready

# Check connection string in .env
DATABASE_URL="postgresql://user:password@localhost:5432/ofms_db"

# Test connection
psql $DATABASE_URL
```

### Module Not Found

```bash
# Error: Cannot find module

# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Error

```bash
# Error: Prisma Client not generated

# Solution: Generate Prisma Client
npx prisma generate
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

## Next Steps

- Read the [User Guide](USER_GUIDE.md)
- Explore [Features](FEATURES.md)
- Check [API Documentation](API.md)
- Join our [Community](https://discord.gg/ofms)

---

## Getting Help

- **Documentation**: [docs.ofms.com](https://docs.ofms.com)
- **Discord**: [discord.gg/ofms](https://discord.gg/ofms)
- **GitHub Issues**: [github.com/ofms/ofms/issues](https://github.com/ofms/ofms/issues)
- **Email**: support@ofms.com

---

**Installation complete! Welcome to OFMS! 🌱**
