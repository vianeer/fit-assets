param(
  [string]$EdgePath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$posterDir = Join-Path $root 'poster'
$profileDir = Join-Path $env:TEMP 'campus-fit-poster-render'

if (-not (Test-Path $EdgePath)) {
  throw "Edge executable not found: $EdgePath"
}

Get-ChildItem $posterDir -Filter '*.svg' | ForEach-Object {
  $output = [System.IO.Path]::ChangeExtension($_.FullName, '.png')
  $url = 'file:///' + ($_.FullName -replace '\\', '/')
  & $EdgePath `
    --headless=new `
    --no-sandbox `
    --disable-gpu `
    --disable-gpu-compositing `
    --disable-software-rasterizer `
    --hide-scrollbars `
    --user-data-dir=$profileDir `
    --window-size=512,420 `
    --screenshot=$output `
    $url | Out-Null

  if (-not (Test-Path $output)) {
    throw "Failed to render $($_.Name)"
  }
}

Write-Output "Rendered $((Get-ChildItem $posterDir -Filter '*.png').Count) poster PNG files."
