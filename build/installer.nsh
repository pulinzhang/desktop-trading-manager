; NSIS 安装器自定义脚本
; 此文件包含 Windows 安装器的自定义配置

; 安装完成后显示消息
!macro customFinish
  MessageBox MB_OK "Desktop Trading Manager App 已成功安装！"
!macroend

; 卸载前确认
!macro customUnInit
  MessageBox MB_YESNO "确定要卸载 Desktop Trading Manager App 吗？" IDYES +2
  Abort
!macroend

