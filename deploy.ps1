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
# 3. Commit and Push local changes to Git
try {
    $status = git status --porcelain
    if ($status) {
        Write-Host "Staging and committing local changes..." -ForegroundColor Green
        git add .
        git commit -m "feat: auto-deploy PWA and icon updates"
        Write-Host "Pushing changes to GitHub..." -ForegroundColor Green
        git push origin main
    } else {
        Write-Host "No local changes to commit. Proceeding with remote deploy..." -ForegroundColor Green
    }
}
catch {
    Write-Host "Git push failed: $_" -ForegroundColor Red
    exit 1
}

# 4. Connect and Deploy on VPS
try {
    Write-Host "Connecting to VPS, pulling latest changes, and restarting containers..." -ForegroundColor Green
    $RemoteCmd = "cd $VPS_PROJECT_DIR && git fetch origin && git reset --hard origin/main && git clean -fd && export PORT=$VPS_APP_PORT && docker compose down && docker compose up --build -d"
    & ssh -p $VPS_PORT @SshAuthArgs "$VPS_USER@$VPS_IP" $RemoteCmd

    Write-Host "Deploy completed successfully!" -ForegroundColor Green
    Write-Host "App should be accessible at: http://${VPS_IP}:${VPS_APP_PORT}" -ForegroundColor Cyan
}
catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
}

