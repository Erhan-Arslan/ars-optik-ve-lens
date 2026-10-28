import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, FrameShape, Gender, ProductCategory, Role } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const lensTypes = [
  { code: 'tek-odak', name: 'Tek Odak', description: 'Uzak veya yakın için standart tek odaklı cam.', priceModifier: 0 },
  { code: 'progresif', name: 'Progresif', description: 'Uzak, orta ve yakın mesafeyi tek camda birleştirir.', priceModifier: 1800 },
  { code: 'bifokal', name: 'Bifokal', description: 'Uzak ve yakın görüş için iki bölgeli cam.', priceModifier: 900 },
];

const lensCoatings = [
  { code: 'standart', name: 'Standart Kaplama', description: 'Çizilmeye karşı temel koruma.', priceModifier: 0 },
  { code: 'mavi-isik', name: 'Mavi Işık Filtresi', description: 'Ekranlardan gelen mavi ışığı süzer.', priceModifier: 450 },
  { code: 'fotokromik', name: 'Fotokromik', description: 'Işığa göre otomatik koyulaşan cam.', priceModifier: 1200 },
  { code: 'yansima-onleyici', name: 'Yansıma Önleyici', description: 'Parlama ve yansımaları azaltır.', priceModifier: 350 },
];

const products = [
  {
    slug: 'leo-yuvarlak-cerceve', name: 'Leo Yuvarlak Çerçeve', brand: 'ARS Optik',
    category: ProductCategory.CERCEVE, shape: FrameShape.YUVARLAK, gender: Gender.UNISEX,
    price: 3200, compareAtPrice: 3900,
    description: "İnce metal gövdesi ve zamansız yuvarlak silüetiyle Leo, hem günlük hem ofis kullanımı için tasarlandı. Titanyum alaşımlı menteşeler uzun ömürlü konfor sağlar.",
    material: 'Titanyum Alaşım', isBestseller: true, rating: 4.8, reviewCount: 214, requiresPrescription: true,
    colors: [{ name: 'Antik Altın', hex: '#C89A3E' }, { name: 'Bronz', hex: '#9C6024' }, { name: 'Kömür', hex: '#241C15' }],
  },
  {
    slug: 'regal-kelebek-cerceve', name: 'Regal Kelebek Çerçeve', brand: 'ARS Optik',
    category: ProductCategory.CERCEVE, shape: FrameShape.KELEBEK, gender: Gender.KADIN,
    price: 3650,
    description: 'Yükselen dış hatları ile Regal, yüz hatlarını yumuşatan zarif bir kelebek çerçeve. Asetat gövde, hafif ve dayanıklı kullanım sunar.',
    material: 'İtalyan Asetat', isNew: true, rating: 4.9, reviewCount: 89, requiresPrescription: true,
    colors: [{ name: 'Şampanya', hex: '#E4D878' }, { name: 'Kaplumbağa', hex: '#AC712E' }, { name: 'Siyah', hex: '#16110c' }],
  },
  {
    slug: 'atlas-pilot-gunes-gozlugu', name: 'Atlas Pilot Güneş Gözlüğü', brand: 'ARS Optik',
    category: ProductCategory.GUNES_GOZLUGU, shape: FrameShape.PILOT, gender: Gender.ERKEK,
    price: 2850,
    description: 'Polarize camları ve %100 UV400 korumasıyla Atlas, klasik pilot formunu modern bir zarafetle yeniden yorumluyor.',
    material: 'Paslanmaz Çelik', isBestseller: true, rating: 4.7, reviewCount: 342, requiresPrescription: false,
    colors: [{ name: 'Altın / Kehribar', hex: '#C89A3E' }, { name: 'Gümüş / Duman', hex: '#8F7D68' }],
  },
  {
    slug: 'vera-oval-cerceve', name: 'Vera Oval Çerçeve', brand: 'ARS Optik',
    category: ProductCategory.CERCEVE, shape: FrameShape.OVAL, gender: Gender.KADIN,
    price: 2950,
    description: "Vera'nın yumuşak oval hatları her yüz tipine uyum sağlayan sofistike bir seçenek sunar.",
    material: 'İtalyan Asetat', rating: 4.6, reviewCount: 128, requiresPrescription: true,
    colors: [{ name: 'Krem', hex: '#F5E7C9' }, { name: 'Bronz', hex: '#9C6024' }],
  },
  {
    slug: 'nova-kare-cerceve', name: 'Nova Kare Çerçeve', brand: 'ARS Optik',
    category: ProductCategory.CERCEVE, shape: FrameShape.KARE, gender: Gender.ERKEK,
    price: 3100,
    description: 'Belirgin köşeleri ile Nova, güçlü ve modern bir duruş arayanlar için tasarlandı.',
    material: 'Titanyum Alaşım', isNew: true, rating: 4.5, reviewCount: 76, requiresPrescription: true,
    colors: [{ name: 'Kömür', hex: '#241C15' }, { name: 'Bronz', hex: '#9C6024' }],
  },
  {
    slug: 'solstice-kelebek-gunes-gozlugu', name: 'Solstice Kelebek Güneş Gözlüğü', brand: 'ARS Optik',
    category: ProductCategory.GUNES_GOZLUGU, shape: FrameShape.KELEBEK, gender: Gender.KADIN,
    price: 3400, compareAtPrice: 3900,
    description: 'Gün batımı tonlarında gradyan camlar ve altın detaylarla Solstice, yaz aylarının vazgeçilmezi.',
    material: 'İtalyan Asetat', isBestseller: true, rating: 4.9, reviewCount: 401, requiresPrescription: false,
    colors: [{ name: 'Şampanya', hex: '#E4D878' }, { name: 'Kömür', hex: '#241C15' }],
  },
  {
    slug: 'aria-dikdortgen-cerceve', name: 'Aria Dikdörtgen Çerçeve', brand: 'ARS Optik',
    category: ProductCategory.CERCEVE, shape: FrameShape.DIKDORTGEN, gender: Gender.UNISEX,
    price: 2700,
    description: 'Minimal dikdörtgen formu ile Aria, her güne uyum sağlayan çok yönlü bir klasik.',
    material: 'Titanyum Alaşım', rating: 4.4, reviewCount: 63, requiresPrescription: true,
    colors: [{ name: 'Bronz', hex: '#9C6024' }, { name: 'Kömür', hex: '#241C15' }, { name: 'Antik Altın', hex: '#C89A3E' }],
  },
  {
    slug: 'meridian-pilot-gunes-gozlugu', name: 'Meridian Pilot Güneş Gözlüğü', brand: 'ARS Optik',
    category: ProductCategory.GUNES_GOZLUGU, shape: FrameShape.PILOT, gender: Gender.UNISEX,
    price: 3050,
    description: 'Meridian, ince metal çerçevesi ve aynalı camlarıyla ikonik pilot silüetini yükseltiyor.',
    material: 'Paslanmaz Çelik', rating: 4.6, reviewCount: 154, requiresPrescription: false,
    colors: [{ name: 'Altın / Kehribar', hex: '#C89A3E' }],
  },
  {
    slug: 'gunluk-aylik-lens', name: "Aylık Şeffaf Lens (6'lı Kutu)", brand: 'ARS Lens',
    category: ProductCategory.LENS, gender: Gender.UNISEX,
    price: 890,
    description: 'Silikon hidrojel yapısı ile yüksek nem oranı sunan, tüm gün konforlu aylık kontakt lens.',
    rating: 4.7, reviewCount: 522, requiresPrescription: true,
    colors: [{ name: 'Şeffaf', hex: '#E4D878' }],
  },
  {
    slug: 'gunluk-tek-kullanimlik-lens', name: "Günlük Tek Kullanımlık Lens (30'lu Kutu)", brand: 'ARS Lens',
    category: ProductCategory.LENS, gender: Gender.UNISEX,
    price: 1250,
    description: 'Her gün taze lens deneyimi — bakım gerektirmez, hijyenik ve pratik.',
    rating: 4.8, reviewCount: 318, requiresPrescription: true,
    colors: [{ name: 'Şeffaf', hex: '#C89A3E' }],
  },
  {
    slug: 'linea-yuvarlak-gunes-gozlugu', name: 'Linea Yuvarlak Güneş Gözlüğü', brand: 'ARS Optik',
    category: ProductCategory.GUNES_GOZLUGU, shape: FrameShape.YUVARLAK, gender: Gender.UNISEX,
    price: 2600,
    description: 'Retro ilhamlı yuvarlak formu ile Linea, bohem ve şık bir tarz arayanlara hitap ediyor.',
    material: 'Paslanmaz Çelik', isNew: true, rating: 4.5, reviewCount: 97, requiresPrescription: false,
    colors: [{ name: 'Bronz', hex: '#9C6024' }, { name: 'Kömür', hex: '#241C15' }],
  },
  {
    slug: 'denim-kare-cerceve', name: 'Denim Kare Çerçeve', brand: 'ARS Optik',
    category: ProductCategory.CERCEVE, shape: FrameShape.KARE, gender: Gender.KADIN,
    price: 2450, compareAtPrice: 2900,
    description: 'Yumuşak köşeli kare hatları ile Denim, gündelik şıklığı temsil ediyor.',
    material: 'İtalyan Asetat', rating: 4.3, reviewCount: 44, requiresPrescription: true,
    colors: [{ name: 'Krem', hex: '#F5E7C9' }, { name: 'Şampanya', hex: '#E4D878' }],
  },
];

