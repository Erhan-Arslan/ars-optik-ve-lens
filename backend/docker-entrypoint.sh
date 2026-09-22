#!/bin/sh
set -e

echo "Veritabanı migrasyonları uygulanıyor..."
npx prisma migrate deploy

echo "Sunucu başlatılıyor..."
exec node dist/main.js
