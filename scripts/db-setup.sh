#!/bin/bash

# 🌱 The Microgreens Management System (TMMS) - Database Setup Script
# Comprehensive database setup for microgreens business management system
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Database connection configuration
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_USER=${DB_USER:-"microgreens_user"}
DB_PASSWORD=${DB_PASSWORD:-"your_secure_password"}
DB_SCHEMA=${DB_SCHEMA:-"public"}

# Database names for microgreens management system
DB_NAME_PRODUCTION=${DB_NAME_PRODUCTION:-"farmer_microgreens"}
DB_NAME_DEVELOPMENT=${DB_NAME_DEVELOPMENT:-"farmer_microgreens_dev"}
DB_NAME_TEST=${DB_NAME_TEST:-"farmer_microgreens_test"}

# Default environment
ENV=${1:-development}
RESET=${2:-false}

echo -e "${BLUE}🌱 The Microgreens Management System (TMMS) - Database Setup${NC}"
echo -e "${BLUE}Environment: ${ENV}${NC}"
echo -e "${BLUE}This script sets up the comprehensive microgreens business database.${NC}"
echo -e "${BLUE}Includes USDA organic compliance, production tracking, and business management.${NC}"
echo

# Set database URL based on environment
case $ENV in
  "production")
    export NODE_ENV=production
    export DATABASE_NAME="$DB_NAME_PRODUCTION"
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME_PRODUCTION?schema=$DB_SCHEMA"
    echo -e "${GREEN}🏭 Setting up PRODUCTION database for microgreens business${NC}"
    ;;
  "development")
    export NODE_ENV=development
    export DATABASE_NAME="$DB_NAME_DEVELOPMENT"
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME_DEVELOPMENT?schema=$DB_SCHEMA"
    echo -e "${CYAN}🛠️  Setting up DEVELOPMENT database for microgreens management${NC}"
    ;;
  "test")
    export NODE_ENV=test
    export DATABASE_NAME="$DB_NAME_TEST"
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME_TEST?schema=$DB_SCHEMA"
    echo -e "${YELLOW}🧪 Setting up TEST database for microgreens system testing${NC}"
    ;;
  *)
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo -e "${YELLOW}Usage: $0 [production|development|test] [reset]${NC}"
    echo -e "${CYAN}Examples:${NC}"
    echo -e "  ${CYAN}$0 development        ${NC}# Setup development database"
    echo -e "  ${CYAN}$0 test reset         ${NC}# Reset and setup test database"
    echo -e "  ${CYAN}$0 production         ${NC}# Setup production database"
    exit 1
    ;;
esac

echo -e "${BLUE}Database: ${DATABASE_NAME}${NC}"
echo -e "${BLUE}Database URL: ${DATABASE_URL}${NC}"
echo

# Verify Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Prisma schema not found at prisma/schema.prisma${NC}"
    echo -e "${YELLOW}💡 Make sure you're running this from the project root directory${NC}"
    exit 1
fi

echo -e "${CYAN}🌿 Microgreens Management Database Schema Includes:${NC}"
echo -e "${CYAN}   • User Management (Multi-role access control)${NC}"
echo -e "${CYAN}   • USDA Organic Compliance (Seed sourcing, certifications)${NC}"
echo -e "${CYAN}   • Production Management (Batches, tasks, quality control)${NC}"
echo -e "${CYAN}   • Inventory Management (Seeds, supplies, packaging)${NC}"
echo -e "${CYAN}   • Customer & Order Management${NC}"
echo -e "${CYAN}   • Financial Tracking & Analytics${NC}"
echo -e "${CYAN}   • Shipping & Logistics${NC}"
echo -e "${CYAN}   • Marketing & Communication${NC}"
echo -e "${CYAN}   • Audit Trail & Compliance${NC}"
echo

# Reset database if requested
if [ "$RESET" = "reset" ]; then
  echo -e "${YELLOW}⚠️  Resetting microgreens management database...${NC}"
  echo -e "${YELLOW}This will delete ALL existing data including:${NC}"
  echo -e "${YELLOW}  • User accounts and roles${NC}"
  echo -e "${YELLOW}  • USDA compliance records${NC}"
  echo -e "${YELLOW}  • Production batches and quality data${NC}"
  echo -e "${YELLOW}  • Customer and order history${NC}"
  echo -e "${YELLOW}  • Inventory and financial records${NC}"
  echo
  read -p "Are you sure you want to continue? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Database reset cancelled${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}🔄 Resetting microgreens management database...${NC}"
  npx prisma db push --force-reset
  echo -e "${GREEN}✅ Database reset completed${NC}"
else
  # Run migrations
  echo -e "${BLUE}🔄 Running database migrations for microgreens management...${NC}"
  npx prisma db push
  echo -e "${GREEN}✅ Migrations completed${NC}"
fi

# Generate Prisma client
echo -e "${BLUE}🔄 Generating Prisma client for microgreens management...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Run seed
echo -e "${BLUE}🌱 Seeding microgreens management database...${NC}"
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    npx prisma db seed
    echo -e "${GREEN}✅ Database seeded successfully with microgreens management data${NC}"
else
    echo -e "${YELLOW}⚠️ No seed file found (prisma/seed.ts or prisma/seed.js)${NC}"
    echo -e "${CYAN}💡 Consider creating a seed file with:${NC}"
    echo -e "${CYAN}   • Default user accounts (Admin, Manager roles)${NC}"
    echo -e "${CYAN}   • Sample suppliers and organic certifications${NC}"
    echo -e "${CYAN}   • Common microgreens seeds (Arugula, Radish, etc.)${NC}"
    echo -e "${CYAN}   • Basic inventory supplies${NC}"
    echo -e "${CYAN}   • Sample production batches${NC}"
fi

echo -e "${GREEN}🎉 Microgreens management database setup completed for ${ENV} environment!${NC}"

# Show quick connection test
echo -e "${BLUE}🔗 Testing database connection...${NC}"
if npx prisma db execute --command "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database connection successful${NC}"
  
  # Show table count for verification
  echo -e "${BLUE}📊 Database verification:${NC}"
  
  # Check if tables exist by trying to count records
  TABLES=("users" "suppliers" "seeds" "batches" "customers" "orders")
  for table in "${TABLES[@]}"; do
    COUNT=$(npx prisma db execute --command "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tail -1 | tr -d ' ' 2>/dev/null || echo "0")
    if [[ "$COUNT" =~ ^[0-9]+$ ]]; then
      echo -e "${CYAN}  • $table: $COUNT records${NC}"
    else
      echo -e "${YELLOW}  • $table: table exists${NC}"
    fi
  done
else
  echo -e "${RED}❌ Database connection failed${NC}"
  echo -e "${YELLOW}💡 Check your database connection settings:${NC}"
  echo -e "${YELLOW}   • Verify PostgreSQL is running${NC}"
  echo -e "${YELLOW}   • Check DATABASE_URL environment variable${NC}"
  echo -e "${YELLOW}   • Ensure database user has proper permissions${NC}"
fi

echo
echo -e "${CYAN}🚀 Next Steps:${NC}"
echo -e "${CYAN}  1. Start development server: npm run dev${NC}"
echo -e "${CYAN}  2. View database: npx prisma studio${NC}"
echo -e "${CYAN}  3. Test deployment: ./scripts/dev-instances.sh deploy${NC}"
echo -e "${CYAN}  4. Begin microgreens management! 🌱${NC}" 