# 📱 PWA Setup - PRG RENTAL

## ✅ PWA Sudah Aktif!

Aplikasi PRG RENTAL sekarang sudah menjadi Progressive Web App (PWA) yang bisa diinstall seperti aplikasi native!

## 🎯 Fitur PWA yang Tersedia:

1. **Install ke Home Screen** - Bisa diinstall di Android, iOS, dan Desktop
2. **Offline Support** - Aplikasi tetap bisa dibuka tanpa internet
3. **Fast Loading** - Cache otomatis untuk performa maksimal
4. **Auto Update** - Update otomatis saat ada versi baru
5. **Full Screen Mode** - Tampilan seperti aplikasi native
6. **Install Prompt** - Notifikasi install otomatis muncul

## 📲 Cara Install di Android:

1. Buka website di **Chrome** atau **Edge**
2. Klik tombol **"Install PRG RENTAL"** yang muncul di bawah
3. Atau klik menu (⋮) → **"Install app"** atau **"Add to Home screen"**
4. Aplikasi akan muncul di home screen seperti aplikasi biasa

## 🍎 Cara Install di iOS (iPhone/iPad):

1. Buka website di **Safari**
2. Klik tombol **Share** (kotak dengan panah ke atas)
3. Scroll dan pilih **"Add to Home Screen"**
4. Klik **"Add"**
5. Aplikasi akan muncul di home screen

## 💻 Cara Install di Desktop (Windows/Mac):

1. Buka website di **Chrome** atau **Edge**
2. Klik icon **Install** (⊕) di address bar
3. Atau klik menu (⋮) → **"Install PRG RENTAL"**
4. Aplikasi akan terbuka di window terpisah

## 🚀 Cara Deploy:

### Deploy ke Vercel (Gratis):
```bash
npm install -g vercel
vercel login
vercel
```

### Deploy ke Netlify (Gratis):
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Deploy ke Server Sendiri:
```bash
npm run build
# Upload folder 'dist' ke hosting
```

## 🔧 Development:

```bash
# Development mode
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

## 📝 Catatan:

- PWA hanya berfungsi di **HTTPS** (kecuali localhost)
- Install prompt hanya muncul 1x, jika ditolak akan disimpan di localStorage
- File besar (logo, QRIS, video) sudah di-cache dengan limit 5MB
- Service Worker akan auto-update saat ada perubahan

## 🎨 Customization:

Edit file berikut untuk customize PWA:
- `public/manifest.json` - App info & icons
- `vite.config.ts` - PWA configuration
- `src/components/InstallPWA.tsx` - Install prompt UI

---

**Selamat! Aplikasi Anda sekarang sudah menjadi PWA! 🎉**
