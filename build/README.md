# 构建资源目录

此目录包含 electron-builder 构建所需的资源文件。

## 文件说明

### Windows 图标（可选）
- **icon.ico** - Windows 应用图标（256x256 或 512x512 像素）
  - 格式：ICO
  - 大小：建议 256x256 或 512x512
  - 位置：`build/icon.ico`
  - **注意**：如果文件存在，electron-builder 会自动使用；如果不存在，将使用默认图标

### macOS 图标（可选）
- **icon.icns** - macOS 应用图标
  - 格式：ICNS
  - 大小：建议 512x512 或 1024x1024
  - 位置：`build/icon.icns`
  - 可以使用工具转换：`png2icns` 或在线工具
  - **注意**：如果文件存在，electron-builder 会自动使用；如果不存在，将使用默认图标

### macOS 权限文件
- **entitlements.mac.plist** - macOS 应用权限配置
  - 已创建，包含基本权限设置

### DMG 背景图（可选）
- **dmg-background.png** - macOS DMG 安装窗口背景图
  - 格式：PNG
  - 大小：建议 540x380 像素
  - 位置：`build/dmg-background.png`

### NSIS 安装脚本（可选）
- **installer.nsh** - Windows NSIS 安装器自定义脚本
  - 位置：`build/installer.nsh`

## 如何创建图标

### Windows (.ico)
1. 准备 256x256 或 512x512 的 PNG 图片
2. 使用在线工具转换：https://convertio.co/png-ico/ 或 https://www.icoconverter.com/
3. 保存为 `build/icon.ico`

### macOS (.icns)
1. 准备 512x512 或 1024x1024 的 PNG 图片
2. 使用工具转换：
   ```bash
   # 使用 iconutil (macOS)
   iconutil -c icns icon.iconset
   
   # 或使用在线工具
   # https://cloudconvert.com/png-to-icns
   ```
3. 保存为 `build/icon.icns`

## 图标文件说明

**图标文件是可选的**。如果 `build/icon.ico` 或 `build/icon.icns` 存在，electron-builder 会自动使用它们。如果不存在，将使用默认图标，构建仍然可以正常进行。

**建议**：为了提升应用的专业度，建议添加自定义图标文件。

## 构建命令

```bash
# 构建 Windows 版本
npm run build:win

# 构建 macOS 版本
npm run build:mac

# 构建所有平台
npm run build:all

# 通用构建（根据当前平台）
npm run dist
```

构建输出将保存在 `dist/` 目录中。

