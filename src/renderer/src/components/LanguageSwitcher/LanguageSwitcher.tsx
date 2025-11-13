import { Select } from 'antd'
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value)
    // 通知主进程更新菜单
    if (window.electronAPI) {
      window.electronAPI.sendLanguageChange(value)
    }
  }

  return (
    <Select
      value={i18n.language}
      onChange={handleLanguageChange}
      size="small"
      style={{ width: 100 }}
    >
      <Select.Option value="zh">中文</Select.Option>
      <Select.Option value="en">English</Select.Option>
    </Select>
  )
}

