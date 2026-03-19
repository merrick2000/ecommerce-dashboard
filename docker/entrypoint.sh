#!/bin/sh
set -e

echo "🚀 Running entrypoint..."

# Run migrations if DATABASE_URL is set (production)
if [ -n "$DATABASE_URL" ]; then
    echo "📦 Running migrations..."
    php artisan migrate --force
    echo "✅ Migrations done."
fi

# Publish assets & cache
php artisan filament:assets 2>/dev/null || true
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🟢 Starting services..."
exec "$@"
