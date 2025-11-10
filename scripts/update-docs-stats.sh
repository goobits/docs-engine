#!/usr/bin/env bash

# Update documentation statistics automatically
# Run this script after generating symbol-map.json

set -e

SYMBOL_MAP_PATH="docs/.generated/symbol-map.json"
DOCS_INDEX_PATH="docs/index.md"

# Check if symbol map exists
if [ ! -f "$SYMBOL_MAP_PATH" ]; then
  echo "Error: Symbol map not found at $SYMBOL_MAP_PATH"
  echo "Run 'pnpm docs:symbols' first"
  exit 1
fi

# Get actual symbol count
SYMBOL_COUNT=$(jq 'keys | length' "$SYMBOL_MAP_PATH")

echo "Found $SYMBOL_COUNT exported symbols"

# Update index.md with correct count
if command -v sed &> /dev/null; then
  # macOS-compatible sed
  sed -i.bak "s/[0-9]\+ exported symbols/$SYMBOL_COUNT exported symbols/" "$DOCS_INDEX_PATH" && rm "$DOCS_INDEX_PATH.bak"
  echo "✓ Updated $DOCS_INDEX_PATH with symbol count: $SYMBOL_COUNT"
else
  echo "Warning: sed not available, skipping update"
fi

echo "Done!"
