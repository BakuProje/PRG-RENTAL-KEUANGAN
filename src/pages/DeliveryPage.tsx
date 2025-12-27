import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Gamepad2, 
  User, 
  Phone, 
  MapPin,
  Check,
  ArrowRight,
  Loader2,
  Star,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { GPSMap } from '@/components/maps/GPSMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { Location, RentalPackage, RENTAL_PACKAGES, JASA_ANTAR_FEE, TransactionType } from '@/types/rental';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DeliveryPage() {
  const navigate = useNavigate();
  const { addTransaction, inventory, favoriteLocations, addFavoriteLocation } = useApp();
  
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const dayName = today.toLocaleDateString('id-ID', { weekday: 'long' });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [transactionType, setTransactionType] = useState<TransactionType>('jasa_antar');
  const [selectedPackage, setSelectedPackage] = useState<RentalPackage | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [notes, setNotes] = useState('');
  const [saveFavorite, setSaveFavorite] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');

  // Check stock availability
  const checkStockAvailable = (pkg: RentalPackage): boolean => {
    const packageInfo = RENTAL_PACKAGES[pkg];
    return packageInfo.items.every(itemType => {
      const item = inventory.find(i => i.type === itemType);
      return item && item.available > 0;
    });
  };

  // Calculate amount
  const getAmount = (): number => {
    if (transactionType === 'jasa_antar') {
      // Jasa antar always Rp 25.000, regardless of package selected
      return JASA_ANTAR_FEE;
    }
    if (selectedPackage) return RENTAL_PACKAGES[selectedPackage].price;
    return 0;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!location) {
      toast.error('Lokasi belum dipilih');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Nama pelanggan harus diisi');
      return;
    }

    if (!customerPhone.trim()) {
      toast.error('Nomor telepon harus diisi');
      return;
    }

    if (transactionType === 'ambil_unit' && !selectedPackage) {
      toast.error('Pilih paket rental terlebih dahulu');
      return;
    }

    if (transactionType === 'jasa_antar' && selectedPackage) {
      // Check stock for jasa antar with package
      const isAvailable = checkStockAvailable(selectedPackage);
      if (!isAvailable) {
        toast.error('Stok paket tidak tersedia');
        return;
      }
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    addTransaction({
      type: transactionType,
      package: selectedPackage || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      location,
      amount: getAmount(),
      date: new Date(),
      notes: notes.trim() || undefined,
    });

    // Save favorite location if requested
    if (saveFavorite && favoriteName.trim() && location) {
      addFavoriteLocation({
        name: favoriteName.trim(),
        location,
      });
    }

    toast.success('Transaksi berhasil disimpan!');
    navigate('/');
  };

  // Select favorite location
  const selectFavoriteLocation = (fav: typeof favoriteLocations[0]) => {
    setLocation(fav.location);
    toast.success(`Lokasi "${fav.name}" dipilih`);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Input Pengantaran
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {dayName}, {today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2"
        >
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  step >= s
                    ? 'gradient-primary text-primary-foreground shadow-glow'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  'w-12 lg:w-20 h-1 rounded-full transition-colors',
                  step > s ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-6 shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-4">Pilih Jenis Transaksi</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Jasa Antar Option */}
                  <button
                    onClick={() => setTransactionType('jasa_antar')}
                    className={cn(
                      'p-6 rounded-xl border-2 text-left transition-all hover:shadow-md',
                      transactionType === 'jasa_antar'
                        ? 'border-primary bg-primary/5 shadow-glow'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center mb-4">
                      <Truck className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-foreground">Jasa Antar</h3>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {formatCurrency(JASA_ANTAR_FEE)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Biaya pengantaran saja, tanpa rental unit
                    </p>
                  </button>

                  {/* Ambil Unit Option */}
                  <button
                    onClick={() => isWeekend && setTransactionType('ambil_unit')}
                    disabled={!isWeekend}
                    className={cn(
                      'p-6 rounded-xl border-2 text-left transition-all relative',
                      !isWeekend && 'opacity-50 cursor-not-allowed',
                      transactionType === 'ambil_unit'
                        ? 'border-success bg-success/5 shadow-glow-success'
                        : 'border-border hover:border-success/50'
                    )}
                  >
                    {!isWeekend && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-warning text-warning-foreground text-xs font-bold">
                        Sabtu/Minggu Only
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-xl gradient-success text-secondary-foreground flex items-center justify-center mb-4">
                      <Gamepad2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-foreground">Ambil Unit Full</h3>
                    <p className="text-2xl font-bold text-success mt-2">
                      {formatCurrency(60000)} - {formatCurrency(135000)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Rental unit lengkap dengan keuntungan penuh
                    </p>
                  </button>
                </div>

                {/* Package Selection for Jasa Antar */}
                {transactionType === 'jasa_antar' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-border"
                  >
                    <h3 className="font-bold text-foreground mb-2">Unit yang Dibawa (Opsional)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pilih unit yang Anda bawa untuk pengantaran (tidak menambah biaya)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(RENTAL_PACKAGES).map((pkg) => {
                        const isAvailable = checkStockAvailable(pkg.id);
                        return (
                          <button
                            key={pkg.id}
                            onClick={() => isAvailable && setSelectedPackage(selectedPackage === pkg.id ? null : pkg.id)}
                            disabled={!isAvailable}
                            className={cn(
                              'p-4 rounded-lg border-2 text-left transition-all',
                              !isAvailable && 'opacity-50 cursor-not-allowed',
                              selectedPackage === pkg.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            <h4 className="font-bold text-foreground text-sm">{pkg.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {pkg.items.length} unit
                            </p>
                            {!isAvailable && (
                              <p className="text-xs text-destructive mt-1">Stok habis</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Package Selection for Ambil Unit */}
                {transactionType === 'ambil_unit' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-border"
                  >
                    <h3 className="font-bold text-foreground mb-4">Pilih Paket</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(RENTAL_PACKAGES).map((pkg) => {
                        const isAvailable = checkStockAvailable(pkg.id);
                        return (
                          <button
                            key={pkg.id}
                            onClick={() => isAvailable && setSelectedPackage(pkg.id)}
                            disabled={!isAvailable}
                            className={cn(
                              'p-4 rounded-lg border-2 text-left transition-all',
                              !isAvailable && 'opacity-50 cursor-not-allowed',
                              selectedPackage === pkg.id
                                ? 'border-success bg-success/5'
                                : 'border-border hover:border-success/50'
                            )}
                          >
                            <h4 className="font-bold text-foreground text-sm">{pkg.name}</h4>
                            <p className="text-lg font-bold text-success">
                              {formatCurrency(pkg.price)}
                            </p>
                            {!isAvailable && (
                              <p className="text-xs text-destructive mt-1">Stok habis</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full gap-2 gradient-primary text-primary-foreground shadow-glow hover:shadow-lg"
              >
                Lanjut ke Lokasi
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-6 shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-4">Lokasi Pengantaran</h2>

                {/* Favorite Locations */}
                {favoriteLocations.length > 0 && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-2 block">Lokasi Favorit</Label>
                    <div className="flex flex-wrap gap-2">
                      {favoriteLocations.map((fav) => (
                        <button
                          key={fav.id}
                          onClick={() => selectFavoriteLocation(fav)}
                          className={cn(
                            'px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition-all',
                            location?.address === fav.location.address
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <Star className="w-3 h-3" />
                          {fav.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* GPS Map */}
                <GPSMap
                  onLocationSelect={setLocation}
                  initialLocation={location || undefined}
                />

                {/* Save as Favorite */}
                {location && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSaveFavorite(!saveFavorite)}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          saveFavorite
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border'
                        )}
                      >
                        {saveFavorite && <Check className="w-3 h-3" />}
                      </button>
                      <span className="text-sm text-foreground">Simpan sebagai lokasi favorit</span>
                    </div>
                    {saveFavorite && (
                      <Input
                        value={favoriteName}
                        onChange={(e) => setFavoriteName(e.target.value)}
                        placeholder="Nama lokasi (contoh: Rumah Pak Budi)"
                        className="mt-3"
                      />
                    )}
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Kembali
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!location}
                  className="flex-1 gap-2 gradient-primary text-primary-foreground shadow-glow hover:shadow-lg"
                >
                  Lanjut
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-xl border border-border p-6 shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-4">Data Pelanggan</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Nama Pelanggan
                    </Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Nomor Telepon
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="08xx-xxxx-xxxx"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="flex items-center gap-2 mb-2">
                      Catatan (Opsional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan tambahan..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-4">Ringkasan</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jenis Transaksi</span>
                    <span className="font-medium text-foreground">
                      {transactionType === 'jasa_antar' ? 'Jasa Antar' : 'Ambil Unit Full'}
                    </span>
                  </div>
                  {selectedPackage && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {transactionType === 'jasa_antar' ? 'Unit yang Dibawa' : 'Paket'}
                      </span>
                      <span className="font-medium text-foreground">
                        {RENTAL_PACKAGES[selectedPackage].name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lokasi</span>
                    <span className="font-medium text-foreground text-right max-w-[60%] truncate">
                      {location?.address || '-'}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-foreground">Total</span>
                      <span className="text-2xl font-bold text-success">
                        {formatCurrency(getAmount())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Kembali
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !customerName.trim() || !customerPhone.trim()}
                  className="flex-1 gap-2 gradient-success text-secondary-foreground shadow-glow-success hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan Transaksi
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
