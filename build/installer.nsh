; NSIS custom installer script
; Provides Windows installer customizations.

; Message shown after installation completes
!macro customFinish
  MessageBox MB_OK "Desktop Trading Manager App has been installed successfully!"
!macroend

; Confirm before uninstalling
!macro customUnInit
  MessageBox MB_YESNO "Are you sure you want to uninstall Desktop Trading Manager App?" IDYES +2
  Abort
!macroend

