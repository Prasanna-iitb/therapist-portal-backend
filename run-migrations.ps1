# Migration Runner Script - Executes database migrations
# This script reads and executes all SQL migration files in the migrations folder

param(
    [string]$DatabaseUrl,
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "postgres",
    [string]$DbPassword,
    [string]$DbName = "audio_mvp"
)

# Import required modules
Import-Module Posh-SSH -ErrorAction SilentlyContinue

# Set up connection string
if (-not [string]::IsNullOrEmpty($DatabaseUrl)) {
    $ConnectionString = $DatabaseUrl
} else {
    # Build connection string from individual parameters
    $ConnectionString = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}"
}

# Verify psql is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql is not installed or not in PATH"
    Write-Host "Please install PostgreSQL client tools"
    exit 1
}

# Get migration files
$migrationDir = Join-Path (Split-Path $PSScriptRoot) "migrations"
Write-Host "Looking for migrations in: $migrationDir"

if (-not (Test-Path $migrationDir)) {
    Write-Host "ERROR: Migrations directory not found at $migrationDir"
    exit 1
}

$migrationFiles = Get-ChildItem -Path $migrationDir -Filter "*.sql" | Sort-Object Name

if ($migrationFiles.Count -eq 0) {
    Write-Host "No migration files found in $migrationDir"
    exit 0
}

Write-Host "Found $($migrationFiles.Count) migration file(s)"
Write-Host ""

# Execute migrations
foreach ($file in $migrationFiles) {
    Write-Host "Executing migration: $($file.Name)"
    
    try {
        if ($DatabaseUrl) {
            # Use DATABASE_URL format
            psql "$DatabaseUrl" -f $file.FullName
        } else {
            # Use individual connection parameters
            psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $file.FullName
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Migration completed successfully"
        } else {
            Write-Host "✗ Migration failed with exit code: $LASTEXITCODE"
            exit 1
        }
    } catch {
        Write-Host "ERROR: Failed to execute migration: $_"
        exit 1
    }
    
    Write-Host ""
}

Write-Host "All migrations completed successfully!"
