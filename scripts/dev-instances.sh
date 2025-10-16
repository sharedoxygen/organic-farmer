#!/bin/bash

# 🌱 The Microgreens Management System (TMMS) - Development & Testing Workflow
# Comprehensive development workflow for microgreens business management system

case "$1" in
  "dev")
    echo "🌱 Starting The Microgreens Management System (TMMS) development..."
    echo "📍 Development: http://localhost:3005"
    echo "💡 Use './scripts/dev-instances.sh deploy' to create test version"
    echo "🎯 Full microgreens business management with USDA organic compliance"
    npm run dev
    ;;
  "deploy")
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
      echo "⚠️  WARNING: You have uncommitted changes!"
      echo "📝 Current deploy includes ALL working directory changes"
      echo "💡 Use 'deploy:clean' for git-based stable deployment"
      echo ""
      read -p "Continue with current working directory? (y/N): " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deploy cancelled"
        exit 1
      fi
    fi
    echo "🔨 Building production version for testing..."
    echo "📂 Source: Current working directory (including uncommitted changes)"
    echo "🌱 Microgreens management system with USDA compliance features"
    npm run build
    echo "🔧 Ensuring build artifacts are complete..."
    # Create BUILD_ID if missing
    if [ ! -f ".next/BUILD_ID" ]; then
        echo "📝 Creating missing BUILD_ID file..."
        echo "$(date +%s)-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" > .next/BUILD_ID
        echo "✅ BUILD_ID created"
    else
        echo "✅ BUILD_ID exists"
    fi
    
    # Fix prerender-manifest if needed
    if [ ! -f ".next/prerender-manifest.json" ]; then
        if [ -f ".next/prerender-manifest.js" ]; then
            echo "🔄 Converting prerender-manifest.js to JSON format..."
            echo '{"preview":{"previewModeId":"60cff74ed59b1ba374aea8580e4bbab2","previewModeSigningKey":"485fef83412fc8c5d567277c701844dacbe56c58961f20eee726266866d16969","previewModeEncryptionKey":"4efc90d7593440c899c5921071019cafd459f265b482f4951fb7feb544233891"}}' > .next/prerender-manifest.json
            echo "✅ prerender-manifest.json created"
        else
            echo "📝 Creating default prerender-manifest.json..."
            echo '{"preview":{"previewModeId":"60cff74ed59b1ba374aea8580e4bbab2","previewModeSigningKey":"485fef83412fc8c5d567277c701844dacbe56c58961f20eee726266866d16969","previewModeEncryptionKey":"4efc90d7593440c899c5921071019cafd459f265b482f4951fb7feb544233891"}}' > .next/prerender-manifest.json
            echo "✅ prerender-manifest.json created"
        fi
    else
        echo "✅ prerender-manifest.json exists"
    fi
    echo "🧪 Starting test instance on port 7035..."
    echo "📍 Test (Production Build): http://localhost:7035"
    echo "🎯 Production build for microgreens business management testing"
    PORT=7035 npm run start
    ;;
  "deploy:clean")
    # Check if .next build directory exists
    if [ ! -d ".next" ]; then
      echo "❌ No .next build directory found"
      echo "💡 Run 'npm run build' first to create a production build"
      echo "📝 Or use './scripts/dev-instances.sh deploy' to build and deploy"
      exit 1
    fi
    
    # Check if essential build files exist
    if [ ! -f ".next/BUILD_ID" ]; then
      echo "❌ Invalid .next build - BUILD_ID missing"
      echo "💡 Run 'npm run build' to create a complete production build"
      exit 1
    fi
    
    echo "🔨 Using existing production build from .next directory..."
    echo "📂 Source: Local .next production build artifacts"
    echo "🗄️  Database: farmer_microgreens_test (isolated test environment)"
    echo "🎯 This deploys the existing build with test database"
    
    # Get build timestamp from BUILD_ID if available
    if [ -f ".next/BUILD_ID" ]; then
      BUILD_ID=$(cat .next/BUILD_ID)
      echo "🏗️  Build ID: $BUILD_ID"
    fi
    
    # Load environment variables for test database
    [[ -f .env ]] && source .env
    [[ -f .env.local ]] && source .env.local
    
    # Verify DATABASE_URL_TEST is available
    if [[ -z "$DATABASE_URL_TEST" ]]; then
      echo "⚠️ DATABASE_URL_TEST not found in environment variables!"
      echo "❌ Test deployment requires DATABASE_URL_TEST to be defined in .env or .env.local"
      echo "💡 Example: DATABASE_URL_TEST=\"postgresql://user:pass@localhost:5432/farmer_microgreens_test\""
      exit 1
    fi
    
    # Configure for test environment
    export DATABASE_URL="$DATABASE_URL_TEST"
    export DATABASE_NAME="farmer_microgreens_test"
    export NEXT_PUBLIC_IS_TEST_ENV=true
    
    echo "🗄️ Using database connection: $DATABASE_URL_TEST"
    
    echo "🔧 Ensuring build artifacts are complete..."
    
    # Create BUILD_ID if missing
    if [ ! -f ".next/BUILD_ID" ]; then
        echo "📝 Creating missing BUILD_ID file..."
        echo "$(date +%s)-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" > .next/BUILD_ID
        echo "✅ BUILD_ID created"
    else
        echo "✅ BUILD_ID exists"
    fi
    
    # Fix prerender-manifest if needed
    if [ ! -f ".next/prerender-manifest.json" ]; then
        if [ -f ".next/prerender-manifest.js" ]; then
            echo "🔄 Converting prerender-manifest.js to JSON format..."
            echo '{"preview":{"previewModeId":"60cff74ed59b1ba374aea8580e4bbab2","previewModeSigningKey":"485fef83412fc8c5d567277c701844dacbe56c58961f20eee726266866d16969","previewModeEncryptionKey":"4efc90d7593440c899c5921071019cafd459f265b482f4951fb7feb544233891"}}' > .next/prerender-manifest.json
            echo "✅ prerender-manifest.json created"
        else
            echo "📝 Creating default prerender-manifest.json..."
            echo '{"preview":{"previewModeId":"60cff74ed59b1ba374aea8580e4bbab2","previewModeSigningKey":"485fef83412fc8c5d567277c701844dacbe56c58961f20eee726266866d16969","previewModeEncryptionKey":"4efc90d7593440c899c5921071019cafd459f265b482f4951fb7feb544233891"}}' > .next/prerender-manifest.json
            echo "✅ prerender-manifest.json created"
        fi
    else
        echo "✅ prerender-manifest.json exists"
    fi
    
    # Verify test database has seed data for microgreens management
    echo "🔍 Verifying test database seed data..."
    
    # Check if psql is available and verify microgreens data
    if command -v psql >/dev/null 2>&1; then
      # Extract connection details from DATABASE_URL_TEST
      DB_USER=$(echo "$DATABASE_URL_TEST" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
      DB_HOST=$(echo "$DATABASE_URL_TEST" | sed -n 's/.*@\([^:]*\):.*/\1/p')
      DB_NAME=$(echo "$DATABASE_URL_TEST" | sed -n 's/.*\/\([^?]*\).*/\1/p')
      
      USER_COUNT=$(PGPASSWORD="$(echo "$DATABASE_URL_TEST" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"users\"" 2>/dev/null | tr -d ' ')
      
      # Ensure USER_COUNT is numeric
      if [[ "$USER_COUNT" =~ ^[0-9]+$ ]]; then
        if [ "$USER_COUNT" -lt 1 ]; then
          echo "⚠️ Test database may not be properly seeded (only $USER_COUNT users found)"
          echo "🌱 Consider seeding test database with microgreens management data..."
          
          # Ask if the user wants to seed the test database
          read -p "Do you want to seed the test database now? (y/N): " -n 1 -r
          echo
          if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🌱 Seeding test database for microgreens management..."
            npm run db:seed
            echo "✅ Test database seeded successfully!"
          else
            echo "⚠️ Continuing with potentially empty test database"
          fi
        else
          echo "✅ Test database appears to be properly seeded ($USER_COUNT users found)"
        fi
      else
        echo "⚠️ Could not verify database connection (psql returned non-numeric result)"
        echo "🚀 Continuing with deployment anyway..."
      fi
    else
      echo "⚠️ psql command not found - cannot verify database seed data"
      echo "💡 Install PostgreSQL client tools with: brew install postgresql"
      echo "🚀 Continuing with deployment anyway..."
    fi
    
    echo "🧪 Starting production instance from existing build on port 7035..."
    echo "📍 Test (Production Build): http://localhost:7035"
    echo "🎯 Using existing .next production build artifacts"
    echo "🗄️  Using farmer_microgreens_test database with test environment"
    echo "💡 To rebuild first, use './scripts/dev-instances.sh deploy'"
    
    PORT=7035 npm run start
    ;;
  "deploy:clean:git")
    # Store current branch
    CURRENT_BRANCH=$(git branch --show-current)
    
    # Check if publish branch exists
    if ! git show-ref --verify --quiet refs/heads/publish; then
      echo "❌ 'publish' branch does not exist"
      echo "💡 Create it with: git checkout -b publish"
      echo "📝 Then merge/cherry-pick your stable microgreens management code to publish branch"
      exit 1
    fi
    
    # Stash any uncommitted changes to preserve them
    STASH_NEEDED=false
    if ! git diff-index --quiet HEAD --; then
      echo "📦 Temporarily stashing uncommitted changes for clean deployment..."
      git stash push -m "Auto-stash for deploy:clean:git - will be restored"
      STASH_NEEDED=true
    fi
    
    # Stash any untracked files if they exist
    if [ -n "$(git ls-files --others --exclude-standard)" ]; then
      echo "📦 Stashing untracked files..."
      git add .
      git stash push -m "Auto-stash untracked files for deploy:clean:git"
      STASH_UNTRACKED=true
    else
      STASH_UNTRACKED=false
    fi
    
    echo "🔄 Switching to 'publish' branch for deployment..."
    git checkout publish
    
    # Get commit info from publish branch
    COMMIT=$(git rev-parse --short HEAD)
    
    echo "🔨 Building production version from 'publish' branch..."
    echo "📂 Source: 'publish' branch at commit $COMMIT"
    echo "🗄️  Database: farmer_microgreens_test (isolated test environment)"
    echo "🌱 Building microgreens management system with USDA compliance"
    
    # Load environment variables for test database
    [[ -f .env ]] && source .env
    [[ -f .env.local ]] && source .env.local
    
    # Verify DATABASE_URL_TEST is available
    if [[ -z "$DATABASE_URL_TEST" ]]; then
      echo "⚠️ DATABASE_URL_TEST not found in environment variables!"
      echo "❌ Test deployment requires DATABASE_URL_TEST to be defined in .env or .env.local"
      echo "💡 Example: DATABASE_URL_TEST=\"postgresql://user:pass@localhost:5432/farmer_microgreens_test\""
      exit 1
    fi
    
    # Configure for test environment
    export DATABASE_URL="$DATABASE_URL_TEST"
    export DATABASE_NAME="farmer_microgreens_test"
    echo "🗄️ Using database connection: $DATABASE_URL_TEST"
    
    NEXT_PUBLIC_IS_TEST_ENV=true npm run build
    
    echo "🔧 Ensuring build artifacts are complete..."
    # Create BUILD_ID if missing
    if [ ! -f ".next/BUILD_ID" ]; then
        echo "📝 Creating missing BUILD_ID file..."
        echo "$(date +%s)-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" > .next/BUILD_ID
        echo "✅ BUILD_ID created"
    else
        echo "✅ BUILD_ID exists"
    fi
    
    # Fix prerender-manifest if needed
    if [ ! -f ".next/prerender-manifest.json" ]; then
        if [ -f ".next/prerender-manifest.js" ]; then
            echo "🔄 Converting prerender-manifest.js to JSON format..."
            echo '{"preview":{"previewModeId":"60cff74ed59b1ba374aea8580e4bbab2","previewModeSigningKey":"485fef83412fc8c5d567277c701844dacbe56c58961f20eee726266866d16969","previewModeEncryptionKey":"4efc90d7593440c899c5921071019cafd459f265b482f4951fb7feb544233891"}}' > .next/prerender-manifest.json
            echo "✅ prerender-manifest.json created"
        else
            echo "📝 Creating default prerender-manifest.json..."
            echo '{"preview":{"previewModeId":"60cff74ed59b1ba374aea8580e4bbab2","previewModeSigningKey":"485fef83412fc8c5d567277c701844dacbe56c58961f20eee726266866d16969","previewModeEncryptionKey":"4efc90d7593440c899c5921071019cafd459f265b482f4951fb7feb544233891"}}' > .next/prerender-manifest.json
            echo "✅ prerender-manifest.json created"
        fi
    else
        echo "✅ prerender-manifest.json exists"
    fi
    
    echo "🔄 Returning to '$CURRENT_BRANCH' branch..."
    git checkout "$CURRENT_BRANCH"
    
    # Restore any stashed files
    if [ "$STASH_UNTRACKED" = true ]; then
      echo "📦 Restoring stashed untracked files..."
      git stash pop
    fi
    
    if [ "$STASH_NEEDED" = true ]; then
      echo "📦 Restoring stashed uncommitted changes..."
      git stash pop
    fi
    
    echo "🧪 Starting isolated test instance on port 7035..."
    echo "📍 Test (Production Build): http://localhost:7035"
    echo "🎯 Stable build from 'publish' branch (commit $COMMIT)"
    echo "🗄️  Using farmer_microgreens_test database with seed data"
    echo "🌱 Complete microgreens business management system"
    
    # Set environment variables for the test instance
    # Load environment variables from .env and .env.local
    [[ -f .env ]] && source .env
    [[ -f .env.local ]] && source .env.local
    
    # Verify DATABASE_URL_TEST is available
    if [[ -z "$DATABASE_URL_TEST" ]]; then
      echo "⚠️ DATABASE_URL_TEST not found in environment variables!"
      echo "❌ Test deployment requires DATABASE_URL_TEST to be defined in .env or .env.local"
      exit 1
    fi
    
    # Configure for test environment
    export DATABASE_URL="$DATABASE_URL_TEST"
    export DATABASE_NAME="farmer_microgreens_test"
    export NEXT_PUBLIC_IS_TEST_ENV=true
    
    echo "🗄️ Using database connection: $DATABASE_URL_TEST"
    
    # Verify test database has seed data for microgreens
    echo "🔍 Verifying test database seed data..."
    
    # Check if psql is available and verify microgreens data
    if command -v psql >/dev/null 2>&1; then
      # Extract connection details from DATABASE_URL_TEST
      DB_USER=$(echo "$DATABASE_URL_TEST" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
      DB_HOST=$(echo "$DATABASE_URL_TEST" | sed -n 's/.*@\([^:]*\):.*/\1/p')
      DB_NAME=$(echo "$DATABASE_URL_TEST" | sed -n 's/.*\/\([^?]*\).*/\1/p')
      
      USER_COUNT=$(PGPASSWORD="$(echo "$DATABASE_URL_TEST" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"users\"" 2>/dev/null | tr -d ' ')
      
      # Ensure USER_COUNT is numeric
      if [[ "$USER_COUNT" =~ ^[0-9]+$ ]]; then
        if [ "$USER_COUNT" -lt 1 ]; then
          echo "⚠️ Test database may not be properly seeded (only $USER_COUNT users found)"
          echo "🌱 Consider seeding test database with microgreens management data..."
          
          # Ask if the user wants to seed the test database
          read -p "Do you want to seed the test database now? (y/N): " -n 1 -r
          echo
          if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🌱 Seeding test database for microgreens management..."
            npm run db:seed
            echo "✅ Test database seeded successfully!"
          else
            echo "⚠️ Continuing with potentially empty test database"
          fi
        else
          echo "✅ Test database appears to be properly seeded ($USER_COUNT users found)"
        fi
      else
        echo "⚠️ Could not verify database connection (psql returned non-numeric result)"
        echo "🚀 Continuing with deployment anyway..."
      fi
    else
      echo "⚠️ psql command not found - cannot verify database seed data"
      echo "💡 Install PostgreSQL client tools with: brew install postgresql"
      echo "🚀 Continuing with deployment anyway..."
    fi
    
    PORT=7035 npm run start
    ;;
  "deploy:commit")
    # Deploy from specific commit
    if [ -z "$2" ]; then
      echo "❌ Please specify a commit hash"
      echo "Usage: $0 deploy:commit <commit-hash>"
      echo "Example: $0 deploy:commit abc123"
      exit 1
    fi
    
    COMMIT="$2"
    echo "🔨 Building microgreens management system from specific commit: $COMMIT"
    
    # Stash current changes if any
    STASH_NEEDED=false
    if ! git diff-index --quiet HEAD --; then
      echo "📦 Stashing current changes..."
      git stash push -m "Auto-stash for deploy:commit $COMMIT"
      STASH_NEEDED=true
    fi
    
    # Checkout specific commit
    git checkout "$COMMIT"
    
    # Build and run
    echo "🔨 Building production version for microgreens management..."
    npm run build
    echo "🔧 Ensuring build artifacts are complete..."
    # Create BUILD_ID if missing
    if [ ! -f ".next/BUILD_ID" ]; then
        echo "📝 Creating missing BUILD_ID file..."
        echo "$(date +%s)-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" > .next/BUILD_ID
        echo "✅ BUILD_ID created"
    else
        echo "✅ BUILD_ID exists"
    fi
    
    # Fix prerender-manifest if needed
    if [ ! -f ".next/prerender-manifest.json" ]; then
        if [ -f ".next/prerender-manifest.js" ]; then
            echo "🔄 Converting prerender-manifest.js to JSON format..."
            echo '{"preview":{"previewModeId":"60cff74ed59b1ba374aea8580e4bbab2","previewModeSigningKey":"485fef83412fc8c5d567277c701844dacbe56c58961f20eee726266866d16969","previewModeEncryptionKey":"4efc90d7593440c899c5921071019cafd459f265b482f4951fb7feb544233891"}}' > .next/prerender-manifest.json
            echo "✅ prerender-manifest.json created"
        else
            echo "📝 Creating default prerender-manifest.json..."
            echo '{"preview":{"previewModeId":"60cff74ed59b1ba374aea8580e4bbab2","previewModeSigningKey":"485fef83412fc8c5d567277c701844dacbe56c58961f20eee726266866d16969","previewModeEncryptionKey":"4efc90d7593440c899c5921071019cafd459f265b482f4951fb7feb544233891"}}' > .next/prerender-manifest.json
            echo "✅ prerender-manifest.json created"
        fi
    else
        echo "✅ prerender-manifest.json exists"
    fi
    echo "🧪 Starting test instance on port 7035..."
    echo "📍 Test (Production Build): http://localhost:7035"
    echo "🎯 Microgreens management system from commit $COMMIT"
    
    # Start in background so we can restore git state
    PORT=7035 npm run start &
    
    # Restore git state
    git checkout -
    if [ "$STASH_NEEDED" = true ]; then
      echo "📦 Restoring stashed changes..."
      git stash pop
    fi
    
    # Wait for server
    wait
    ;;
  "deploy:test-env")
    echo "🔨 Building microgreens management system with test environment..."
    npm run build:test
    echo "🧪 Starting test instance with test environment..."
    echo "📍 Test: http://localhost:7035"
    npm run start:test
    ;;
  "quick")
    echo "⚡ Quick test deployment (using current build)..."
    echo "📍 Test: http://localhost:7035"
    echo "🌱 The Microgreens Management System (TMMS) - Production Build"
    npm run test:quick
    ;;
  "stop")
    echo "🛑 Stopping all microgreens management instances..."
    pkill -f "next"
    pkill -f "node .next"
    ;;
  "status")
    echo "📊 Checking microgreens management system port status..."
    echo "Port 3005 (dev):"
    lsof -i :3005 || echo "  Not running"
    echo "Port 7035 (test):"
    lsof -i :7035 || echo "  Not running"
    ;;
  "setup:publish")
    # Check if publish branch already exists
    if git show-ref --verify --quiet refs/heads/publish; then
      echo "✅ 'publish' branch already exists"
      CURRENT_COMMIT=$(git rev-parse --short publish)
      echo "📍 Current publish branch is at commit: $CURRENT_COMMIT"
      echo ""
      echo "To update publish branch with current microgreens management work:"
      echo "  git checkout publish"
      echo "  git merge $(git branch --show-current)"
      exit 0
    fi
    
    echo "🔧 Setting up 'publish' branch for microgreens management deployment workflow..."
    
    # Store current branch
    CURRENT_BRANCH=$(git branch --show-current)
    
    # Check if working directory is clean
    if ! git diff-index --quiet HEAD --; then
      echo "❌ Please commit your microgreens management changes before setting up publish branch"
      echo ""
      echo "Uncommitted files:"
      git status --porcelain
      exit 1
    fi
    
    # Create publish branch from current HEAD
    echo "📝 Creating 'publish' branch from current state..."
    git checkout -b publish
    
    # Return to original branch
    echo "🔄 Returning to '$CURRENT_BRANCH' branch..."
    git checkout "$CURRENT_BRANCH"
    
    echo "✅ 'publish' branch created successfully!"
    echo ""
    echo "🎯 Microgreens Management Workflow now ready:"
    echo "  1. Develop microgreens features on feature branches"
    echo "  2. When ready for testing, merge to 'publish': git checkout publish && git merge $CURRENT_BRANCH"
    echo "  3. Deploy stable version: ./scripts/dev-instances.sh deploy:clean:git"
    echo ""
    ;;
  "deploy:prod")
    echo "🚀 Deploying OFMS to PRODUCTION environment..."
    # Load production environment variables
    [[ -f .env ]] && source .env
    [[ -f .env.production ]] && source .env.production

    if [[ -z "$DATABASE_URL" ]]; then
      echo "❌ DATABASE_URL not set! Production deploy requires a real production database connection string."
      exit 1
    fi

    echo "🗄️ Using production database: $DATABASE_URL"
    echo "🔨 Building production version..."
    NODE_ENV=production npm run build

    echo "🧑‍🌾 Starting production instance on port 8050..."
    PORT=8050 NODE_ENV=production npm run start
    ;;
  "seed")
    echo "🌱 Seeding database with current afarm_d operational data..."
    echo "📊 Loading real production data (farms, customers, batches, orders)"
    
    # Check if target database is different from source
    if [[ "$DATABASE_URL" == *"afarm_d"* ]]; then
      echo "⚠️  Target database is afarm_d (source) - no seeding needed"
      echo "✅ Already using the live operational database"
    else
      echo "🗄️  Extracting current operational data from afarm_d..."
      
      # Extract data from afarm_d and load into current database
      TEMP_FILE="/tmp/afarm_d_seed_data.sql"
      
      # Extract comprehensive data from afarm_d (exclude batches due to schema differences)
      pg_dump -h localhost -U postgres -d afarm_d \
        --data-only \
        --table=farms \
        --table=users \
        --table=seed_varieties \
        --table=customers \
        --table=orders \
        --table=order_items \
        --disable-triggers \
        --no-owner --no-privileges > "$TEMP_FILE"
      
      echo "⚠️  Note: Batches table skipped due to schema differences (afarm_d has additional columns)"
      
      if [ -f "$TEMP_FILE" ]; then
        echo "📥 Loading operational data into current database..."
        # Get target database name
        DB_NAME="$(echo $DATABASE_URL | sed 's/.*\///')"
        
        # Clear existing data first (in reverse dependency order)
        psql -h localhost -U postgres -d "$DB_NAME" -c "
          DELETE FROM order_items;
          DELETE FROM orders;
          DELETE FROM customers;
          DELETE FROM seed_varieties;
          DELETE FROM users;
          DELETE FROM farms;
        " >/dev/null 2>&1
        
        # Load the data with disabled triggers to handle foreign key constraints
        psql -h localhost -U postgres -d "$DB_NAME" -c "SET session_replication_role = replica;" >/dev/null 2>&1
        psql -h localhost -U postgres -d "$DB_NAME" -f "$TEMP_FILE" >/dev/null 2>&1
        psql -h localhost -U postgres -d "$DB_NAME" -c "SET session_replication_role = DEFAULT;" >/dev/null 2>&1
        
        rm "$TEMP_FILE"
        echo "✅ Database seeded with current operational data from afarm_d"
      else
        echo "❌ Failed to extract data from afarm_d"
      fi
    fi
    ;;
  "seed:comprehensive")
    echo "🌱 Comprehensive seeding with current operational data..."
    echo "📊 Loading complete afarm_d dataset including historical data"
    
    if [[ "$DATABASE_URL" == *"afarm_d"* ]]; then
      echo "⚠️  Target database is afarm_d (source) - no seeding needed"
      echo "✅ Already using the complete operational database"
    else
      echo "🗄️  Extracting complete operational dataset from afarm_d..."
      
      # Extract comprehensive data from afarm_d
      TEMP_FILE="/tmp/afarm_d_comprehensive_data.sql"
      
      # Extract all operational data
      pg_dump -h localhost -U postgres -d afarm_d \
        --data-only \
        --no-owner --no-privileges > "$TEMP_FILE"
      
      if [ -f "$TEMP_FILE" ]; then
        echo "📥 Loading comprehensive data into current database..."
        psql -h localhost -U postgres -d "$(echo $DATABASE_URL | sed 's/.*\///')" < "$TEMP_FILE"
        rm "$TEMP_FILE"
        echo "✅ Database seeded with comprehensive operational data"
      else
        echo "❌ Failed to extract comprehensive data from afarm_d"
      fi
    fi
    ;;
  "check:health")
    echo "🔍 Running database health check..."
    node scripts/ofms-database-tools.js --check=all --report=summary
    ;;
  "check:quality")
    echo "🔍 Running quality assurance checks..."
    node scripts/ofms-quality-checker.js --check=all --report=summary
    ;;
  "backup")
    echo "💾 Creating database backup..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).sql"
    node scripts/ofms-database-tools.js --backup="$BACKUP_NAME"
    echo "✅ Backup created: $BACKUP_NAME"
    ;;
  "reset:clean")
    echo "🔄 Clean reset with current operational data..."
    echo "⚠️  This will reset the database and load current afarm_d data"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "🗑️  Resetting database..."
      node scripts/ofms-data-seeder.js --reset --verbose
      echo "✅ Clean reset completed with current operational data"
    else
      echo "❌ Reset cancelled"
    fi
    ;;
  "generate")
    echo "🌱 Loading current operational data without reset..."
    echo "📊 Adding current afarm_d data to existing database"
    node scripts/ofms-data-seeder.js --verbose
    echo "✅ Current operational data loaded"
    ;;
  "audit")
    echo "🔍 Running comprehensive system audit..."
    echo "📊 This includes integrity, accuracy, and compliance checks"
    node scripts/ofms-database-tools.js --audit=full --report=detailed
    ;;
  *)
    echo "🌱 The Microgreens Management System (TMMS) - Development & Testing Workflow"
    echo ""
    echo "✨ Best Practice Workflow for Microgreens Business Management:"
    echo "   1. Develop on port 3005 with hot reload"
    echo "   2. Deploy stable builds to port 7035 for testing"
    echo "   3. Complete USDA organic compliance testing"
    echo ""
    echo "Usage: $0 {dev|deploy|deploy:clean|deploy:clean:git|deploy:commit|deploy:test-env|quick|stop|status|setup:publish|deploy:prod|seed|seed:comprehensive|check:health|check:quality|backup|reset:clean|generate|audit}"
    echo ""
    echo "🚀 Deployment Commands:"
    echo "  dev             - Start development server (port 3005)"
    echo "  deploy          - Build & deploy from working directory (includes uncommitted changes)"
    echo "  deploy:clean    - Deploy using existing .next build with farmer_microgreens_test database"
    echo "  deploy:clean:git - Build & deploy from 'publish' branch (stable code only)"
    echo "  deploy:commit   - Build & deploy from specific commit (e.g., deploy:commit abc123)"
    echo "  deploy:test-env - Build & deploy with test environment"
    echo "  deploy:prod     - Deploy to production environment"
    echo "  quick           - Quick deploy using existing build"
    echo "  stop            - Stop all running instances"
    echo "  status          - Check which instances are running"
    echo "  setup:publish   - Set up 'publish' branch for deployment workflow"
    echo ""
    echo "🌱 Data Management Commands:"
    echo "  seed            - Quick seed with demo data (small dataset)"
    echo "  seed:comprehensive - Full business data seeding (large dataset)"
    echo "  generate <mode> - Generate data (demo|comprehensive|ai-showcase|production|testing)"
    echo "  reset:clean     - Reset database and load fresh demo data"
    echo ""
    echo "🔍 Quality & Health Commands:"
    echo "  check:health    - Run database health checks"
    echo "  check:quality   - Run code quality assurance checks"
    echo "  audit           - Comprehensive system audit"
    echo "  backup          - Create database backup"
    echo ""
    echo "Deployment Sources:"
    echo "  📂 deploy          → Current working directory (uncommitted changes included)"
    echo "  🚀 deploy:clean    → Existing .next build with farmer_microgreens_test database"
    echo "  🔒 deploy:clean:git → 'publish' branch (stable, tested code with rebuild)"
    echo "  📌 deploy:commit   → Specific git commit"
    echo ""
    echo "Microgreens Management Workflow:"
    echo "  📝 Code changes     →  ./scripts/dev-instances.sh dev"
    echo "  🔨 Build once      →  npm run build"
    echo "  🚀 Test deploy     →  ./scripts/dev-instances.sh deploy:clean"
    echo "  🚧 Test WIP        →  ./scripts/dev-instances.sh deploy"
    echo "  ✅ Promote code    →  git checkout publish && git merge your-branch"
    echo "  🎯 Deploy stable   →  ./scripts/dev-instances.sh deploy:clean:git"
    echo "  🔄 Continue dev    →  Keep coding on port 3005"
    echo ""
    echo "URLs:"
    echo "  Development: http://localhost:3005  (Hot reload, debugging, USDA compliance features)"
    echo "  Testing:     http://localhost:7035  (Production build, stable microgreens management)"
    echo ""
    echo "🌿 Features Available:"
    echo "  • USDA Organic Compliance & Seed Sourcing Documentation"
    echo "  • Production Planning & Batch Management"
    echo "  • Inventory Management (Seeds, Supplies, Packaging)"
    echo "  • Customer & Order Management"
    echo "  • Quality Control & Food Safety"
    echo "  • Financial Analytics & Reporting"
    echo "  • Multi-Role Access Control"
    ;;
esac 