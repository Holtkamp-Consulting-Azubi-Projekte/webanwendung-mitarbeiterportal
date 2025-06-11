#!/bin/bash

# Ausgabedatei
output="projektbaum.md"

# Hole alle nicht ignorierten Dateien
files=$(git ls-files --cached --others --exclude-standard | sort)

# Funktion zum Aufbau des Baums
generate_tree() {
  local prefix="$1"
  local parent="$2"
  local entries=()
  
  # Finde alle direkten Einträge in diesem Verzeichnis
  while IFS= read -r line; do
    # Nur direkte Kinder
    entry="${line#$parent}"
    [[ "$entry" == */* ]] && entry="${entry%%/*}/"
    [[ ! " ${entries[*]} " =~ " ${entry} " ]] && entries+=("$entry")
  done < <(printf "%s\n" $files | grep "^$parent")

  local count=${#entries[@]}
  local i=1

  for entry in "${entries[@]}"; do
    local pointer="├── "
    [[ $i -eq $count ]] && pointer="└── "

    echo "${prefix}${pointer}${entry}" >> "$output"

    # Wenn es ein Verzeichnis ist, rekursiv aufrufen
    if [[ "$entry" == */ ]]; then
      generate_tree "${prefix}$( [[ $i -eq $count ]] && echo "    " || echo "│   ")" "$parent$entry"
    fi
    ((i++))
  done
}

# Überschrift
echo "# 📁 Projektbaum" > "$output"
echo "" >> "$output"

# Start bei Root
generate_tree "" ""

echo "✅ Projektbaum gespeichert in $output"
