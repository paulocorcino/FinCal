#!/usr/bin/env bash
# Publica os issues locais de docs/issues/ no GitHub via `gh`.
# Idempotente por design de REUSO: cada execucao cria uma leva NOVA de issues
# (este repo avalia agentes; os mesmos issues sao subidos varias vezes).
# A primeira linha "# Titulo" de cada arquivo vira o titulo; o resto vira o corpo.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
issues_dir="$script_dir/../docs/issues"
count=0

for file in $(ls "$issues_dir"/[0-9]*-*.md | sort); do
    title="$(head -n 1 "$file" | sed 's/^#\s*//')"
    body="$(tail -n +2 "$file")"
    echo "Criando issue: $title"
    printf '%s' "$body" | gh issue create --title "$title" --label 'ready-for-agent' --body-file -
    count=$((count + 1))
done

echo "Concluido: $count issues criados."
