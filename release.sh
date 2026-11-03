#!/usr/bin/env bash
# release.sh — Promueve develop a main con tag anotado
# Uso: ./release.sh v1.0.2 "Descripción del release"

set -euo pipefail

TAG_VERSION="${1:-}"
TAG_MESSAGE="${2:-}"

# --- 1. Validaciones previas ---
if [ -z "$TAG_VERSION" ]; then
  echo "❌ Uso: ./release.sh <version> \"<mensaje>\""
  echo "   Ejemplo: ./release.sh v1.0.2 \"hotfix login IsActive\""
  exit 1
fi

# Ir a la raíz del repo (por si se ejecuta desde otra carpeta)
cd "$(git rev-parse --show-toplevel)"

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "⚠️  Estás en '$CURRENT_BRANCH'. Cambiando a develop..."
  git checkout develop
fi

# --- 2. Verificar que develop esté limpio y sincronizado ---
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree sucio. Commitea o stashea antes de releasear:"
  git status --short
  exit 1
fi

echo "📥 Fetch origin..."
git fetch origin --prune

echo "📥 Pull develop..."
git pull origin develop --ff-only

# --- 3. Verificar que el tag no exista ---
if git rev-parse "$TAG_VERSION" >/dev/null 2>&1; then
  echo "❌ El tag $TAG_VERSION ya existe. Usa otra versión."
  exit 1
fi

# --- 4. Ir a main y mergear develop ---
echo "🔀 Mergeando develop → main..."
git checkout main
git pull origin main --ff-only

git merge --no-ff develop -m "release: $TAG_VERSION — ${TAG_MESSAGE:-Sin descripción}"

# --- 5. Build de verificación (opcional, descomenta si querés) ---
# echo "🔨 Build de verificación..."
# dotnet build ChemLabBackend/ChemLabInventory.slnx -c Release
# if [ $? -ne 0 ]; then
#   echo "❌ Build falló. Abortando release."
#   git checkout develop
#   exit 1
# fi

# --- 6. Tag anotado ---
echo "🏷️  Creando tag $TAG_VERSION..."
git tag -a "$TAG_VERSION" -m "ChemLab $TAG_VERSION — ${TAG_MESSAGE:-Sin descripción}"

# --- 7. Push a origin (main + tag) ---
echo "🚀 Push a origin/main + tag..."
git push origin main
git push origin "$TAG_VERSION"

# --- 8. Volver a develop ---
echo "↩️  Volviendo a develop..."
git checkout develop

# --- 9. Resumen ---
echo ""
echo "✅ Release $TAG_VERSION completado"
echo ""
echo "   Commit en main: $(git rev-parse --short main)"
echo "   Tag:            $(git rev-parse --short "$TAG_VERSION")"
echo "   develop:        $(git rev-parse --short develop)"
echo ""
git log --oneline -5 main
