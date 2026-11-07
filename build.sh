#!/usr/bin/env bash
#
# build.sh — package PostReady Screenshots into a Chrome Web Store-ready zip under dist/.
#
# Only runtime files are included. Everything else in the repo (store-assets/,
# docs, store texts, CI and dev files) is intentionally left out of the package.
# manifest.json is placed at the archive root, as the store requires; all other
# files keep their relative paths (lib/, popup/, studio/, options/, ui/, icons/, _locales/).
#
# Usage: ./build.sh
# No dependencies beyond a POSIX shell, `zip`, and `jq`.

set -euo pipefail

cd "$(dirname "$0")"

# The exact set of files that ship inside the extension. Add new runtime
# files here when the extension grows.
RUNTIME_FILES=(
  manifest.json
  background.js
  lib/compose.js
  lib/feedback.js
  lib/i18n.js
  lib/output.js
  lib/settings.js
  lib/shoot-page.js
  lib/window-fit.js
  popup/popup.html
  popup/popup.css
  popup/popup.js
  studio/studio.html
  studio/studio.css
  studio/studio.js
  options/options.html
  options/options.css
  options/options.js
  ui/base.css
  icons/icon16.png
  icons/icon32.png
  icons/icon48.png
  icons/icon128.png
  _locales/en/messages.json
  _locales/de/messages.json
)

command -v zip >/dev/null 2>&1 || { echo "error: 'zip' is required" >&2; exit 1; }
command -v jq  >/dev/null 2>&1 || { echo "error: 'jq' is required"  >&2; exit 1; }

VERSION="$(jq -r '.version' manifest.json)"
[ -n "$VERSION" ] && [ "$VERSION" != "null" ] || { echo "error: no version in manifest.json" >&2; exit 1; }

OUT="dist/postready-${VERSION}.zip"
# The same file set unpacked, for "Load unpacked" in chrome://extensions/.
STAGE="dist/postready-${VERSION}"

# Fail loudly if a declared runtime file is missing.
missing=0
for f in "${RUNTIME_FILES[@]}"; do
  [ -f "$f" ] || { echo "error: missing runtime file: $f" >&2; missing=1; }
done
[ "$missing" -eq 0 ] || exit 1

# Warn about files in runtime folders that are not declared – they would be
# missing from the store zip.
undeclared=0
while IFS= read -r f; do
  f="${f#./}"
  printf '%s\n' "${RUNTIME_FILES[@]}" | grep -qxF "$f" || { echo "warning: not in RUNTIME_FILES: $f" >&2; undeclared=1; }
done < <(find lib popup studio options ui icons _locales -type f | sort)

mkdir -p dist
rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE"
for f in "${RUNTIME_FILES[@]}"; do
  mkdir -p "$STAGE/$(dirname "$f")"
  cp "$f" "$STAGE/$f"
done

# Zip from the staging dir, so what's tested unpacked and what's uploaded to the
# store are the same bytes. -X drops extra file attributes for a reproducible
# archive; manifest.json lands at the archive root, as the store requires.
( cd "$STAGE" && zip -q -X "../postready-${VERSION}.zip" "${RUNTIME_FILES[@]}" )

echo "Built $OUT ($(du -h "$OUT" | cut -f1)), version $VERSION"
echo "Unpacked: $STAGE/ — load this via 'Load unpacked' in chrome://extensions/"
echo "Packaged files:"
printf '  %s\n' "${RUNTIME_FILES[@]}"
[ "$undeclared" -eq 0 ] || echo "warning: some runtime-folder files are not packaged (see above)" >&2
