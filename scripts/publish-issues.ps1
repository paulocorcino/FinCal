#!/usr/bin/env pwsh
# Reseta e republica os issues locais de docs/issues/ no GitHub via `gh`.
# DESTRUTIVO por design de REUSO (este repo avalia agentes): cada execução
# APAGA PERMANENTEMENTE todos os issues existentes (inclusive fechados) e
# cria uma leva NOVA a partir dos arquivos locais.
# A primeira linha "# Titulo" de cada arquivo vira o titulo; o resto vira o corpo.

$ErrorActionPreference = 'Stop'
$issuesDir = Join-Path $PSScriptRoot '..' 'docs' 'issues'

# --- 1. Apagar TODOS os issues existentes (abertos e fechados) ---
Write-Host "AVISO: apagando permanentemente todos os issues existentes (abertos e fechados)..." -ForegroundColor Yellow
$existing = gh issue list --state all --limit 1000 --json number --jq '.[].number'
foreach ($number in $existing) {
    if ([string]::IsNullOrWhiteSpace($number)) { continue }
    Write-Host "Apagando issue #$number"
    gh issue delete $number --yes
}

# --- 2. Criar os issues a partir dos arquivos locais ---
$files = Get-ChildItem -Path $issuesDir -Filter '*.md' |
    Where-Object { $_.Name -match '^\d+-' } |
    Sort-Object Name

foreach ($file in $files) {
    $lines = Get-Content -LiteralPath $file.FullName
    $title = ($lines[0] -replace '^#\s*', '').Trim()
    $body  = ($lines[1..($lines.Count - 1)] -join "`n").Trim()
    Write-Host "Criando issue: $title"
    $body | gh issue create --title $title --label 'ready-for-agent' --body-file -
}

Write-Host "Concluido: $($files.Count) issues criados."
