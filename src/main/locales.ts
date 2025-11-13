export const menuTranslations = {
  zh: {
    file: '文件',
    newTrade: '新建交易',
    exit: '退出',
    edit: '编辑',
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    view: '视图',
    reload: '重新加载',
    forceReload: '强制重新加载',
    toggleDevTools: '切换开发者工具',
    actualSize: '实际大小',
    zoomIn: '放大',
    zoomOut: '缩小',
    toggleFullscreen: '切换全屏',
    help: '帮助',
    about: '关于'
  },
  en: {
    file: 'File',
    newTrade: 'New Trade',
    exit: 'Exit',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    view: 'View',
    reload: 'Reload',
    forceReload: 'Force Reload',
    toggleDevTools: 'Toggle Developer Tools',
    actualSize: 'Actual Size',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    toggleFullscreen: 'Toggle Fullscreen',
    help: 'Help',
    about: 'About'
  }
}

export function getMenuTranslations(lang: string = 'zh') {
  return menuTranslations[lang as keyof typeof menuTranslations] || menuTranslations.zh
}
