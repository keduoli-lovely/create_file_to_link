# Run after `npm run tauri build`
# Patches the generated NSI installer to use custom icon and license.
# Requires makensis.exe (Tauri auto-installs it at %LOCALAPPDATA%\tauri\NSIS\Bin\makensis.exe)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

$ReleaseDir  = "$Root\src-tauri\target\release"
$NsisDir     = "$ReleaseDir\nsis\x64"
$BundleNsis  = "$ReleaseDir\bundle\nsis"
$NsiFile     = "$NsisDir\installer.nsi"
$IconFile    = "$Root\src-tauri\icons\link.ico"
$OutputName  = "create_file_to_link`_0.1.2_x64-setup.exe"

if (-not (Test-Path $NsiFile)) {
    Write-Host "ERROR: $NsiFile not found. Run 'npm run tauri build' first." -ForegroundColor Red
    exit 1
}

$makensis = "$env:LOCALAPPDATA\tauri\NSIS\Bin\makensis.exe"
if (-not (Test-Path $makensis)) {
    Write-Host "ERROR: makensis.exe not found at $makensis" -ForegroundColor Red
    exit 1
}

# 1. Patch INSTALLERICON
Write-Host "Patching $NsiFile ..." -ForegroundColor Cyan
$nsi = Get-Content $NsiFile -Raw -Encoding UTF8
$nsi = $nsi -replace '!define INSTALLERICON ""', "!define INSTALLERICON `"$IconFile`""
[System.IO.File]::WriteAllText($NsiFile, $nsi, [System.Text.UTF8Encoding]::new($false))
Write-Host "  INSTALLERICON -> $IconFile" -ForegroundColor Green

# 2. Re-run makensis
Write-Host "Building NSIS installer..." -ForegroundColor Cyan
Push-Location $NsisDir
& $makensis installer.nsi
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "ERROR: makensis failed (exit code $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}
Pop-Location

# 3. Move output
New-Item -ItemType Directory -Force -Path $BundleNsis | Out-Null
Move-Item -Force "$NsisDir\nsis-output.exe" "$BundleNsis\$OutputName"
Write-Host "Installer rebuilt: $BundleNsis\$OutputName" -ForegroundColor Green
Write-Host "Done." -ForegroundColor Green
