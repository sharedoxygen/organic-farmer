#!/bin/bash
# Description: Sets the DATABASE_URL environment variable for the current shell session.
# Usage: source scripts/set-db-env.sh [dev|test]
#
# Arguments:
#   dev:  Sets DATABASE_URL to afarm_d (development)
#   test: Sets DATABASE_URL to afarm_t (testing)

# --- Configuration ---
# IMPORTANT: Update these URLs if your database connection details are different.
DEV_DB_URL="process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database'"
TEST_DB_URL="process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/database'"

# --- Logic ---
if [ "$1" == "dev" ]; then
  export DATABASE_URL=$DEV_DB_URL
  echo "✅ Environment set for DEVELOPMENT (afarm_d)"
  echo "DATABASE_URL=$DATABASE_URL"
elif [ "$1" == "test" ]; then
  export DATABASE_URL=$TEST_DB_URL
  echo "✅ Environment set for TESTING (afarm_t)"
  echo "DATABASE_URL=$DATABASE_URL"
else
  echo "❌ Invalid argument. Please use 'dev' or 'test'."
  echo "Usage: source scripts/set-db-env.sh [dev|test]"
fi
