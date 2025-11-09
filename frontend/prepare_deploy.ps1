<#
Prepare a deployable `dist/` folder for Netlify CLI deploy.

Usage (PowerShell):
  cd d:\ocr-project\ocr-app\frontend
  .\prepare_deploy.ps1 -BackendUrl "https://your-backend.onrender.com"
  
  Or use default backend URL:
  .\prepare_deploy.ps1

This will create/replace the `dist/` directory containing a corrected index.html
and copied `app.js` and `styles.css` so the site can be deployed as a static folder.
It also injects the backend API URL into the HTML so the frontend knows where to call.
#>

param(
    [string]$BackendUrl = "https://ocr-backend.onrender.com"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$publicDir = Join-Path $scriptDir 'public'
$srcDir = Join-Path $scriptDir 'src'
$distDir = Join-Path $scriptDir 'dist'

Write-Host "Preparing deploy folder: $distDir"

if (Test-Path $distDir) {
    Write-Host "Removing existing dist/..."
    Remove-Item $distDir -Recurse -Force -ErrorAction SilentlyContinue
}

New-Item -Path $distDir -ItemType Directory | Out-Null

# Copy public contents (index.html etc.)
Write-Host "Copying public files..."
Copy-Item -Path (Join-Path $publicDir '*') -Destination $distDir -Recurse -Force

# Copy needed src assets into dist root and adjust paths in index.html
Write-Host "Copying src assets (app.js, styles.css)..."
foreach ($f in @('app.js','styles.css')) {
    $srcPath = Join-Path $srcDir $f
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination (Join-Path $distDir $f) -Force
    } else {
        Write-Host "Warning: $f not found in src/"
    }
}

$indexPath = Join-Path $distDir 'index.html'
if (Test-Path $indexPath) {
    Write-Host "Rewriting paths in index.html..."
    $content = Get-Content $indexPath -Raw
    # Replace ../src/app.js -> ./app.js and ../src/styles.css -> ./styles.css
    $content = $content -replace '\.\./src/app.js','./app.js'
    $content = $content -replace '\.\./src/styles.css','./styles.css'
    
    # Inject API_BASE URL into index.html before app.js script tag
    $apiInjection = "<script>`n    window.__API_BASE__ = '$BackendUrl/api/v1';`n  </script>"
    $content = $content -replace '(<script src="\.\/app\.js"><\/script>)', "$apiInjection`n  `$1"
    
    Set-Content -Path $indexPath -Value $content -Force
    Write-Host "✓ Injected API_BASE = $BackendUrl/api/v1"
} else {
    Write-Host "Error: index.html not found in public/"
}

Write-Host "Done. Deploy-ready folder is: $distDir"
Write-Host "Next: cd $distDir && npx netlify-cli deploy --prod --dir=dist"
