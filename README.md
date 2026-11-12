# ARS Optik ve Lens

Türkiye pazarına yönelik premium gözlük, güneş gözlüğü ve lens e-ticaret platformu.

## Mimari

```
/frontend   React 19 + Vite + TypeScript + Tailwind CSS v4 + Framer Motion
/backend          NestJS + Prisma 7 (driver adapter) + PostgreSQL + Redis
/dotnet-service   ASP.NET Core (.NET 11) + EF Core — NestJS'in yanında çalışan yardımcı servis
docker-compose.yml   postgres, redis, backend, dotnet-service, frontend
```

- **Ödeme:** `PaymentProvider` arayüzü arkasında sandbox bir mock sağlayıcı (`MockPaymentProvider`) çalışır. Gerçek bir sağlayıcı (iyzico, PayTR, Stripe) eklemek için `backend/src/payments/` altına arayüzü uygulayan yeni bir sınıf yazıp `PaymentsModule`de bağlamak yeterli.
- **Kimlik doğrulama:** JWT access (15dk) + refresh (7 gün) token çifti, bcrypt şifre hash'leme, rol bazlı yetkilendirme (`user` / `admin`).
- **Marka paleti:** `frontend/src/index.css` içindeki `@theme` bloğu — logo üzerinden piksel örneklemesiyle çıkarılmış altın/bronz/şampanya tonları.

- **.NET servisi:** NestJS'in ürettiği JWT'leri aynı `JWT_ACCESS_SECRET` ile doğrular, rolü NestJS gibi `users` tablosundan okur. Veritabanının şeması ve migration'ları NestJS/Prisma'ya aittir; .NET servisi tabloları yalnızca okur. API dokümantasyonu: http://localhost:5000/docs

## Özellikler

- Ürün kataloğu: filtreleme, sıralama, arama (`/katalog?arama=...`)
- Ürün detayı: lens tipi/kaplama seçimi, reçete bilgisi, favoriye ekleme
- **Reçete analizi ve cam inceliği önerisi (.NET):** Reçete (SPH/CYL/AKS/PD) .NET servisinde doğrulanır ve eksi silindir formuna çevrilir. Her cam inceliği (1.50 / 1.60 / 1.67 / 1.74) için tahmini kalınlık hesaplanır, en uygun incelik önerilir. Fiyatı NestJS sipariş sırasında sunucuda hesaplar; .NET servisi kapalıysa incelik elle seçilip siparişe devam edilebilir. Reçetenin tamamı siparişe kaydedilir ve admin sipariş detayında görünür.
- Sepet + Ödeme (mock ödeme sağlayıcısı, kayıtlı adresten hızlı doldurma)
- Kullanıcı hesabı: sipariş geçmişi, adres defteri (varsayılan adres desteğiyle), favorilerim
- **Canlı sipariş bildirimleri (.NET SignalR):** Ödemesi alınan her sipariş ve sipariş durumu değişikliği NestJS'ten .NET servisine (`POST /internal/order-events`, `INTERNAL_API_KEY` ile korunur) iletilir; .NET bunu `/hubs/admin-orders` SignalR hub'ı üzerinden açık admin panellerine yayınlar. Panelde bildirim, menüde yeni sipariş sayacı ve sayfa yenilemeden güncellenen sipariş listesi görünür. .NET servisi kapalıysa siparişler etkilenmez, sadece canlı bildirim gelmez.
- **Proforma fatura (.NET QuestPDF):** Hesabım ve admin sipariş detayında "Fatura (PDF)" butonu. PDF, .NET servisinde marka fontları (Fraunces, Manrope — SIL OFL) ve logoyla üretilir; siparişi yalnızca sahibi veya admin indirebilir. Belge proforma niteliğindedir, e-Arşiv fatura yerine geçmez. QuestPDF Community lisansıyla kullanılır (yıllık geliri 1M USD altındaki işletmeler için ücretsiz).
- **Sipariş e-postaları (.NET + Brevo):** Sipariş alındı (proforma fatura PDF ekli), kargoya verildi, teslim edildi ve iptal edildi e-postaları. NestJS'in sipariş olaylarıyla tetiklenir; .NET arka planda bir kuyrukla, Brevo'nun HTTPS API'si üzerinden gönderir (Render'ın ücretsiz planı SMTP portlarını kapatır). Geçici hatalarda otomatik tekrar dener. `BREVO_API_KEY` ve `EMAIL_FROM_ADDRESS` tanımlı değilse e-postalar gönderilmez, sadece log'a yazılır.
- **Yönetim paneli** (`/admin`, sadece `admin` rolündeki kullanıcılar): ürün CRUD, tüm siparişleri görüntüleme ve sipariş durumu güncelleme

### Admin girişi

Seed script'i `admin@arsoptik.com` adresiyle bir yönetici hesabı oluşturur.

- **Yerel geliştirme:** `ADMIN_PASSWORD` tanımlı değilse `backend/prisma/seed.ts` içindeki geliştirme varsayılanı kullanılır.
- **Production (Render):** Şifre `ADMIN_PASSWORD` ortam değişkeninden okunur ve her açılışta yeniden uygulanır; değişkeni değiştirip yeniden deploy etmek şifreyi döndürür. Değeri Render panelinde servis → *Environment* altında görebilirsiniz.

## Hızlı Başlangıç (Docker)

```bash
docker compose up -d --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API dokümantasyonu (Swagger): http://localhost:4000/docs

İlk çalıştırmada backend konteyneri migrasyonları otomatik uygular. Örnek ürün verisiyle doldurmak için:

```bash
docker compose exec backend npx tsx prisma/seed.ts
```

## Yerel Geliştirme (Docker'sız)

```bash
# Sadece veritabanı + cache için Docker
docker compose up -d postgres redis

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run start:dev        # http://localhost:4000

# Frontend (ayrı terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

## Testler

```bash
cd backend
npm run test:e2e   # auth, checkout, admin, favoriler ve adres defteri akışlarını gerçek DB'ye karşı doğrular
```

## Sonraki Adımlar

- Gerçek ödeme sağlayıcısı entegrasyonu (iyzico önerilir — Türkiye pazarı için).
- Reçete dosyası yükleme için gerçek bir depolama servisi (S3 uyumlu) bağlanması — şu an sadece metin alanları var.
- Admin panelinde ikinci bir yönetici davet etme / şifre sıfırlama akışı.

## Yayın (Deploy)

- **Frontend → GitHub Pages:** `main` dalına `frontend/` altında yapılan her push, `.github/workflows/deploy-pages.yml` ile derlenip https://erhan-arslan.github.io/ars-optik-ve-lens/ adresine yayınlanır. API adresi repo değişkeni `VITE_API_URL` ile verilir (*Settings → Secrets and variables → Actions → Variables*).
- **.NET servisi → Render:** `render.yaml` içindeki `ars-optik-dotnet`. `DATABASE_URL` Render panelinden girilir (backend ile aynı Neon adresi), `JWT_ACCESS_SECRET` backend'den otomatik alınır. Testler `.github/workflows/dotnet-service.yml` ile her push'ta çalışır (`cd dotnet-service && dotnet test`).
- **Backend → Render:** `render.yaml` blueprint'i. `CORS_ORIGIN` GitHub Pages kökenine (`https://erhan-arslan.github.io`) ayarlıdır.
