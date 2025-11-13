# Windows 安装脚本
# 用于解决 better-sqlite3 安装问题

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Desktop Trading Manager App" -ForegroundColor Cyan
Write-Host "Windows 安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否以管理员权限运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "警告: 建议以管理员权限运行此脚本以获得最佳结果" -ForegroundColor Yellow
    Write-Host ""
}

# 检查 Visual Studio Build Tools
Write-Host "检查 Visual Studio Build Tools..." -ForegroundColor Yellow
$vsPath = Get-ChildItem "C:\Program Files\Microsoft Visual Studio" -ErrorAction SilentlyContinue
$vsBuildToolsPath = Get-ChildItem "C:\Program Files (x86)\Microsoft Visual Studio" -ErrorAction SilentlyContinue

if ($vsPath -or $vsBuildToolsPath) {
    Write-Host "✓ 检测到 Visual Studio 安装" -ForegroundColor Green
} else {
    Write-Host "✗ 未检测到 Visual Studio Build Tools" -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择安装方式:" -ForegroundColor Yellow
    Write-Host "1. 安装 Visual Studio Build Tools (推荐，需要下载约 6GB)" -ForegroundColor Cyan
    Write-Host "   下载地址: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022" -ForegroundColor Cyan
    Write-Host "   安装时请选择 'Desktop development with C++' 工作负载" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. 尝试使用预构建二进制文件 (可能因网络问题失败)" -ForegroundColor Cyan
    Write-Host ""
    $choice = Read-Host "请选择 (1/2，直接回车将尝试方案2)"
    
    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "请先安装 Visual Studio Build Tools，然后重新运行此脚本" -ForegroundColor Yellow
        Write-Host "按任意键退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }
}

Write-Host ""
Write-Host "开始安装依赖..." -ForegroundColor Yellow
Write-Host ""

# 设置环境变量
$env:npm_config_build_from_source = "false"
$env:npm_config_cache = "$env:APPDATA\npm-cache"

# 尝试使用国内镜像（如果可用）
Write-Host "尝试使用预构建二进制文件..." -ForegroundColor Yellow

# 安装 better-sqlite3
Write-Host "安装 better-sqlite3..." -ForegroundColor Cyan
npm install better-sqlite3 --build-from-source=false --prefer-offline=false

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "预构建二进制文件安装失败，尝试从源码编译..." -ForegroundColor Yellow
    Write-Host "这需要 Visual Studio Build Tools" -ForegroundColor Yellow
    Write-Host ""
    
    # 如果预构建失败，尝试编译
    npm install better-sqlite3 --build-from-source=true
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "安装失败!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "请尝试以下解决方案:" -ForegroundColor Yellow
    Write-Host "1. 安装 Visual Studio Build Tools" -ForegroundColor Cyan
    Write-Host "   https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. 以管理员权限运行 PowerShell，然后执行:" -ForegroundColor Cyan
    Write-Host "   npm install" -ForegroundColor White
    Write-Host ""
    Write-Host "3. 检查网络连接，预构建二进制文件可能需要良好的网络" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "安装其他依赖..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ 安装成功!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "现在可以运行以下命令启动应用:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "部分依赖安装失败，请检查错误信息" -ForegroundColor Red
    exit 1
}

