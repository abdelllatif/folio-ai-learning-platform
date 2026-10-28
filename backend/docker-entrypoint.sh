#!/bin/sh
set -e

echo "Waiting for PostgreSQL…"
until python -c "import psycopg, os; psycopg.connect(host=os.environ.get('POSTGRES_HOST','db'), dbname=os.environ.get('POSTGRES_DB','folio'), user=os.environ.get('POSTGRES_USER','folio'), password=os.environ.get('POSTGRES_PASSWORD','folio')).close()" 2>/dev/null; do
  sleep 1
done

python manage.py makemigrations accounts documents chat quizzes flashcards notes planner support --noinput
python manage.py migrate --noinput
python manage.py collectstatic --noinput >/dev/null

if [ "${SEED_DEMO:-0}" = "1" ]; then
  python manage.py seed_demo || true
fi

exec "$@"
