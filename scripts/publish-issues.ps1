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
# Dependencias apontam sempre para tras (fatia N depende de fatias < N) e
# publicamos em ordem 01..14, entao num unico passe substituimos cada
# "Slice NN" pelo numero real (#N) do issue ja criado -> links clicaveis.
$files = Get-ChildItem -Path $issuesDir -Filter '*.md' |
    Where-Object { $_.Name -match '^\d+-' } |
    Sort-Object Name

$map = @{}  # prefixo "NN" -> numero do issue no GitHub
foreach ($file in $files) {
    $prefix = $file.Name.Substring(0, 2)
    $lines = Get-Content -LiteralPath $file.FullName
    $title = ($lines[0] -replace '^#\s*', '').Trim()
    $body  = ($lines[1..($lines.Count - 1)] -join "`n").Trim()

    # Resolve os bloqueadores "Slice NN" para o numero real (#N)
    $body = [regex]::Replace($body, 'Slice (\d{2})', {
        param($m)
        $key = $m.Groups[1].Value
        if ($map.ContainsKey($key)) { "#$($map[$key])" } else { $m.Value }
    })

    Write-Host "Criando issue: $title"
    $out = $body | gh issue create --title $title --label 'ready-for-agent' --body-file -
    $num = (($out | Select-Object -Last 1) -split '/')[-1].Trim()
    $map[$prefix] = $num
    Write-Host "  -> #$num"
}

Write-Host "Concluido: $($files.Count) issues criados."
