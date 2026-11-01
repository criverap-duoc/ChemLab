# audit.ps1 - Solo lectura. No modifica archivos.
$root = "C:\Users\tech\Todo\Todos\Repos\ChemLab"
$excludeDirs = @('node_modules','bin','obj','.git','.vs','.vscode','.idea','.next','build','dist','coverage','TestResults','.cache','Logs')
$excludeFiles = @('*.db','*.db-shm','*.db-wal','*.user','*.suo','package-lock.json','yarn.lock','*.log')

Write-Host "`n========== 1. ESTRUCTURA DE CARPETAS Y ARCHIVOS ==========" -ForegroundColor Cyan
Get-ChildItem -Path $root -Recurse -Force |
    Where-Object {
        $_.FullName -notmatch '\\(node_modules|bin|obj|\.git|\.vs|\.vscode|\.idea|\.next|build|dist|coverage|TestResults|\.cache|Logs)(\\|$)' -and
        $_.Name -notmatch '\.(db|db-shm|db-wal|user|suo|log)$'
    } |
    Sort-Object FullName |
    ForEach-Object {
        $rel = $_.FullName.Replace($root + '\','')
        if ($_.PSIsContainer) { Write-Host "[DIR]  $rel" -ForegroundColor DarkGray }
        else {
            $size = "{0,8:N0}" -f $_.Length
            Write-Host "[FILE] $size  $rel"
        }
    }

Write-Host "`n========== 2. PROYECTOS .NET Y VERSIONES ==========" -ForegroundColor Cyan
Get-ChildItem -Path $root -Recurse -Filter "*.csproj" |
    Where-Object { $_.FullName -notmatch '\\(bin|obj)(\\|$)' } |
    ForEach-Object {
        Write-Host "`n--- $($_.FullName.Replace($root+'\','')) ---" -ForegroundColor Yellow
        Select-String -Path $_.FullName -Pattern '<TargetFramework>(.*?)</TargetFramework>','<PackageReference Include="(.*?)" Version="(.*?)"' |
            ForEach-Object { $_.Line.Trim() }
    }

Write-Host "`n========== 3. ENTIDADES Y ENUMS (Domain) ==========" -ForegroundColor Cyan
$domainPath = Join-Path $root "ChemLabBackend\src\ChemLab.Domain"
if (Test-Path $domainPath) {
    Get-ChildItem -Path $domainPath -Recurse -Filter "*.cs" |
        ForEach-Object {
            $rel = $_.FullName.Replace($root+'\','')
            $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
            Write-Host "$rel  ($lines líneas)" -ForegroundColor Green
        }
} else { Write-Host "No encontrado: $domainPath" -ForegroundColor Red }

Write-Host "`n========== 4. ENDPOINTS (API) ==========" -ForegroundColor Cyan
$apiEndpoints = Join-Path $root "ChemLabBackend\src\ChemLab.API\Endpoints"
if (Test-Path $apiEndpoints) {
    Get-ChildItem -Path $apiEndpoints -Filter "*.cs" | ForEach-Object {
        $routes = Select-String -Path $_.FullName -Pattern 'Map(Get|Post|Put|Delete|Patch)\(' |
                 ForEach-Object { $_.Line.Trim() }
        Write-Host "`n$($_.Name)" -ForegroundColor Green
        $routes | ForEach-Object { Write-Host "  $_" }
    }
}

Write-Host "`n========== 5. DbSets EN ApplicationDbContext ==========" -ForegroundColor Cyan
$dbCtx = Join-Path $root "ChemLabBackend\src\ChemLab.Infrastructure\Data\ApplicationDbContext.cs"
if (Test-Path $dbCtx) {
    Select-String -Path $dbCtx -Pattern 'public DbSet<(.+?)>' | ForEach-Object { $_.Line.Trim() }
}

Write-Host "`n========== 6. MIGRACIONES ==========" -ForegroundColor Cyan
$migrations = Join-Path $root "ChemLabBackend\src\ChemLab.Infrastructure\Migrations"
if (Test-Path $migrations) {
    Get-ChildItem $migrations -Filter "*.cs" | Where-Object { $_.Name -notmatch 'ModelSnapshot' } |
        Sort-Object Name | ForEach-Object { Write-Host $_.Name }
}

Write-Host "`n========== 7. COMPONENTES FRONTEND ==========" -ForegroundColor Cyan
$frontendComponents = Join-Path $root "frontend\src\components"
if (Test-Path $frontendComponents) {
    Get-ChildItem $frontendComponents -Recurse -Filter "*.tsx" | ForEach-Object {
        Write-Host $_.FullName.Replace($root+'\','')
    }
}

Write-Host "`n========== 8. SERVICIOS FRONTEND ==========" -ForegroundColor Cyan
$frontendServices = Join-Path $root "frontend\src\services"
if (Test-Path $frontendServices) {
    Get-ChildItem $frontendServices -Filter "*.ts" | ForEach-Object {
        Write-Host $_.Name
    }
}

Write-Host "`n========== 9. TIPOS FRONTEND ==========" -ForegroundColor Cyan
$frontendTypes = Join-Path $root "frontend\src\types"
if (Test-Path $frontendTypes) {
    Get-ChildItem $frontendTypes -Filter "*.ts" | ForEach-Object {
        Write-Host $_.Name
    }
}

Write-Host "`n========== 10. ARCHIVOS FALTANTES CLAVE ==========" -ForegroundColor Cyan
$requiredFiles = @(
    "ChemLabBackend\ChemLabInventory.slnx",
    "ChemLabBackend\src\ChemLab.API\Program.cs",
    "ChemLabBackend\src\ChemLab.API\appsettings.json",
    "ChemLabBackend\src\ChemLab.API\appsettings.Development.json",
    "ChemLabBackend\src\ChemLab.Infrastructure\DependencyInjection.cs",
    "ChemLabBackend\src\ChemLab.Application\DependencyInjection.cs",
    "frontend\package.json",
    "frontend\src\App.tsx",
    "frontend\src\services\api.ts",
    "frontend\src\theme.ts",
    ".gitignore",
    "README.md"
)
foreach ($f in $requiredFiles) {
    $full = Join-Path $root $f
    if (Test-Path $full) { Write-Host "[OK]   $f" -ForegroundColor Green }
    else { Write-Host "[MISS] $f" -ForegroundColor Red }
}

Write-Host "`n========== FIN ==========" -ForegroundColor Cyan
Write-Host "Copia la salida completa y pásala al chat para planificar reparaciones." -ForegroundColor Yellow