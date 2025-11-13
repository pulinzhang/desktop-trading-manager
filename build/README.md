# Build Assets Directory

This folder stores assets consumed by `electron-builder`.

## File Overview

### Windows icon (optional)
- **icon.ico** – Windows app icon (256×256 or 512×512)
  - Format: ICO
  - Recommended size: 256×256 or 512×512
  - Location: `build/icon.ico`
  - **Note**: If present, electron-builder picks it up automatically; otherwise a default icon is used.

### macOS icon (optional)
- **icon.icns** – macOS app icon
  - Format: ICNS
  - Recommended size: 512×512 or 1024×1024
  - Location: `build/icon.icns`
  - Convert with tools like `png2icns` or online converters
  - **Note**: If missing, electron-builder falls back to a default icon.

### macOS entitlements
- **entitlements.mac.plist** – macOS entitlement configuration
  - Already included with base permissions.

### DMG background (optional)
- **dmg-background.png** – macOS DMG installer backdrop
  - Format: PNG
  - Recommended size: 540×380
  - Location: `build/dmg-background.png`

### NSIS installer script (optional)
- **installer.nsh** – Windows NSIS customization script
  - Location: `build/installer.nsh`

## Creating icons

### Windows (.ico)
1. Prepare a 256×256 or 512×512 PNG.
2. Convert it via https://convertio.co/png-ico/ or https://www.icoconverter.com/.
3. Save as `build/icon.ico`.

### macOS (.icns)
1. Prepare a 512×512 or 1024×1024 PNG.
2. Convert it with:
   ```bash
   # Using iconutil (macOS)
   iconutil -c icns icon.iconset

   # Or leverage an online tool
   # https://cloudconvert.com/png-to-icns
   ```
3. Save as `build/icon.icns`.

## Icon usage notes

**Icons are optional**. When `build/icon.ico` or `build/icon.icns` exists, electron-builder uses them automatically. Otherwise it falls back to defaults and the build still succeeds.

**Recommendation**: Ship custom icons to make the application look polished.

## Build commands

```bash
# Build Windows artifacts
npm run build:win

# Build macOS artifacts
npm run build:mac

# Build all platforms
npm run build:all

# Platform-aware build (current OS)
npm run dist
```

Build output is written to the `dist/` folder.

