$ErrorActionPreference = 'Stop'
$version = (Get-Content package.json | ConvertFrom-Json).version
$installer = (Resolve-Path "dist/Ellery-Westcott-CRM-Setup-$version.exe").Path
$installDir = Join-Path $env:RUNNER_TEMP 'Ellery CRM Acceptance'
$reportDir = Join-Path (Get-Location) 'dist/windows-acceptance'
New-Item -ItemType Directory -Force $reportDir | Out-Null
$p = Start-Process -FilePath $installer -ArgumentList "/S /D=$installDir" -Wait -PassThru
if ($p.ExitCode -ne 0) { throw "Installation failed: $($p.ExitCode)" }
$exe = Join-Path $installDir 'Ellery Westcott CRM.exe'
if (!(Test-Path $exe)) { throw 'Installed executable missing' }
$env:CRM_SMOKE_REPORT_DIR = $reportDir
$p = Start-Process -FilePath $exe -ArgumentList '--smoke-test' -PassThru
if (!$p.WaitForExit(90000)) { $p.Kill(); throw 'Application launch timed out' }
if ($p.ExitCode -ne 0) { throw "Application failed: $($p.ExitCode)" }
$runtime = Get-Content (Join-Path $reportDir 'runtime.json') | ConvertFrom-Json
if (!$runtime.pass) { throw 'Installed runtime checks failed' }
$uninstaller = Join-Path $installDir 'Uninstall.exe'
$p = Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait -PassThru
for ($i=0; $i -lt 30 -and (Test-Path $exe); $i++) { Start-Sleep -Seconds 1 }
if (Test-Path $exe) { throw 'Uninstall did not remove application' }
@{install=$true;launch=$true;uninstall=$true;version=$version} | ConvertTo-Json | Set-Content (Join-Path $reportDir 'installation.json')
Get-FileHash $installer -Algorithm SHA256 | Format-List | Out-File (Join-Path $reportDir 'SHA256.txt')
