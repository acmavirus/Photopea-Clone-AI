# Deployment script for Photoeditor PWA on VPS
# Excludes local config, git history, and build temp folders

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "        Photoeditor PWA VPS Deployer          " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Load configuration from .env.deploy if it exists
$EnvFile = ".env.deploy"
if (Test-Path $EnvFile) {
    Write-Host "Loading configuration from $EnvFile..." -ForegroundColor Green
    Get-Content $EnvFile | ForEach-Object {
        $line = ($_ -split '#', 2)[0].Trim()
        if ($line -match '=') {
            $name, $value = $line -split '=', 2
            $name = $name.Trim()
            $value = $value.Trim().Trim('"').Trim("'").Trim()
            Set-Variable -Name $name -Value $value -Scope Script
        }
    }
} else {
    Write-Host "Configuration file $EnvFile not found. Creating a template..." -ForegroundColor Yellow
    $TemplateContent = @"
# VPS Deployment Configuration
VPS_IP=""
VPS_PORT="22"
VPS_USER="root"
VPS_KEY_PATH="~/.ssh/id_rsa"
VPS_PROJECT_DIR="/var/www/photopea"
"@
    $TemplateContent | Out-File -FilePath $EnvFile -Encoding utf8
    Write-Host "Created template $EnvFile. Please fill in the details." -ForegroundColor Yellow
}

# 2. Prompt for missing inputs
if (-not $VPS_IP) {
    $VPS_IP = Read-Host -Prompt "Enter VPS IP Address"
    if (-not $VPS_IP) {
        Write-Error "VPS IP Address is required!"
        exit 1
    }
}
if (-not $VPS_USER) {
    $VPS_USER = Read-Host -Prompt "Enter VPS SSH User [root]"
    if (-not $VPS_USER) { $VPS_USER = "root" }
}
if (-not $VPS_PORT) {
    $VPS_PORT = Read-Host -Prompt "Enter VPS SSH Port [22]"
    if (-not $VPS_PORT) { $VPS_PORT = "22" }
}
if (-not $VPS_PROJECT_DIR) {
    $VPS_PROJECT_DIR = Read-Host -Prompt "Enter project directory on VPS [/var/www/photopea]"
    if (-not $VPS_PROJECT_DIR) { $VPS_PROJECT_DIR = "/var/www/photopea" }
}
if (-not $VPS_APP_PORT) {
    $VPS_APP_PORT = Read-Host -Prompt "Enter application port on VPS [8080]"
    if (-not $VPS_APP_PORT) { $VPS_APP_PORT = "8080" }
}
if (-not $VPS_KEY_PATH -and -not $VPS_PASSWORD) {
    $choice = Read-Host -Prompt "Authenticate using (1) SSH Key or (2) Password? [1]"
    if ($choice -eq "2") {
        $VPS_PASSWORD = "PROMPT"
    } else {
        $VPS_KEY_PATH = "$env:USERPROFILE\.ssh\id_rsa"
    }
}

# Resolve SSH key path (expand tilde if any)
if ($VPS_KEY_PATH) {
    if ($VPS_KEY_PATH.StartsWith("~")) {
        $VPS_KEY_PATH = $VPS_KEY_PATH.Replace("~", $env:USERPROFILE)
    }
    if (-not (Test-Path $VPS_KEY_PATH)) {
        Write-Host "Warning: SSH key at $VPS_KEY_PATH not found. Will fallback to password authentication." -ForegroundColor Yellow
        $VPS_KEY_PATH = $null
    }
}

# Construct SSH & SCP authentication args
$SshAuthArgs = @()
$ScpAuthArgs = @()
if ($VPS_KEY_PATH) {
    $SshAuthArgs += "-i", $VPS_KEY_PATH
    $ScpAuthArgs += "-i", $VPS_KEY_PATH
}

# 3. Create a temporary archive of the project
$ArchiveName = "project.tar.gz"
Write-Host "Creating archive: $ArchiveName..." -ForegroundColor Green
if (Test-Path $ArchiveName) {
    Remove-Item $ArchiveName -Force
}

# Use bsdtar to bundle, excluding node_modules, .git, .gemini, etc.
& tar --exclude=".git" --exclude=".gemini" --exclude=".agents" --exclude=".codex" --exclude="node_modules" --exclude=$ArchiveName --exclude="*.ps1" --exclude="*.env*" -czf $ArchiveName .

# 4. Connect and Deploy
try {
    Write-Host "Connecting to VPS and ensuring project directory exists..." -ForegroundColor Green
    $DirCmd = "mkdir -p $VPS_PROJECT_DIR"
    & ssh -p $VPS_PORT @SshAuthArgs "$VPS_USER@$VPS_IP" $DirCmd

    Write-Host "Uploading $ArchiveName to VPS..." -ForegroundColor Green
    $DestPath = "${VPS_USER}@${VPS_IP}:${VPS_PROJECT_DIR}/"
    & scp -P $VPS_PORT @ScpAuthArgs $ArchiveName $DestPath

    Write-Host "Extracting archive and running docker-compose on VPS..." -ForegroundColor Green
    $RemoteCmd = "export PORT=$VPS_APP_PORT && cd $VPS_PROJECT_DIR && tar -xzf $ArchiveName && rm $ArchiveName && docker compose down && docker compose up --build -d"
    & ssh -p $VPS_PORT @SshAuthArgs "$VPS_USER@$VPS_IP" $RemoteCmd
 
    Write-Host "Deploy completed successfully!" -ForegroundColor Green
    Write-Host "App should be accessible at: http://${VPS_IP}:${VPS_APP_PORT}" -ForegroundColor Cyan
}
catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
}
finally {
    # 5. Clean up local archive
    if (Test-Path $ArchiveName) {
        Write-Host "Cleaning up local archive..." -ForegroundColor Green
        Remove-Item $ArchiveName -Force
    }
}
