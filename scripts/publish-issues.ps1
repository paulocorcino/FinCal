#!/usr/bin/env pwsh
# Publica os issues locais de docs/issues/ no GitHub via `gh`.
# Idempotente por design de REUSO: cada execução cria uma leva NOVA de issues
# (este repo avalia agentes; os mesmos issues são subidos várias vezes).
# A primeira linha "# Titulo" de cada arquivo vira o titulo; o resto vira o corpo.

$ErrorActionPreference = 'Stop'
$issuesDir = Join-Path $PSScriptRoot '..' 'docs' 'issues'
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
