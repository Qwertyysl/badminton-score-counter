# Badminton Score Counter 🏸

Aplikasi papan skor badminton digital moden dan responsif dengan penjejak servis, pemasa perlawanan, pengumuman suara Web Speech TTS bahasa Melayu, dan buku peraturan rasmi BWF.

---

## 🚀 Panduan Deploy ke Vercel

Aplikasi ini telah dikonfigurasi sepenuhnya untuk **Vercel** dengan fail `vercel.json` dan skrip Vite standard.

### Kaedah 1: Menggunakan GitHub & Vercel Dashboard (Paling Mudah)

1. **Eksport kod**:
   - Klik menu **Settings / Export** di AI Studio untuk eksport ke **GitHub** atau muat turun **ZIP**.
   - Jika muat turun ZIP, ekstrak dan tolak (*push*) projek ke repositori GitHub anda.

2. **Sambung ke Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New Project**.
   - Pilih repositori GitHub anda (`badminton-score-counter`).

3. **Konfigurasi Vercel (Auto-detect)**:
   - **Framework Preset**: `Vite` (Vercel akan mengesan ini secara automatik)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Klik **Deploy**!
   - Dalam beberapa saat, perlawanan papan skor anda akan aktif di domain `.vercel.app`.

---

### Kaedah 2: Menggunakan Vercel CLI

Jika anda suka guna terminal:

```bash
# 1. Pasang Vercel CLI jika belum ada
npm i -g vercel

# 2. Log masuk ke akaun Vercel anda
vercel login

# 3. Jalankan arahan deploy di direktori projek
vercel

# 4. Untuk deploy ke production
vercel --prod
```

---

## 🛠️ Pembangunan Tempatan (Local Development)

```bash
# Pasang dependencies
npm install

# Jalankan dev server
npm run dev

# Bina untuk production
npm run build
```
