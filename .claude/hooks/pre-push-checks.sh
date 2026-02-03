#!/usr/bin/env bash
set -euo pipefail

cmd=$(jq -r '.tool_input.command // ""')

# Only run checks for git push commands
if ! echo "$cmd" | grep -Eq '\bgit\s+push\b'; then
  exit 0
fi

errors=()

# Run linting
echo "Running lint..." >&2
if ! npm run lint --silent 2>/dev/null; then
  errors+=("Lint check failed")
fi

# Run tests
echo "Running tests..." >&2
if ! npm test --silent 2>/dev/null; then
  errors+=("Tests failed")
fi

# Block if any errors
if [ ${#errors[@]} -gt 0 ]; then
  echo "Cannot push. Fix these issues first:" >&2
  printf '  - %s\n' "${errors[@]}" >&2
  exit 2
fi

echo "All checks passed!" >&2
exit 0