async function main() {
  console.log('Seed başlıyor...');

  for (const lt of lensTypes) {
    await prisma.lensType.upsert({ where: { code: lt.code }, update: lt, create: lt });
  }
  for (const lc of lensCoatings) {
    await prisma.lensCoating.upsert({ where: { code: lc.code }, update: lc, create: lc });
  }

  for (const { colors, ...product } of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, colors: { deleteMany: {}, create: colors } },
      create: { ...product, colors: { create: colors } },
    });
  }

  // In production the password must come from ADMIN_PASSWORD and is re-applied on every seed,
  // so rotating the env var rotates the live admin password. Locally a dev default is used.
  const adminEmail = 'admin@arsoptik.com';
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envPassword && process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_PASSWORD tanımlı değil; production ortamında admin seed edilemez.');
  }
  const adminPassword = envPassword ?? 'ArsOptik2026!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: envPassword ? { role: Role.ADMIN, passwordHash } : { role: Role.ADMIN },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'Kullanıcı',
      role: Role.ADMIN,
    },
  });

  console.log(`Seed tamamlandı: ${products.length} ürün, ${lensTypes.length} lens tipi, ${lensCoatings.length} kaplama.`);
  console.log(
    envPassword
      ? `Admin girişi -> e-posta: ${adminEmail} / şifre: ADMIN_PASSWORD ortam değişkeni`
      : `Admin girişi -> e-posta: ${adminEmail} / şifre: ${adminPassword} (yerel geliştirme varsayılanı)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
