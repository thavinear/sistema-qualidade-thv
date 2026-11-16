#!/bin/sh
set -eu

case "${DATABASE_URL:-}" in
  postgresql://*) export DATABASE_URL="jdbc:${DATABASE_URL}" ;;
  postgres://*) export DATABASE_URL="jdbc:postgresql://${DATABASE_URL#postgres://}" ;;
esac

exec java -jar app.jar