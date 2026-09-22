#!/bin/sh
set -e

echo "Veritabanı migrasyonları uygulanıyor..."
npx prisma migrate deploy

echo "Örnek veriler yükleniyor (upsert - güvenle tekrar çalıştırılabilir)..."
npx tsx prisma/seed.ts || echo "Seed atlandı (muhtemelen zaten yüklü)."

echo "Sunucu başlatılıyor..."
exec node dist/main.js
