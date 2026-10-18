Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
Name "Ellery Westcott CRM"
OutFile "${OUTPUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\ElleryWestcottCRM"
InstallDirRegKey HKCU "Software\ElleryWestcottCRM" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetCompressorDictSize 32
BrandingText "Ellery Westcott Capital Markets"
VIProductVersion "2.0.0.0"
VIAddVersionKey "ProductName" "Ellery Westcott CRM"
VIAddVersionKey "FileDescription" "Ellery Westcott CRM Setup"
VIAddVersionKey "FileVersion" "2.0.0"
VIAddVersionKey "LegalCopyright" "Ellery Westcott Capital Markets"
!define MUI_ICON "${ICON_FILE}"
!define MUI_UNICON "${ICON_FILE}"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\Ellery Westcott CRM.exe"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"
Function .onInit
 ${IfNot} ${AtLeastWin10}
  MessageBox MB_ICONSTOP "This application requires Windows 10 or later."
  Abort
 ${EndIf}
 ${IfNot} ${RunningX64}
  MessageBox MB_ICONSTOP "This application requires 64-bit Windows 10 or later."
  Abort
 ${EndIf}
FunctionEnd
Function .onVerifyInstDir
 IfFileExists "$INSTDIR\Ellery Westcott CRM.exe" allowed
 IfFileExists "$INSTDIR\*.*" 0 allowed
 Abort
 allowed:
FunctionEnd
Section "Application"
 SetShellVarContext current
 SetOutPath "$INSTDIR"
 File /r "${APP_DIRECTORY}/*"
 WriteUninstaller "$INSTDIR\Uninstall.exe"
 CreateDirectory "$SMPROGRAMS\Ellery Westcott CRM"
 CreateShortcut "$SMPROGRAMS\Ellery Westcott CRM\Ellery Westcott CRM.lnk" "$INSTDIR\Ellery Westcott CRM.exe"
 CreateShortcut "$DESKTOP\Ellery Westcott CRM.lnk" "$INSTDIR\Ellery Westcott CRM.exe"
 WriteRegStr HKCU "Software\ElleryWestcottCRM" "InstallDir" "$INSTDIR"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElleryWestcottCRM" "DisplayName" "Ellery Westcott CRM"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElleryWestcottCRM" "DisplayVersion" "2.0.0"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElleryWestcottCRM" "Publisher" "Ellery Westcott Capital Markets"
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElleryWestcottCRM" "UninstallString" '"$INSTDIR\Uninstall.exe"'
 WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElleryWestcottCRM" "DisplayIcon" "$INSTDIR\Ellery Westcott CRM.exe"
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElleryWestcottCRM" "NoModify" 1
 WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElleryWestcottCRM" "NoRepair" 1
SectionEnd
Section "Uninstall"
 SetShellVarContext current
 Delete "$DESKTOP\Ellery Westcott CRM.lnk"
 RMDir /r "$SMPROGRAMS\Ellery Westcott CRM"
 DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ElleryWestcottCRM"
 DeleteRegKey HKCU "Software\ElleryWestcottCRM"
 RMDir /r "$INSTDIR"
 ; User data in AppData is intentionally retained.
SectionEnd
