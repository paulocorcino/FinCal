#!/usr/bin/env bash
# Reseta e republica os issues locais de docs/issues/ no GitHub via `gh`.
# DESTRUTIVO por design de REUSO (este repo avalia agentes): cada execucao
# APAGA PERMANENTEMENTE todos os issues existentes (inclusive fechados) e
# cria uma leva NOVA a partir dos arquivos locais.
# A primeira linha "# Titulo" de cada arquivo vira o titulo; o resto vira o corpo.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
issues_dir="$script_dir/../docs/issues"
count=0

# --- 1. Apagar TODOS os issues existentes (abertos e fechados) ---
echo "AVISO: apagando permanentemente todos os issues existentes (abertos e fechados)..."
for number in $(gh issue list --state all --limit 1000 --json number --jq '.[].number'); do
    echo "Apagando issue #$number"
    gh issue delete "$number" --yes
done

# --- 2. Criar os issues a partir dos arquivos locais ---
for file in $(ls "$issues_dir"/[0-9]*-*.md | sort); do
    title="$(head -n 1 "$file" | sed 's/^#\s*//')"
    body="$(tail -n +2 "$file")"
    echo "Criando issue: $title"
    printf '%s' "$body" | gh issue create --title "$title" --label 'ready-for-agent' --body-file -
    count=$((count + 1))
done

echo "Concluido: $count issues criados."
