#!/usr/bin/env bash
# Netlify lance ce script avant chaque mise en ligne (réglage "ignore" dans netlify.toml).
#   code 0 = ne pas mettre en ligne (économise le quota Netlify)
#   code 1 = mettre en ligne
# Le site n'est remis en ligne que si au moins un message d'envoi contient « publier »
# depuis la dernière mise en ligne. Les photos envoyées entre-temps sont publiées en même temps.
set -u

# Première mise en ligne, relance manuelle depuis Netlify, ou historique introuvable : on publie.
if [ -z "${CACHED_COMMIT_REF:-}" ] || [ "${CACHED_COMMIT_REF}" = "${COMMIT_REF:-}" ] \
  || ! git cat-file -e "${CACHED_COMMIT_REF}^{commit}" 2>/dev/null; then
  echo "Mise en ligne."
  exit 1
fi

if git log --format=%B "${CACHED_COMMIT_REF}..${COMMIT_REF}" | grep -qi 'publier'; then
  echo "Le mot « publier » a été trouvé : mise en ligne."
  exit 1
fi

echo "Aucun message ne contient « publier » : mise en ligne ignorée (les changements sont gardés pour la prochaine)."
exit 0
