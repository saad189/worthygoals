#!/usr/bin/env bash
# Fail if any raw hex colour literals exist in app/ or components/.
# All colours must be routed through constants/tokens.ts → constants/Colors.ts → useAppTheme().

set -euo pipefail

DIRS="app components"
# Exclude known non-colour files: HTML templates, not-found page, modal boilerplate
EXCLUDES="app/\+html|app/\+not-found|app/modal\.tsx"

matches=$(grep -rn --include="*.tsx" --include="*.ts" \
  '#[0-9a-fA-F]\{3,6\}' \
  $DIRS 2>/dev/null \
  | grep -vE "$EXCLUDES" \
  | grep -v "//.*#[0-9a-fA-F]" || true)

if [ -n "$matches" ]; then
  echo "❌  Raw hex literals found — route through constants/Colors.ts and useAppTheme():"
  echo "$matches"
  exit 1
fi

echo "✅  No raw hex literals in app/ or components/"
