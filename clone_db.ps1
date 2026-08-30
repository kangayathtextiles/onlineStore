<#
.SYNOPSIS
Securely clones the kangayath-db (Production) to kangayath-db-staging (Staging).

.DESCRIPTION
This script uses pg_dump and psql to safely export the schema and data from 
your production database and import it into your staging database. 

.INSTRUCTIONS
1. Go to your Render Dashboard (https://dashboard.render.com).
2. Click on your Production PostgreSQL database ("kangayath-db").
3. Scroll down to "Connections" and copy the "External Database URL". Paste it into $PROD_DB_URL below.
4. Go back and click on your Staging PostgreSQL database ("kangayath-db-staging").
5. Copy its "External Database URL" and paste it into $STAGING_DB_URL below.
6. Run this script in your PowerShell terminal: .\clone_db.ps1
#>

# 🔴 Replace these with your actual External Database URLs from Render
$PROD_DB_URL = "postgresql://USER:PASSWORD@HOST/kangayath_db"
$STAGING_DB_URL = "postgresql://postgres.gdojzkljtarbnwrmimes:%40Abinabi9947@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?options=-c%20search_path=staging"

$BACKUP_FILE = "production_backup.sql"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Database Clone: Prod -> Staging" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Step 1: Export from Production
Write-Host "`n[1/3] Securely exporting data from Production Database..." -ForegroundColor Yellow
# We use --clean to drop existing objects in staging before restoring, ensuring a perfect clone.
# We exclude privileges and owners since Render manages these automatically.
pg_dump --no-owner --no-privileges --clean --if-exists --file=$BACKUP_FILE $PROD_DB_URL

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to export production database! Please check your PROD_DB_URL." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Export successful. Backup saved temporarily as $BACKUP_FILE." -ForegroundColor Green

# Step 2: Import into Staging
Write-Host "`n[2/3] Importing data into Staging Database..." -ForegroundColor Yellow
psql -d $STAGING_DB_URL -f $BACKUP_FILE

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to import into staging database! Please check your STAGING_DB_URL." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Import successful. Staging database is now an exact replica of Production." -ForegroundColor Green

# Step 3: Cleanup
Write-Host "`n[3/3] Cleaning up temporary backup file..." -ForegroundColor Yellow
Remove-Item -Path $BACKUP_FILE -Force
Write-Host "✅ Cleanup complete." -ForegroundColor Green

Write-Host "`n🎉 Database Cloning Complete!" -ForegroundColor Green
Write-Host "Your Staging API now has the exact same products, categories, and settings as Production." -ForegroundColor Cyan
