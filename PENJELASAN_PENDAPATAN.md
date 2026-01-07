# Penjelasan Sistem Pendapatan

## 📊 Cara Kerja Perhitungan Pendapatan

### **Data Source:**
Sistem menghitung pendapatan dari **SEMUA transaksi**, termasuk:
1. ✅ Transaksi Aktif (`transactions`)
2. ✅ Transaksi Selesai (`completedTransactions`)
3. ❌ Transaksi Dihapus (`deletedTransactions`) - TIDAK dihitung

### **Fungsi Perhitungan:**

```javascript
// Menggabungkan semua transaksi
const allTransactions = [...transactions, ...completedTransactions];

// Pendapatan Hari Ini
const getTodayRevenue = () => {
  return allTransactions
    .filter(tx => tx.date === today)
    .reduce((sum, tx) => sum + tx.amount, 0);
};

// Pendapatan Kemarin
const getYesterdayRevenue = () => {
  return allTransactions
    .filter(tx => tx.date === yesterday)
    .reduce((sum, tx) => sum + tx.amount, 0);
};

// Total Pendapatan
const totalRevenue = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
```

## 🔄 Fitur Pindahkan - Tidak Mempengaruhi Pendapatan

### **Apa yang Terjadi Saat Pindahkan:**

1. **Transaksi dipindahkan** dari `transactions` ke `completedTransactions`
2. **Data tetap utuh** - tidak ada yang dihapus
3. **Pendapatan tetap sama** - karena menghitung dari kedua array

### **Contoh Skenario:**

```
SEBELUM PINDAHKAN:
- transactions: [TRX-001 (Rp 25.000), TRX-002 (Rp 20.000)]
- completedTransactions: []
- Total Pendapatan: Rp 45.000

SETELAH PINDAHKAN TRX-001:
- transactions: [TRX-002 (Rp 20.000)]
- completedTransactions: [TRX-001 (Rp 25.000)]
- Total Pendapatan: Rp 45.000 (TETAP!)
```

## 📱 Kartu Statistik di Dashboard

### **6 Kartu Utama:**

1. **Pendapatan Hari Ini**
   - Menghitung transaksi yang dibuat hari ini
   - Dari: `transactions` + `completedTransactions`
   - Tidak berubah saat pindahkan

2. **Pendapatan Kemarin**
   - Menghitung transaksi yang dibuat kemarin
   - Dari: `transactions` + `completedTransactions`
   - Tidak berubah saat pindahkan

3. **Total Pendapatan** (BARU!)
   - Menghitung SEMUA transaksi
   - Dari: `transactions` + `completedTransactions`
   - Tidak berubah saat pindahkan

4. **Tabungan SeaBank**
   - Saldo tabungan pribadi
   - Terpisah dari pendapatan bisnis

5. **Total Jasa Antar**
   - Jumlah transaksi jasa antar
   - Dari: `transactions` + `completedTransactions`

6. **Total Ambil Unit**
   - Jumlah transaksi ambil unit
   - Dari: `transactions` + `completedTransactions`

## 🔧 Troubleshooting

### **Jika Pendapatan Menjadi Rp 0:**

1. **Cek Browser Console:**
   ```javascript
   // Buka Developer Tools (F12)
   // Ketik di Console:
   localStorage.getItem('ps_rental_transactions')
   localStorage.getItem('ps_rental_completed_transactions')
   ```

2. **Cek Data di LocalStorage:**
   - Buka Developer Tools (F12)
   - Tab: Application → Local Storage
   - Cari key: `ps_rental_transactions` dan `ps_rental_completed_transactions`

3. **Clear Cache & Reload:**
   - Kadang browser cache menyebabkan data tidak update
   - Tekan Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac)

### **Jika Data Hilang Setelah Pindahkan:**

Ini TIDAK SEHARUSNYA terjadi karena:
- Fungsi `completeTransaction()` hanya memindahkan, tidak menghapus
- Data disimpan ke `completedTransactions`
- Semua fungsi perhitungan menggabungkan kedua array

**Solusi:**
1. Pastikan tidak ada error di Console
2. Cek apakah `completedTransactions` tersimpan di localStorage
3. Refresh halaman untuk reload data dari localStorage

## 💾 Penyimpanan Data

### **LocalStorage Keys:**
```javascript
{
  'ps_rental_transactions': [...],           // Transaksi aktif
  'ps_rental_completed_transactions': [...], // Transaksi selesai
  'ps_rental_deleted_transactions': [...],   // Transaksi dihapus
  'ps_rental_savings': {...},                // Data tabungan
  // ... keys lainnya
}
```

### **Auto-Save:**
Setiap perubahan data otomatis disimpan ke localStorage:
- Saat tambah transaksi baru
- Saat pindahkan transaksi
- Saat hapus transaksi
- Saat menabung/tarik uang

## ✅ Jaminan Data

### **Data TIDAK akan hilang saat:**
- ✅ Pindahkan transaksi ke "Selesai"
- ✅ Akhiri sesi rental
- ✅ Refresh halaman
- ✅ Tutup dan buka browser

### **Data AKAN hilang saat:**
- ❌ Clear browser data/cache
- ❌ Hapus transaksi (pindah ke arsip)
- ❌ Logout dan clear data

## 🎯 Best Practices

1. **Jangan Clear Browser Data** - Data tersimpan di localStorage
2. **Backup Berkala** - Export data penting secara berkala
3. **Cek Console** - Jika ada masalah, cek error di console
4. **Test Fitur** - Test pindahkan dengan data dummy dulu

## 📞 Support

Jika masih ada masalah dengan pendapatan yang berubah:
1. Cek console untuk error
2. Cek localStorage untuk data
3. Screenshot masalah dan error message
4. Hubungi developer dengan detail masalah
