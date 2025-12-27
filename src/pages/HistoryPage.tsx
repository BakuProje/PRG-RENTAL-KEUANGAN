import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Search, 
  Trash2, 
  Truck, 
  Gamepad2,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  X,
  Loader2,
  Filter,
  Archive,
  ExternalLink
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { RENTAL_PACKAGES, Transaction } from '@/types/rental';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type FilterType = 'all' | 'jasa_antar' | 'ambil_unit';

export default function HistoryPage() {
  const { transactions, deletedTransactions, deleteTransaction, user } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Open Google Maps
  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.customerPhone.includes(searchQuery) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || tx.type === filterType;

    return matchesSearch && matchesFilter;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Open delete modal
  const openDeleteModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDeleteModal(true);
    setDeleteReason('');
    setDeletePassword('');
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTransaction) return;
    
    if (!deleteReason.trim()) {
      toast.error('Alasan penghapusan harus diisi');
      return;
    }

    if (deletePassword !== 'admin123') {
      toast.error('Password salah');
      return;
    }

    setIsDeleting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    deleteTransaction(selectedTransaction.id, deleteReason);
    
    setIsDeleting(false);
    setShowDeleteModal(false);
    setSelectedTransaction(null);
    toast.success('Transaksi berhasil dihapus dan dipindahkan ke arsip');
  };

  const deleteReasons = [
    'Transaksi dibatalkan pelanggan',
    'Kesalahan input data',
    'Pembayaran gagal',
    'Unit rusak/tidak tersedia',
    'Alasan lainnya',
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Riwayat Pengantaran
            </h1>
            <p className="text-muted-foreground mt-1">
              {transactions.length} pengantaran aktif
            </p>
          </div>
          <Button
            variant={showArchive ? 'default' : 'outline'}
            onClick={() => setShowArchive(!showArchive)}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            {showArchive ? 'Lihat Aktif' : 'Lihat Arsip'} ({deletedTransactions.length})
          </Button>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, telepon, atau ID transaksi..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'jasa_antar', 'ambil_unit'] as FilterType[]).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
                className={cn(
                  'gap-2',
                  filterType === type && 'gradient-primary text-primary-foreground'
                )}
              >
                {type === 'all' && <Filter className="w-4 h-4" />}
                {type === 'jasa_antar' && <Truck className="w-4 h-4" />}
                {type === 'ambil_unit' && <Gamepad2 className="w-4 h-4" />}
                {type === 'all' ? 'Semua' : type === 'jasa_antar' ? 'Jasa Antar' : 'Ambil Unit'}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Transaction List */}
        <div className="space-y-4">
          {showArchive ? (
            deletedTransactions.length > 0 ? (
              deletedTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 shadow-md opacity-60"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      'bg-muted text-muted-foreground'
                    )}>
                      {tx.type === 'jasa_antar' ? (
                        <Truck className="w-6 h-6" />
                      ) : (
                        <Gamepad2 className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-foreground">{tx.customerName}</p>
                          <p className="text-sm text-muted-foreground line-through">
                            {tx.type === 'jasa_antar' 
                              ? tx.package 
                                ? `Jasa Antar - ${RENTAL_PACKAGES[tx.package].name}`
                                : 'Jasa Antar'
                              : tx.package 
                                ? RENTAL_PACKAGES[tx.package].name 
                                : 'Ambil Unit'}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                          Dihapus
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Alasan: {tx.deleteReason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dihapus: {formatDate(tx.deletedAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Tidak ada transaksi yang diarsipkan</p>
              </div>
            )
          ) : (
            filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                        tx.type === 'jasa_antar' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-success/10 text-success'
                      )}>
                        {tx.type === 'jasa_antar' ? (
                          <Truck className="w-7 h-7" />
                        ) : (
                          <Gamepad2 className="w-7 h-7" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-bold text-lg text-foreground">{tx.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {tx.type === 'jasa_antar' 
                                ? tx.package 
                                  ? `Jasa Antar - ${RENTAL_PACKAGES[tx.package].name}`
                                  : 'Jasa Antar'
                                : tx.package 
                                  ? RENTAL_PACKAGES[tx.package].name 
                                  : 'Ambil Unit'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-success">
                              {formatCurrency(tx.amount)}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {tx.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-[72px]">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{tx.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDate(tx.date)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground sm:col-span-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">{tx.location.address}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-[72px] pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGoogleMaps(tx.location.lat, tx.location.lng)}
                        className="gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Buka Maps
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(tx)}
                          className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Tidak ada transaksi yang cocok' 
                    : 'Belum ada transaksi'}
                </p>
              </div>
            )
          )}
        </div>

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteModal(false)}
                className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-card rounded-xl shadow-xl border border-border p-6 mx-4 max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Hapus Transaksi?</h2>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.id}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 mb-6">
                  <p className="font-medium text-foreground">{selectedTransaction.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedTransaction.amount)} • {formatDate(selectedTransaction.date)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Alasan Penghapusan *
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {deleteReasons.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setDeleteReason(reason)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                            deleteReason === reason
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <Input
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Atau tulis alasan lain..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Password Admin *
                    </label>
                    <Input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Masukkan password untuk konfirmasi"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Password: admin123 (demo)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting || !deleteReason.trim() || !deletePassword}
                    className="w-full gap-2 gradient-danger text-destructive-foreground"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menghapus...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Hapus Transaksi
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full"
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
