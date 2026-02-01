#!/bin/bash
# Sync public files from frontend/public to project root
# This ensures robots.txt, sitemap.xml, and llms.txt are in sync

echo "🔄 Syncing public files to project root..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Files to sync
FILES=("robots.txt" "sitemap.xml" "llms.txt")

# Sync each file
for file in "${FILES[@]}"; do
    SOURCE="$PROJECT_ROOT/frontend/public/$file"
    DEST="$PROJECT_ROOT/$file"
    
    if [[ -f "$SOURCE" ]]; then
        cp "$SOURCE" "$DEST"
        echo "✅ Synced $file"
    else
        echo "⚠️  Warning: $SOURCE not found"
    fi
done

echo "✨ Sync complete!"
