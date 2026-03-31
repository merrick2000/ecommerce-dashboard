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
php artisan filament:optimize 2>/dev/null || true
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Test Redis connection
echo "🔌 Testing Redis connection..."
php artisan tinker --execute="
try {
    \Illuminate\Support\Facades\Redis::ping();
    echo '✅ Redis OK';
} catch (\Exception \$e) {
    echo '❌ Redis FAILED: ' . \$e->getMessage();
}
" 2>/dev/null || echo "⚠️ Redis test skipped"

# Show queue connection
echo "📮 Queue: ${QUEUE_CONNECTION:-sync}"

echo "🟢 Starting services..."
exec "$@"
