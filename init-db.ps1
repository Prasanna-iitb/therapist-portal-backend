# Script to initialize Supabase database schema
# Make sure you have psql installed or use Supabase SQL Editor

$DATABASE_URL = "postgresql://postgres.vzhyhdcpeyenkmlhjxrs:Prasanna@2409@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
$SCHEMA_FILE = "schema.sql"

Write-Host "Initializing database schema..." -ForegroundColor Green
Write-Host "You have two options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 (Recommended):" -ForegroundColor Cyan
Write-Host "1. Go to https://supabase.com/dashboard/project/vzhyhdcpeyenkmlhjxrs"
Write-Host "2. Click 'SQL Editor' in the sidebar"
Write-Host "3. Click 'New Query'"
Write-Host "4. Copy and paste the contents of backend/schema.sql"
Write-Host "5. Click 'Run'"
Write-Host ""
Write-Host "Option 2 (Command Line - if you have psql installed):" -ForegroundColor Cyan
Write-Host "psql `"$DATABASE_URL`" -f $SCHEMA_FILE"
Write-Host ""
Write-Host "Schema file location: backend/schema.sql" -ForegroundColor Green
