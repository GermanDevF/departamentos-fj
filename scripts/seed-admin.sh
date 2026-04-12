#!/bin/bash
#
# Inserta el primer perfil de administrador en user_profiles.
#
# Uso:
#   1. Inicia sesión en la app con tu cuenta existente.
#   2. Obtén tu user_id ejecutando:
#        npx @insforge/cli db query "SELECT id, email FROM auth.users"
#   3. Reemplaza <TU_USER_ID> con tu id real y ejecuta:
#        npx @insforge/cli db query "INSERT INTO user_profiles (user_id, role) VALUES ('<TU_USER_ID>', 'admin')"
#
# Ejemplo completo:
#   npx @insforge/cli db query "INSERT INTO user_profiles (user_id, role) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin')"
#

if [ -z "$1" ]; then
  echo "Uso: ./scripts/seed-admin.sh <USER_ID>"
  echo ""
  echo "Para encontrar tu USER_ID ejecuta:"
  echo "  npx @insforge/cli db query \"SELECT id, email FROM auth.users\""
  exit 1
fi

USER_ID="$1"

echo "Insertando perfil admin para usuario: $USER_ID"
npx @insforge/cli db query "INSERT INTO user_profiles (user_id, role) VALUES ('$USER_ID', 'admin') ON CONFLICT (user_id) DO UPDATE SET role = 'admin'"

echo "Listo. El usuario ahora es administrador."
