import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  Truck,
  Gamepad2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  FileText
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { useApp } from '@/contexts/AppContext';
import { JASA_ANTAR_FEE } from '@/types/rental';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { transactions } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const handleExportPDF = () => {
    toast.success('Laporan PDF sedang diunduh...');
    // Implement PDF export logic here
  };

  // Calculate stats
  const thisMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const monthlyRevenue = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const jasaAntarRevenue = transactions
    .filter(t => t.type === 'jasa_antar')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const ambilUnitRevenue = transactions
    .filter(t => t.type === 'ambil_unit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Weekly data for chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    const dayTransactions = transactions.filter(tx => 
      new Date(tx.date).toDateString() === date.toDateString()
    );
    return {
      day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      date: date.getDate(),
      revenue: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
      count: dayTransactions.length,
    };
  });

  const maxRevenue = Math.max(...weeklyData.map(d => d.revenue), 1);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Monthly breakdown
  const monthlyBreakdown = [
    {
      label: 'Jasa Antar',
      value: jasaAntarRevenue,
      percentage: totalRevenue > 0 ? (jasaAntarRevenue / totalRevenue) * 100 : 0,
      color: 'bg-primary',
      icon: Truck,
    },
    {
      label: 'Ambil Unit',
      value: ambilUnitRevenue,
      percentage: totalRevenue > 0 ? (ambilUnitRevenue / totalRevenue) * 100 : 0,
      color: 'bg-success',
      icon: Gamepad2,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              Laporan Keuangan
            </h1>
            <p className="text-muted-foreground mt-1 ml-[52px]">
              {today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
              {(['week', 'month', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    selectedPeriod === period
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {period === 'week' ? '7 Hari' : period === 'month' ? 'Bulan Ini' : 'Semua'}
                </button>
              ))}
            </div>
            <Button onClick={handleExportPDF} className="gap-2 gradient-primary text-primary-foreground shadow-glow">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20 p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                +12%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Pendapatan</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-2">Semua waktu</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-primary text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                +8%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Bulan Ini</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(monthlyRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-2">{thisMonthTransactions.length} transaksi</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Jasa Antar</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(jasaAntarRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {transactions.filter(t => t.type === 'jasa_antar').length} pengantaran
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20 p-6 shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Ambil Unit</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(ambilUnitRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {transactions.filter(t => t.type === 'ambil_unit').length} rental
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                Pendapatan 7 Hari Terakhir
              </h2>
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-primary">{formatCurrency(weeklyData.reduce((sum, d) => sum + d.revenue, 0))}</span>
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-3">
              {weeklyData.map((data, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '100%', opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                  className="flex-1 flex flex-col items-center gap-3 group"
                >
                  <div className="w-full flex flex-col items-center flex-1 justify-end relative">
                    {data.revenue > 0 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="px-2 py-1 rounded-lg bg-foreground text-background text-xs font-bold whitespace-nowrap shadow-lg">
                          {formatCurrency(data.revenue)}
                        </div>
                      </div>
                    )}
                    <div
                      className={cn(
                        'w-full rounded-t-xl transition-all group-hover:scale-105 cursor-pointer',
                        data.revenue > 0 ? 'gradient-primary shadow-lg' : 'bg-muted'
                      )}
                      style={{ height: `${Math.max((data.revenue / maxRevenue) * 100, 4)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">{data.day}</p>
                    <p className="text-[10px] text-muted-foreground">{data.date}</p>
                    {data.count > 0 && (
                      <p className="text-[10px] text-primary font-medium mt-0.5">{data.count}x</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              Breakdown Pendapatan
            </h2>
            
            <div className="space-y-6">
              {monthlyBreakdown.map((item, index) => (
                <motion.div 
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', 
                        item.label === 'Jasa Antar' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                      )}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-foreground">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                      className={cn('h-full rounded-full', item.color)}
                    />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(item.value)}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-success/10 to-primary/10">
                <span className="font-bold text-foreground">Total Pendapatan</span>
                <span className="text-2xl font-bold text-success">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-card to-muted/20 rounded-xl border border-border p-6 shadow-md"
        >
          <h2 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            Ringkasan Statistik
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-all"
            >
              <p className="text-sm text-muted-foreground mb-2">Total Transaksi</p>
              <p className="text-3xl font-bold text-foreground mb-1">{transactions.length}</p>
              <p className="text-xs text-success flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                Semua waktu
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.75 }}
              className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-all"
            >
              <p className="text-sm text-muted-foreground mb-2">Jasa Antar</p>
              <p className="text-3xl font-bold text-foreground mb-1">
                {transactions.filter(t => t.type === 'jasa_antar').length}
              </p>
              <p className="text-xs text-blue-500 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Pengantaran
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-all"
            >
              <p className="text-sm text-muted-foreground mb-2">Ambil Unit</p>
              <p className="text-3xl font-bold text-foreground mb-1">
                {transactions.filter(t => t.type === 'ambil_unit').length}
              </p>
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <Gamepad2 className="w-3 h-3" />
                Rental
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85 }}
              className="p-5 rounded-xl bg-card border border-border hover:shadow-md transition-all"
            >
              <p className="text-sm text-muted-foreground mb-2">Rata-rata</p>
              <p className="text-xl font-bold text-foreground mb-1">
                {formatCurrency(transactions.length > 0 ? totalRevenue / transactions.length : 0)}
              </p>
              <p className="text-xs text-primary flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Per transaksi
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
