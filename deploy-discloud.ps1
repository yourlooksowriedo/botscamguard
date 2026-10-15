$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$envFile = Join-Path $root ".env"

if (-not (Test-Path -LiteralPath $envFile)) {
    throw "ไม่พบไฟล์ .env — คัดลอก .env.example เป็น .env แล้วใส่ DISCORD_TOKEN ก่อน"
}

$text = [System.IO.File]::ReadAllText($envFile, [System.Text.Encoding]::UTF8)
$match = [regex]::Match($text, 'DISCORD_TOKEN=([^\r\n]+)')
$value = if ($match.Success) { $match.Groups[1].Value.Trim() } else { "" }

if ($value.Length -lt 50 -or $value -notmatch '^[\x20-\x7E]+$') {
    throw "DISCORD_TOKEN ใน .env ยังไม่ถูกต้อง (ยังเป็นข้อความตัวอย่าง หรือสั้นเกินไป) กรุณาใส่โทเคนจริง"
}

$exclude = @(
    'node_modules', '.git', '.gitignore', '.env.example', 'ecosystem.config.cjs',
    'deploy-discloud.ps1', 'README.md', 'discloud-upload.zip'
)

$stage = Join-Path $env:TEMP ("discloud-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $stage | Out-Null

Get-ChildItem -LiteralPath $root -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $stage -Recurse -Force
}

$zip = Join-Path $root "discloud-upload.zip"
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }

Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -Force
Remove-Item -LiteralPath $stage -Recurse -Force

Write-Host "สำเร็จ! สร้างไฟล์สำหรับอัพโหลด: $zip"
Write-Host "อัพไฟล์นี้ใน DisCloud (Discord: .upconfig  หรือ Dashboard)"
