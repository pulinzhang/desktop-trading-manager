import { app, shell, BrowserWindow, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from './database'
import { setupIpcHandlers } from './ipc'
import { getMenuTranslations } from './locales'

// Ensure UTF-8 console output on Windows
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding('utf8')
  process.stderr.setDefaultEncoding('utf8')
}

let currentLanguage = 'zh'

function createWindow(): void {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    backgroundColor: '#1f1f1f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the Vite dev server in development, packaged files in production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Build the application menu
function createMenu(lang: string = 'zh'): void {
  const t = getMenuTranslations(lang)
  
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: t.file,
      submenu: [
        {
          label: t.newTrade,
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Notify the renderer process via IPC
            BrowserWindow.getFocusedWindow()?.webContents.send('menu-new-trade')
          }
        },
        { type: 'separator' },
        {
          label: t.exit,
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: t.edit,
      submenu: [
        { role: 'undo', label: t.undo },
        { role: 'redo', label: t.redo },
        { type: 'separator' },
        { role: 'cut', label: t.cut },
        { role: 'copy', label: t.copy },
        { role: 'paste', label: t.paste }
      ]
    },
    {
      label: t.view,
      submenu: [
        { role: 'reload', label: t.reload },
        { role: 'forceReload', label: t.forceReload },
        { role: 'toggleDevTools', label: t.toggleDevTools },
        { type: 'separator' },
        { role: 'resetZoom', label: t.actualSize },
        { role: 'zoomIn', label: t.zoomIn },
        { role: 'zoomOut', label: t.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: t.toggleFullscreen }
      ]
    },
    {
      label: t.help,
      submenu: [
        {
          label: t.about,
          click: () => {
            // TODO: wire up the About dialog if needed
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// React to language changes
function setupLanguageHandler(): void {
  ipcMain.on('language-changed', (_, lang: string) => {
    currentLanguage = lang
    createMenu(lang)
  })
}

// Initialize once the app is ready
app.whenReady().then(() => {
  // Set the Windows App User Model ID
  electronApp.setAppUserModelId('com.electron.desktop-trading-manager-app')

  // In development toggle DevTools with F12
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize the database
  initDatabase()

  // Register IPC handlers
  setupIpcHandlers()

  // Register language handler
  setupLanguageHandler()

  // Create the main window and menu
  createWindow()
  createMenu(currentLanguage)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit the app when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up before quitting
app.on('before-quit', () => {
  closeDatabase()
})

