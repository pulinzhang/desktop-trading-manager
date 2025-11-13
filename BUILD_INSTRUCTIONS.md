# 构建说明

本文档说明如何构建 Desktop Trading Manager App (Risk & Recovery System with Login Protection) 的桌面应用程序。

## 📦 构建前准备

### 1. 安装依赖
```bash
npm install
```

### 2. 准备图标文件（可选但推荐）

在 `build/` 目录中放置以下图标文件：

- **Windows**: `build/icon.ico` (256x256 或 512x512 像素)
- **macOS**: `build/icon.icns` (512x512 或 1024x1024 像素)

如果没有图标文件，electron-builder 会使用默认图标。

详细说明请查看 `build/README.md`。

## 🚀 构建命令

### Windows 构建
```bash
npm run build:win
```

这将生成：
- **NSIS 安装器**: `dist/Desktop Trading Manager App-1.0.0-x64.exe` (64位)
- **NSIS 安装器**: `dist/Desktop Trading Manager App-1.0.0-ia32.exe` (32位)
- **便携版**: `dist/Desktop Trading Manager App-1.0.0-x64.exe` (便携版，无需安装)

### macOS 构建
```bash
npm run build:mac
```

这将生成：
- **DMG 安装包**: `dist/Desktop Trading Manager App-1.0.0-x64.dmg` (Intel)
- **DMG 安装包**: `dist/Desktop Trading Manager App-1.0.0-arm64.dmg` (Apple Silicon)

### 构建所有平台
```bash
npm run build:all
```

这将同时构建 Windows 和 macOS 版本。

### 通用构建
```bash
npm run dist
```

根据当前运行的操作系统自动构建对应平台。

## 📁 输出目录

所有构建产物将保存在 `dist/` 目录中。

## ⚙️ 构建配置

构建配置位于 `package.json` 的 `build` 字段中，包括：

- **应用 ID**: `com.desktoptrading.manager`
- **产品名称**: `Desktop Trading Manager App`
- **输出目录**: `dist/`
- **资源目录**: `build/`

### Windows 配置
- 支持 64位 (x64) 和 32位 (ia32) 架构
- NSIS 安装器（可自定义安装路径）
- 便携版（无需安装）

### macOS 配置
- 支持 Intel (x64) 和 Apple Silicon (arm64) 架构
- DMG 安装包
- 已配置基本权限（entitlements）

## 🔧 自定义构建

如需修改构建配置，请编辑 `package.json` 中的 `build` 字段。

### 修改应用信息
```json
{
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "Your App Name",
    "version": "1.0.0"
  }
}
```

### 修改输出文件名
```json
{
  "build": {
    "win": {
      "artifactName": "${productName}-${version}-${arch}.${ext}"
    },
    "mac": {
      "artifactName": "${productName}-${version}-${arch}.${ext}"
    }
  }
}
```

## 📝 注意事项

1. **图标文件**: 虽然图标文件是可选的，但强烈建议添加自定义图标以提升专业度。

2. **代码签名**: 
   - Windows: 需要代码签名证书才能避免 Windows Defender 警告
   - macOS: 需要 Apple Developer 证书才能进行公证

3. **构建时间**: 首次构建可能需要较长时间，因为需要下载平台特定的工具。

4. **跨平台构建**: 
   - 在 Windows 上只能构建 Windows 版本
   - 在 macOS 上可以构建 macOS 和 Windows 版本（需要 Wine）
   - 在 Linux 上可以构建 Linux 版本

## 🐛 常见问题

### 构建失败：找不到图标文件
- 解决方案：创建图标文件或从配置中移除图标路径（使用默认图标）

### Windows 构建：NSIS 错误
- 解决方案：确保已安装最新版本的 Node.js 和 npm

### macOS 构建：权限错误
- 解决方案：检查 `build/entitlements.mac.plist` 文件是否正确配置

### 构建产物过大
- 解决方案：检查 `package.json` 中的 `files` 配置，排除不必要的文件

## 📚 更多信息

- [electron-builder 文档](https://www.electron.build/)
- [NSIS 文档](https://nsis.sourceforge.io/)
- [macOS 代码签名](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

