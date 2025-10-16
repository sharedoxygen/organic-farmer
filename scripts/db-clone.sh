#!/bin/bash

# 🌱 The Microgreens Management System (TMMS) - Database Clone Script
# Replicates one microgreens database to another for testing and development
# Primarily used to sync test database with development database

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

# Source and target databases for microgreens management
SOURCE_DB=${1:-"farmer_microgreens_dev"}
TARGET_DB=${2:-"farmer_microgreens_test"}

echo -e "${CYAN}🌱 The Microgreens Management System (TMMS) - Database Clone Script${NC}"
echo -e "${CYAN}===============================================${NC}"
echo -e "${BLUE}Source DB: ${GREEN}${SOURCE_DB}${NC}"
echo -e "${BLUE}Target DB: ${GREEN}${TARGET_DB}${NC}"
echo -e "${CYAN}This will replicate microgreens business data between databases${NC}"
echo

# Confirm with the user
echo -e "${YELLOW}⚠️  WARNING: This will overwrite all data in ${TARGET_DB} with data from ${SOURCE_DB}${NC}"
echo -e "${YELLOW}This includes:${NC}"
echo -e "${YELLOW}  • User accounts and role assignments${NC}"
echo -e "${YELLOW}  • USDA organic compliance records${NC}"
echo -e "${YELLOW}  • Production batches and quality control data${NC}"
echo -e "${YELLOW}  • Customer profiles and order history${NC}"
echo -e "${YELLOW}  • Inventory and financial records${NC}"
echo -e "${YELLOW}  • Supplier and seed sourcing information${NC}"
echo
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Operation cancelled by user${NC}"
    exit 0
fi

# Setup connection strings
SOURCE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$SOURCE_DB"
TARGET_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TARGET_DB"

# Create temporary dump file
TEMP_DUMP_FILE="/tmp/${SOURCE_DB}_to_${TARGET_DB}_dump.sql"
echo -e "${BLUE}🔄 Creating database dump from ${SOURCE_DB}...${NC}"
echo -e "${CYAN}Exporting microgreens management data...${NC}"
pg_dump "$SOURCE_URL" > "$TEMP_DUMP_FILE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error creating database dump${NC}"
    echo -e "${YELLOW}💡 Check database connection and permissions${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database dump created successfully${NC}"

# Drop and recreate target database
echo -e "${BLUE}🔄 Dropping target database ${TARGET_DB} if exists...${NC}"
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --if-exists "$TARGET_DB"
echo -e "${BLUE}🔄 Creating fresh target database ${TARGET_DB}...${NC}"
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TARGET_DB"

# Restore dump to target database
echo -e "${BLUE}🔄 Restoring microgreens management data to ${TARGET_DB}...${NC}"
psql "$TARGET_URL" < "$TEMP_DUMP_FILE"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error restoring database${NC}"
    echo -e "${YELLOW}💡 Check target database permissions and disk space${NC}"
    exit 1
fi

# Clean up
rm "$TEMP_DUMP_FILE"
echo -e "${GREEN}✅ Database clone completed successfully!${NC}"

# Verify clone success by comparing row counts for key microgreens management tables
echo -e "${BLUE}🔍 Verifying microgreens management database clone...${NC}"
tables=("users" "suppliers" "seeds" "batches" "customers" "orders" "inventory_items" "quality_checks" "financial_records")

echo -e "${CYAN}Table verification:${NC}"
for table in "${tables[@]}"; do
    source_count=$(psql -t "$SOURCE_URL" -c "SELECT COUNT(*) FROM \"$table\"" 2>/dev/null | tr -d ' ')
    target_count=$(psql -t "$TARGET_URL" -c "SELECT COUNT(*) FROM \"$table\"" 2>/dev/null | tr -d ' ')
    
    if [[ "$source_count" =~ ^[0-9]+$ ]] && [[ "$target_count" =~ ^[0-9]+$ ]]; then
        if [ "$source_count" = "$target_count" ]; then
            echo -e "  ${GREEN}✅ $table: $source_count rows${NC}"
        else
            echo -e "  ${YELLOW}⚠️  $table: $source_count → $target_count rows (mismatch)${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  $table: Unable to verify${NC}"
    fi
done

# Show summary of cloned data
echo
echo -e "${CYAN}🌱 Microgreens Management Data Summary:${NC}"

# Check for key business entities
USER_COUNT=$(psql -t "$TARGET_URL" -c "SELECT COUNT(*) FROM \"users\"" 2>/dev/null | tr -d ' ')
BATCH_COUNT=$(psql -t "$TARGET_URL" -c "SELECT COUNT(*) FROM \"batches\"" 2>/dev/null | tr -d ' ')
CUSTOMER_COUNT=$(psql -t "$TARGET_URL" -c "SELECT COUNT(*) FROM \"customers\"" 2>/dev/null | tr -d ' ')
ORDER_COUNT=$(psql -t "$TARGET_URL" -c "SELECT COUNT(*) FROM \"orders\"" 2>/dev/null | tr -d ' ')

echo -e "${CYAN}  • Users (roles & permissions): ${USER_COUNT}${NC}"
echo -e "${CYAN}  • Production batches: ${BATCH_COUNT}${NC}"
echo -e "${CYAN}  • Customer accounts: ${CUSTOMER_COUNT}${NC}"
echo -e "${CYAN}  • Order history: ${ORDER_COUNT}${NC}"

echo -e "${GREEN}🎉 Microgreens management database clone from ${SOURCE_DB} to ${TARGET_DB} completed successfully!${NC}"
echo -e "${CYAN}💡 Test your microgreens management system with: ./scripts/dev-instances.sh deploy:clean${NC}"
