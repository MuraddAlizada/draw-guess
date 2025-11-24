# Vercel'e Deploy Etme Rehberi

## Adımlar

### 1. GitHub'a Push Et
```bash
git add .
git commit -m "Vercel deploy hazırlığı"
git push origin main
```

### 2. Vercel'e Bağla

1. [Vercel.com](https://vercel.com) hesabına giriş yap
2. "Add New Project" butonuna tıkla
3. GitHub repository'ni seç: `MuraddAlizada/draw-guess`
4. Vercel otomatik olarak ayarları algılayacak

### 3. Build Ayarları (Otomatik algılanır)

Vercel şu ayarları otomatik algılar:
- **Framework Preset**: Other
- **Root Directory**: `./` (root)
- **Build Command**: `cd backend && npm install`
- **Output Directory**: `frontend`
- **Install Command**: (boş bırakılabilir, Vercel otomatik `npm install` yapar)

### 4. Environment Variables (Gerekirse)

Eğer `.env` dosyasında değişkenler varsa, Vercel dashboard'da:
- Settings → Environment Variables
- Gerekli değişkenleri ekle

### 5. Deploy

Vercel otomatik olarak deploy edecek. İlk deploy'dan sonra:
- URL: `https://your-project.vercel.app`
- API endpoint'leri: `https://your-project.vercel.app/api/*`

## Önemli Notlar

### Backend (API)
- Backend kodları `api/[...].ts` dosyasında serverless function olarak çalışır
- Tüm `/api/*` route'ları bu function'a yönlendirilir
- Session cleanup her request'te çalışır (serverless'da setInterval çalışmaz)

### Frontend
- Frontend dosyaları `frontend/` klasöründen static olarak serve edilir
- API URL'leri otomatik olarak `/api` kullanır (production'da)

### Arkadaşlarınla Oynama
1. Vercel deploy edildikten sonra URL'yi paylaş
2. Herkes aynı URL'ye giriş yapsın
3. Birisi "Yeni Oyun Başlat" butonuna tıklasın
4. Session ID'yi paylaşsın
5. Diğerleri "Oyuna Qatıl" butonuna tıklayıp Session ID'yi girsin

## Sorun Giderme

### API çalışmıyor
- Vercel dashboard'da Functions sekmesine bak
- Log'larda hata var mı kontrol et
- `api/[...].ts` dosyasının doğru olduğundan emin ol

### Frontend yüklenmiyor
- `vercel.json` dosyasında `outputDirectory: "frontend"` olduğundan emin ol
- Build log'larını kontrol et

### CORS hatası
- `api/[...].ts` dosyasında `cors()` middleware'i var
- Vercel'in otomatik CORS header'ları da eklenmiş

## Test Etme

Deploy'dan sonra test et:
1. Ana sayfa yükleniyor mu?
2. Yeni oyun başlatılabiliyor mu?
3. Session ID paylaşılabiliyor mu?
4. Başka bir tarayıcıdan/cihazdan oyuna katılabiliyor musun?

