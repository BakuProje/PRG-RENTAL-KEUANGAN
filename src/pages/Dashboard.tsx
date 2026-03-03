import { motion } from 'framer-motion';
import {
  Truck,
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Gamepad2,
  MapPin,
  Phone,
  ExternalLink,
  PiggyBank,
  Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { RENTAL_PACKAGES, getPackageAvailableCount } from '@/types/rental';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Dashboard() {
  const { user, transactions, completedTransactions, inventory, getTodayRevenue, getYesterdayRevenue, savings, addSavings, withdrawSavings } = useApp();

  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsNote, setSavingsNote] = useState('');
  const [showSavingsForm, setShowSavingsForm] = useState(false);

  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  const dayName = today.toLocaleDateString('id-ID', { weekday: 'long' });

  // Get today's and yesterday's revenue using dedicated functions
  const todayRevenue = getTodayRevenue();
  const yesterdayRevenue = getYesterdayRevenue();

  // Combine all transactions for other statistics (active + completed)
  const allTransactions = [...transactions, ...completedTransactions];

  const weekTransactions = allTransactions.filter(t => {
    const txDate = new Date(t.date);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return txDate >= weekAgo;
  });

  const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);
  const weekRevenue = weekTransactions.reduce((sum, t) => sum + t.amount, 0);

  const jasaAntarCount = allTransactions.filter(t => t.type === 'jasa_antar').length;
  const ambilUnitCount = allTransactions.filter(t => t.type === 'ambil_unit').length;

  const lowStockItems = inventory.filter(i => i.available <= i.minStock);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Recent transactions - only show active ones in the list
  const recentTransactions = transactions.slice(0, 5);

  // Handle savings operations
  const handleAddSavings = () => {
    const amount = parseFloat(savingsAmount.replace(/\./g, ''));
    if (!amount || amount <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }

    addSavings(amount, savingsNote.trim() || undefined);
    setSavingsAmount('');
    setSavingsNote('');
    setShowSavingsForm(false);
    toast.success(`Berhasil menabung ${formatCurrency(amount)}!`);
  };

  const handleWithdrawSavings = () => {
    const amount = parseFloat(savingsAmount.replace(/\./g, ''));
    if (!amount || amount <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }

    if (amount > savings.totalBalance) {
      toast.error('Saldo tidak mencukupi');
      return;
    }

    withdrawSavings(amount, savingsNote.trim() || undefined);
    setSavingsAmount('');
    setSavingsNote('');
    setShowSavingsForm(false);
    toast.success(`Berhasil tarik ${formatCurrency(amount)}!`);
  };

  // Format number input
  const formatNumberInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Open Google Maps
  const openGoogleMaps = (lat: number, lng: number, address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <span>Selamat Datang, {user?.name}!</span>
              <span className="text-3xl">👋</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {dayName}, {today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link to="/delivery" className="w-full lg:w-auto">
            <Button className="w-full lg:w-auto gap-2 gradient-primary text-primary-foreground shadow-glow hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />
              Input Pengantaran
            </Button>
          </Link>
        </motion.div>

        {/* Weekend Alert */}
        {isWeekend && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl gradient-warm text-warning-foreground flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-warning-foreground/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base lg:text-lg">Hari {dayName}!</h3>
              <p className="text-xs lg:text-sm opacity-90 line-clamp-2">
                Pilih Jasa Antar atau Ambil Unit Full.
              </p>
            </div>
            <Link to="/delivery" className="flex-shrink-0">
              <Button variant="secondary" size="sm" className="gap-1 bg-card text-foreground hover:bg-card/90 text-xs lg:text-sm">
                Input
                <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-destructive text-base lg:text-lg">Stok Hampir Habis!</h3>
              <p className="text-xs lg:text-sm text-muted-foreground line-clamp-1">
                {lowStockItems.map(i => i.name).join(', ')} perlu diisi ulang.
              </p>
            </div>
            <Link to="/inventory" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs lg:text-sm">
                Kelola
                <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            title="Pendapatan Hari Ini"
            value={formatCurrency(todayRevenue?.totalAmount || 0)}
            subtitle={`${todayRevenue?.transactionCount || 0} transaksi`}
            icon={DollarSign}
            variant="success"
            delay={0}
          />
          <StatCard
            title="Pendapatan Kemarin"
            value={formatCurrency(yesterdayRevenue?.totalAmount || 0)}
            subtitle={`${yesterdayRevenue?.transactionCount || 0} transaksi`}
            icon={Calendar}
            trend={yesterdayRevenue && todayRevenue && (todayRevenue.totalAmount > yesterdayRevenue.totalAmount) ? { value: Math.round(((todayRevenue.totalAmount - yesterdayRevenue.totalAmount) / yesterdayRevenue.totalAmount) * 100), isPositive: true } : undefined}
            variant="default"
            delay={0.1}
          />
          <StatCard
            title="Total Pendapatan"
            value={formatCurrency(totalRevenue)}
            subtitle={`${allTransactions.length} transaksi`}
            icon={TrendingUp}
            variant="primary"
            delay={0.2}
          />
          <StatCard
            title="Tabungan SeaBank"
            value={formatCurrency(savings.totalBalance)}
            subtitle={`${savings.entries.length} transaksi`}
            icon={PiggyBank}
            variant="seabank"
            delay={0.3}
            onClick={() => setShowSavingsForm(true)}
            customIcon="/seabank.png"
          />
          <StatCard
            title="Total Jasa Antar"
            value={jasaAntarCount}
            subtitle={`Minggu ini: ${weekTransactions.filter(t => t.type === 'jasa_antar').length}`}
            icon={Truck}
            variant="default"
            delay={0.4}
          />
          <StatCard
            title="Total Ambil Unit"
            value={ambilUnitCount}
            subtitle="Akhir pekan"
            icon={Package}
            variant="warning"
            delay={0.5}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-gradient-to-br from-card to-card/50 rounded-2xl border border-border/50 shadow-xl overflow-hidden backdrop-blur-xl relative"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-card/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground tracking-tight">Riwayat Pengantaran</h2>
                  <p className="text-xs text-muted-foreground font-medium">{recentTransactions.length} transaksi terakhir</p>
                </div>
              </div>
              <Link to="/history">
                <Button variant="ghost" size="sm" className="text-sm font-semibold text-primary hover:bg-primary/10 hover:text-primary transition-colors gap-1.5 rounded-full px-4">
                  Lihat Semua
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="p-3 divide-y divide-border/30">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="p-3 group"
                  >
                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-300 border border-transparent hover:border-border/50 hover:shadow-sm">
                      <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner',
                        tx.type === 'jasa_antar'
                          ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20'
                          : 'bg-gradient-to-br from-success/20 to-success/5 text-success border border-success/20'
                      )}>
                        {tx.type === 'jasa_antar' ? (
                          <Truck className="w-7 h-7" />
                        ) : (
                          <Gamepad2 className="w-7 h-7" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-foreground truncate text-base group-hover:text-primary transition-colors">{tx.customerName}</h3>
                              {tx.paymentStatus === 'paid' && (
                                <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-bold tracking-wider uppercase">
                                  Lunas
                                </span>
                              )}
                              {tx.paymentStatus === 'unpaid' && (
                                <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-bold tracking-wider uppercase">
                                  Belum Bayar
                                </span>
                              )}
                              {tx.paymentStatus === 'partial' && (
                                <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning text-[10px] font-bold tracking-wider uppercase">
                                  DP
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                              {tx.type === 'jasa_antar'
                                ? tx.package
                                  ? `Jasa Antar • ${RENTAL_PACKAGES[tx.package].name}`
                                  : 'Jasa Antar'
                                : tx.package
                                  ? RENTAL_PACKAGES[tx.package].name
                                  : 'Ambil Unit'}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-extrabold text-foreground tracking-tight">{formatCurrency(tx.amount)}</p>
                            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                              {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 mt-3 space-x-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">
                            <Phone className="w-3.5 h-3.5 text-primary/70" />
                            <span className="font-medium">{tx.customerPhone}</span>
                          </div>
                          <div className="flex flex-1 items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md min-w-0">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-destructive/70" />
                            <span className="truncate font-medium">{tx.location.address}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openGoogleMaps(tx.location.lat, tx.location.lng, tx.location.address)}
                            className="bg-primary/5 hover:bg-primary/10 text-primary gap-1.5 h-8 text-[11px] font-bold px-3 rounded-md"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Maps
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4 border-2 border-dashed border-border">
                    <Package className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Belum ada transaksi</h3>
                  <p className="text-sm text-muted-foreground mt-1">Transaksi terbaru akan muncul di sini.</p>
                  <Link to="/delivery" className="mt-6">
                    <Button variant="outline" className="gap-2 rounded-full border-primary/20 text-primary hover:bg-primary/5">
                      <Plus className="w-4 h-4" />
                      Buat Transaksi Baru
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Inventory Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border shadow-md"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">Status Inventory</h2>
              <Link to="/inventory" className="text-sm text-primary hover:underline">
                Kelola
              </Link>
            </div>
            <div className="p-4 space-y-4">
              {inventory.map((item, index) => {
                const percentage = (item.available / item.stock) * 100;
                const isLow = item.available <= item.minStock;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span className={cn(
                        'text-sm font-bold',
                        isLow ? 'text-destructive' : 'text-success'
                      )}>
                        {item.available}/{item.stock}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.8 + index * 0.05, duration: 0.5 }}
                        className={cn(
                          'h-full rounded-full transition-colors',
                          isLow ? 'bg-destructive' : 'bg-success'
                        )}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {Object.values(RENTAL_PACKAGES).map((pkg, index) => {
            const availableCount = getPackageAvailableCount(pkg.id, inventory);
            return (
              <div
                key={pkg.id}
                className="p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Gamepad2 className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {formatCurrency(pkg.price)}
                  </span>
                </div>
                <h3 className="font-bold text-foreground">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {availableCount} item tersedia
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Savings Modal */}
        {showSavingsForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSavingsForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              {/* Header with SeaBank branding */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2">
                    <img src="/seabank.png" alt="SeaBank" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Tabungan SeaBank</h2>
                    <p className="text-blue-100 text-sm">Kelola tabungan Anda</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-blue-100 mb-1">Saldo Saat Ini</p>
                  <p className="text-2xl font-bold">{formatCurrency(savings.totalBalance)}</p>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Jumlah</Label>
                  <Input
                    type="text"
                    value={savingsAmount}
                    onChange={(e) => setSavingsAmount(formatNumberInput(e.target.value))}
                    placeholder="Contoh: 200.000"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Catatan (Opsional)</Label>
                  <Input
                    value={savingsNote}
                    onChange={(e) => setSavingsNote(e.target.value)}
                    placeholder="Contoh: Tabungan bulanan"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSavingsForm(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleWithdrawSavings}
                    disabled={!savingsAmount || savings.totalBalance === 0}
                    variant="outline"
                    className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  >
                    <Minus className="w-4 h-4" />
                    Tarik
                  </Button>
                  <Button
                    onClick={handleAddSavings}
                    disabled={!savingsAmount}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Plus className="w-4 h-4" />
                    Nabung
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}
