#!/bin/sh
set -eu

if [ -z "${SPRING_DATASOURCE_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    jdbc:*) export SPRING_DATASOURCE_URL="$DATABASE_URL" ;;
    postgres://*) export SPRING_DATASOURCE_URL="jdbc:postgresql://${DATABASE_URL#postgres://}" ;;
    postgresql://*) export SPRING_DATASOURCE_URL="jdbc:${DATABASE_URL}" ;;
  esac
fi

exec java -jar /app/app.jar