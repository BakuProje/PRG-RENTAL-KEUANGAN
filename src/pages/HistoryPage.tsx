import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Trash2,
  Truck,
  Gamepad2,
  Phone,
  Calendar,
  AlertTriangle,
  X,
  Loader2,
  Filter,
  Archive,
  ExternalLink,
  Eye,
  Plus,
  DollarSign,
  CheckCircle,
  IdCard,
  Clock,
  ArrowRight,
  Package,
  Share2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { RENTAL_PACKAGES, Transaction } from '@/types/rental';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type FilterType = 'all' | 'jasa_antar' | 'ambil_unit';
type ViewType = 'active' | 'completed' | 'deleted';

export default function HistoryPage() {
  const { transactions, deletedTransactions, completedTransactions, deleteTransaction, completeTransaction, endSession, extendRentalDays, extendRentalHours, user, addAdditionalPayment, updatePaymentStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewType, setViewType] = useState<ViewType>('active');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showExtendDaysModal, setShowExtendDaysModal] = useState(false);
  const [showExtendHoursModal, setShowExtendHoursModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePin, setDeletePin] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [extendDays, setExtendDays] = useState('1');
  const [extendHours, setExtendHours] = useState('1');
  const [partialAmount, setPartialAmount] = useState('');
  const [showPartialInput, setShowPartialInput] = useState(false);

  // Format number with thousand separator
  const formatNumberInput = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    // Add thousand separator
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse formatted number to integer
  const parseFormattedNumber = (value: string) => {
    return parseInt(value.replace(/\./g, '')) || 0;
  };

  const isAdmin = user?.role === 'admin';

  // Open Google Maps
  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const generateShareText = (tx: Transaction) => {
    let text = `*DETAIL ORDERAN PRG*\n`;
    text += `ID: ${tx.id.replace('TRX-', 'PRG-')}\n`;
    text += `Nama: ${tx.customerName}\n`;
    text += `Tipe: ${tx.customerType === 'langganan' ? 'Langganan' : 'Bukan Langganan'}\n`;
    if (tx.customerPhone) {
      text += `No. HP: ${tx.customerPhone}\n\n`;
    } else {
      text += `\n`;
    }

    text += `*INFO RENTAL*\n`;
    text += `Jenis: ${tx.type === 'jasa_antar' ? 'Jasa Antar' : 'Ambil Unit'}\n`;
    if (tx.package) {
      text += `Paket: ${RENTAL_PACKAGES[tx.package].name}\n`;
      text += `Durasi: ${tx.rentalDays} Hari ${tx.additionalHours > 0 ? `+ ${tx.additionalHours} Jam` : ''}\n`;
    }
    text += `Total: ${formatCurrency(tx.amount)}\n`;
    text += `Status: ${tx.paymentStatus === 'paid' ? 'LUNAS' : tx.paymentStatus === 'unpaid' ? 'BELUM BAYAR' : `BAYAR SEBAGIAN (${formatCurrency(tx.paidAmount || 0)})`}\n\n`;

    text += `*JADWAL*\n`;
    const formatDateTime = (date: Date | string) => {
      const d = new Date(date);
      const dateStr = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
      const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
      return `${dateStr} Jam: ${timeStr}`;
    };

    if (tx.deliveryTime) {
      text += `Antar: ${formatDateTime(tx.deliveryTime)}\n`;
    }
    if (tx.pickupTime) {
      text += `Ambil: ${formatDateTime(tx.pickupTime)}\n`;
    }
    text += `Maps: https://www.google.com/maps/search/?api=1&query=${tx.location.lat},${tx.location.lng}\n`;

    if (tx.notes) {
      text += `\n*Catatan*: ${tx.notes}\n`;
    }
    return text;
  };

  const handleShare = async (tx: Transaction) => {
    const text = generateShareText(tx);

    try {
      if (navigator.share) {
        let filesArray: File[] = [];
        if (tx.ktpPhoto) {
          try {
            const res = await fetch(tx.ktpPhoto);
            const blob = await res.blob();
            const file = new File([blob], `setup-ps-${tx.id}.jpg`, { type: 'image/jpeg' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              filesArray = [file];
            }
          } catch (e) {
            console.error('Error creating file for share:', e);
          }
        }

        await navigator.share({
          title: 'Detail Orderan PRG',
          text: text,
          ...(filesArray.length > 0 ? { files: filesArray } : {})
        });
        toast.success('Berhasil dibagikan');
      } else {
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Share failed", error);
      if (error instanceof Error && error.name !== 'AbortError') {
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      }
    }
  };

  // Filter transactions based on view type
  const getCurrentTransactions = () => {
    switch (viewType) {
      case 'active':
        return transactions;
      case 'completed':
        return completedTransactions;
      case 'deleted':
        return deletedTransactions;
      default:
        return transactions;
    }
  };

  // Filter transactions
  const filteredTransactions = getCurrentTransactions().filter(tx => {
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
    setDeletePin('');
  };

  // Handle PIN input
  const handlePinInput = (digit: string) => {
    if (deletePin.length < 6) {
      setDeletePin(deletePin + digit);
    }
  };

  // Handle PIN backspace
  const handlePinBackspace = () => {
    setDeletePin(deletePin.slice(0, -1));
  };

  // Handle PIN clear
  const handlePinClear = () => {
    setDeletePin('');
  };

  // Open detail modal
  const openDetailModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDetailModal(true);
  };

  // Open add payment modal
  const openAddPaymentModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowAddPaymentModal(true);
    setAdditionalAmount('');
    setAdditionalNote('');
  };

  // Handle add payment
  const handleAddPayment = async () => {
    if (!selectedTransaction) return;

    const amount = parseFormattedNumber(additionalAmount);
    if (!amount || amount <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }

    if (!additionalNote.trim()) {
      toast.error('Masukkan keterangan');
      return;
    }

    setIsAddingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    addAdditionalPayment(selectedTransaction.id, amount, additionalNote.trim());
    toast.success(`Berhasil menambahkan ${formatCurrency(amount)}`);

    setShowAddPaymentModal(false);
    setIsAddingPayment(false);
  };

  // Handle end session
  const openEndSessionModal = (tx: Transaction) => {
    if (tx.sessionEnded) {
      toast.error('Sesi sudah berakhir');
      return;
    }
    setSelectedTransaction(tx);
    setShowEndSessionModal(true);
  };

  const handleEndSession = async () => {
    if (!selectedTransaction) return;

    setIsEndingSession(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    endSession(selectedTransaction.id);
    toast.success('Sesi berakhir! Inventory telah dikembalikan.');

    setShowEndSessionModal(false);
    setIsEndingSession(false);
    setSelectedTransaction(null);
  };

  // Handle extend days
  const openExtendDaysModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setExtendDays('1');
    setShowExtendDaysModal(true);
  };

  const handleExtendDays = () => {
    if (!selectedTransaction) return;
    const days = parseInt(extendDays);
    if (days <= 0) {
      toast.error('Jumlah hari harus lebih dari 0');
      return;
    }

    extendRentalDays(selectedTransaction.id, days);
    toast.success(`Rental diperpanjang ${days} hari`);
    setShowExtendDaysModal(false);
    setSelectedTransaction(null);
  };

  // Handle extend hours
  const openExtendHoursModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setExtendHours('1');
    setShowExtendHoursModal(true);
  };

  const handleExtendHours = () => {
    if (!selectedTransaction) return;
    const hours = parseInt(extendHours);
    if (hours <= 0) {
      toast.error('Jumlah jam harus lebih dari 0');
      return;
    }

    extendRentalHours(selectedTransaction.id, hours);
    toast.success(`Rental diperpanjang ${hours} jam`);
    setShowExtendHoursModal(false);
    setSelectedTransaction(null);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTransaction) return;

    if (!deleteReason.trim()) {
      toast.error('Alasan penghapusan harus diisi');
      return;
    }

    if (deletePin !== '112233') {
      toast.error('PIN salah');
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

  // Handle complete transaction (move to completed list)
  const handleCompleteTransaction = (tx: Transaction) => {
    if (!tx.sessionEnded) {
      toast.error('Rental harus diakhiri terlebih dahulu');
      return;
    }

    completeTransaction(tx.id);
    toast.success('Transaksi berhasil dipindahkan ke List Rental Selesai');
  };

  // Open payment status modal
  const openPaymentStatusModal = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setPartialAmount('');
    setShowPartialInput(false);
    setShowPaymentStatusModal(true);
  };

  // Handle update payment status
  const handleUpdatePaymentStatus = (status: 'paid' | 'unpaid' | 'partial') => {
    if (!selectedTransaction) return;

    if (status === 'partial') {
      const amount = parseFormattedNumber(partialAmount);
      if (!amount || amount <= 0) {
        toast.error('Masukkan jumlah yang valid');
        return;
      }
      // Tidak ada batasan maksimal - bisa lebih dari total tagihan
      updatePaymentStatus(selectedTransaction.id, status, amount);
      toast.success(`Status diubah: Bayar Sebagian (${formatCurrency(amount)})`);
    } else {
      updatePaymentStatus(selectedTransaction.id, status);
      toast.success(`Status diubah: ${status === 'paid' ? 'Sudah Bayar' : 'Belum Bayar'}`);
    }

    setShowPaymentStatusModal(false);
    setShowPartialInput(false);
    setSelectedTransaction(null);
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
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Riwayat Pengantaran
            </h1>
            <p className="text-muted-foreground mt-1">
              {viewType === 'active' && `${transactions.length} pengantaran aktif`}
              {viewType === 'completed' && `${completedTransactions.length} rental selesai`}
              {viewType === 'deleted' && `${deletedTransactions.length} transaksi dihapus`}
            </p>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2">
            <Button
              variant={viewType === 'active' ? 'default' : 'outline'}
              onClick={() => setViewType('active')}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              Aktif ({transactions.length})
            </Button>
            <Button
              variant={viewType === 'completed' ? 'default' : 'outline'}
              onClick={() => setViewType('completed')}
              className="gap-2"
            >
              <Package className="w-4 h-4" />
              Selesai ({completedTransactions.length})
            </Button>
            <Button
              variant={viewType === 'deleted' ? 'default' : 'outline'}
              onClick={() => setViewType('deleted')}
              className="gap-2"
            >
              <Archive className="w-4 h-4" />
              Arsip ({deletedTransactions.length})
            </Button>
          </div>
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
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow",
                  viewType === 'deleted' && "opacity-60",
                  viewType === 'completed' && "bg-success/5 border-success/20"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    viewType === 'deleted' && 'bg-muted text-muted-foreground',
                    viewType === 'completed' && 'bg-success/10 text-success',
                    viewType === 'active' && (tx.type === 'jasa_antar'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-success/10 text-success')
                  )}>
                    {tx.type === 'jasa_antar' ? (
                      <Truck className="w-6 h-6" />
                    ) : (
                      <Gamepad2 className="w-6 h-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-foreground">{tx.customerName}</p>
                          {viewType === 'active' && tx.sessionEnded && (
                            <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold whitespace-nowrap">
                              Rental PS Selesai
                            </span>
                          )}
                          {viewType === 'active' && tx.paymentStatus === 'paid' && (
                            <span className="px-2 py-0.5 rounded bg-success text-success-foreground text-xs font-bold whitespace-nowrap">
                              ✓ Sudah Bayar
                            </span>
                          )}
                          {viewType === 'active' && tx.paymentStatus === 'unpaid' && (
                            <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold whitespace-nowrap">
                              Belum Bayar
                            </span>
                          )}
                          {viewType === 'active' && tx.paymentStatus === 'partial' && (
                            <span className="px-2 py-0.5 rounded bg-warning text-warning-foreground text-xs font-bold whitespace-nowrap">
                              Bayar Sebagian ({formatCurrency(tx.paidAmount || 0)})
                            </span>
                          )}
                          {viewType === 'completed' && (
                            <span className="px-2 py-0.5 rounded bg-success text-success-foreground text-xs font-bold whitespace-nowrap">
                              Selesai
                            </span>
                          )}
                          {viewType === 'deleted' && (
                            <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold whitespace-nowrap">
                              Dihapus
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs text-muted-foreground",
                          viewType === 'deleted' && "line-through"
                        )}>
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
                        <p className="text-lg font-bold text-success">
                          {formatCurrency(tx.amount)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {tx.id}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {tx.customerPhone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(tx.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Additional Info for Deleted/Completed */}
                    {viewType === 'deleted' && (
                      <div className="mb-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">
                          Alasan: {(tx as any).deleteReason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dihapus: {formatDate((tx as any).deletedAt)}
                        </p>
                      </div>
                    )}

                    {viewType === 'completed' && (
                      <div className="mb-2 p-2 rounded bg-success/10 border border-success/20">
                        <p className="text-xs text-success font-medium">
                          ✓ Rental selesai pada: {formatDate((tx as any).completedAt)}
                        </p>
                      </div>
                    )}

                    {/* Rental Duration Info - Only for active transactions */}
                    {viewType === 'active' && tx.package && !tx.sessionEnded && (
                      <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-0.5">Pengambilan:</p>
                            <p className="font-bold text-primary">
                              {new Date(tx.pickupTime).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })} WITA
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                              {new Date(tx.pickupTime).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-0.5">Notifikasi:</p>
                            <p className="font-bold text-warning">
                              {new Date(new Date(tx.pickupTime).getTime() - 30 * 60 * 1000).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })} WITA
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                              30 menit sebelum
                            </p>
                          </div>
                        </div>
                        {(tx.rentalDays > 1 || tx.additionalHours > 0) && (
                          <div className="mt-2 pt-2 border-t border-primary/20">
                            <p className="text-[10px] text-primary font-medium">
                              Durasi: {tx.rentalDays} hari
                              {tx.additionalHours > 0 && ` + ${tx.additionalHours} jam`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(tx)}
                        className="gap-1 h-8 text-xs"
                      >
                        <Eye className="w-3 h-3" />
                        Detail
                      </Button>

                      {viewType !== 'deleted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openGoogleMaps(tx.location.lat, tx.location.lng)}
                          className="gap-1 h-8 text-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Maps
                        </Button>
                      )}

                      {/* Active Transaction Actions */}
                      {viewType === 'active' && isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentStatusModal(tx)}
                            className={cn(
                              "gap-1 h-8 text-xs",
                              tx.paymentStatus === 'paid' && "text-success hover:bg-success/10 hover:text-success hover:border-success",
                              tx.paymentStatus === 'unpaid' && "text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive",
                              tx.paymentStatus === 'partial' && "text-warning hover:bg-warning/10 hover:text-warning hover:border-warning"
                            )}
                          >
                            <DollarSign className="w-3 h-3" />
                            {tx.paymentStatus === 'paid' ? 'Bayar' : tx.paymentStatus === 'unpaid' ? 'Bayar' : 'Bayar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddPaymentModal(tx)}
                            className="gap-1 h-8 text-xs text-success hover:bg-success/10 hover:text-success hover:border-success"
                          >
                            <Plus className="w-3 h-3" />
                            Tambah
                          </Button>
                          {tx.package && !tx.sessionEnded && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openExtendDaysModal(tx)}
                                className="gap-1 h-8 text-xs text-primary hover:bg-primary/10 hover:text-primary hover:border-primary"
                              >
                                <Calendar className="w-3 h-3" />
                                +Hari
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openExtendHoursModal(tx)}
                                className="gap-1 h-8 text-xs text-primary hover:bg-primary/10 hover:text-primary hover:border-primary"
                              >
                                <Clock className="w-3 h-3" />
                                +Jam
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEndSessionModal(tx)}
                                className="gap-1 h-8 text-xs text-warning hover:bg-warning/10 hover:text-warning hover:border-warning"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Akhiri
                              </Button>
                            </>
                          )}

                          {/* Move to Completed Button - Only show for ended sessions */}
                          {tx.sessionEnded && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteTransaction(tx)}
                              className="gap-1 h-8 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Pindahkan
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(tx)}
                            className="gap-1 h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              {viewType === 'active' && <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />}
              {viewType === 'completed' && <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />}
              {viewType === 'deleted' && <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />}
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Tidak ada transaksi yang cocok'
                  : viewType === 'active'
                    ? 'Belum ada transaksi aktif'
                    : viewType === 'completed'
                      ? 'Belum ada rental yang selesai'
                      : 'Tidak ada transaksi yang diarsipkan'}
              </p>
            </div>
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
                      PIN Admin *
                    </label>
                    <div className="space-y-3">
                      {/* PIN Display */}
                      <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/50 border border-border">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <div
                            key={index}
                            className={cn(
                              'w-3 h-3 rounded-full transition-all',
                              deletePin.length > index ? 'bg-primary scale-110' : 'bg-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>

                      {/* Number Keyboard */}
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePinInput(num.toString())}
                            disabled={deletePin.length >= 6}
                            className="p-4 rounded-lg bg-muted hover:bg-muted/80 font-bold text-lg text-foreground transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handlePinClear}
                          className="p-4 rounded-lg bg-destructive/10 hover:bg-destructive/20 font-medium text-sm text-destructive transition-all"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePinInput('0')}
                          disabled={deletePin.length >= 6}
                          className="p-4 rounded-lg bg-muted hover:bg-muted/80 font-bold text-lg text-foreground transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={handlePinBackspace}
                          className="p-4 rounded-lg bg-muted hover:bg-muted/80 font-medium text-sm text-foreground transition-all"
                        >
                          ← Del
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      PIN: 112233 (demo)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting || !deleteReason.trim() || deletePin.length !== 6}
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

        {/* End Session Modal */}
        <AnimatePresence>
          {showEndSessionModal && selectedTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isEndingSession && setShowEndSessionModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border-2 border-slate-700 p-8 mx-4"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/50">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Akhiri sesi rental untuk {selectedTransaction.customerName}?
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Inventory akan dikembalikan tanpa mengubah pendapatan.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleEndSession}
                    disabled={isEndingSession}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white border-2 border-teal-400/50 shadow-lg shadow-teal-500/30 rounded-xl transition-all"
                  >
                    {isEndingSession ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Memproses...
                      </>
                    ) : (
                      'Oke'
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowEndSessionModal(false)}
                    disabled={isEndingSession}
                    className="flex-1 h-12 text-base font-semibold bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 rounded-xl transition-all"
                  >
                    Batal
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Extend Days Modal */}
        <AnimatePresence>
          {showExtendDaysModal && selectedTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExtendDaysModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-gradient-to-br from-blue-800 to-blue-900 rounded-2xl shadow-2xl border-2 border-blue-700 p-8 mx-4"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Tambah Hari Rental
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {selectedTransaction.customerName}
                  </p>

                  <div className="bg-white/10 rounded-lg p-4 mb-4">
                    <p className="text-xs text-slate-300 mb-2">Pengambilan Saat Ini:</p>
                    <p className="text-lg font-bold text-white">
                      {new Date(selectedTransaction.pickupTime).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WITA
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm text-slate-300 block text-left">
                      Berapa hari ingin ditambahkan?
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={extendDays}
                      onChange={(e) => setExtendDays(e.target.value)}
                      className="text-center text-2xl font-bold h-16 bg-white/10 border-white/30 text-white"
                      placeholder="1"
                    />
                    <p className="text-xs text-slate-300">
                      Pengambilan baru: {new Date(new Date(selectedTransaction.pickupTime).getTime() + parseInt(extendDays || '0') * 24 * 60 * 60 * 1000).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WITA
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleExtendDays}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-2 border-blue-400/50 shadow-lg shadow-blue-500/30 rounded-xl transition-all"
                  >
                    Tambah {extendDays} Hari
                  </Button>
                  <Button
                    onClick={() => setShowExtendDaysModal(false)}
                    className="flex-1 h-12 text-base font-semibold bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 rounded-xl transition-all"
                  >
                    Batal
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Extend Hours Modal */}
        <AnimatePresence>
          {showExtendHoursModal && selectedTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExtendHoursModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-gradient-to-br from-purple-800 to-purple-900 rounded-2xl shadow-2xl border-2 border-purple-700 p-8 mx-4"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                    <Clock className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Tambah Jam Rental
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    {selectedTransaction.customerName}
                  </p>

                  <div className="bg-white/10 rounded-lg p-4 mb-4">
                    <p className="text-xs text-slate-300 mb-2">Pengambilan Saat Ini:</p>
                    <p className="text-lg font-bold text-white">
                      {new Date(selectedTransaction.pickupTime).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WITA
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm text-slate-300 block text-left">
                      Berapa jam ingin ditambahkan?
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={extendHours}
                      onChange={(e) => setExtendHours(e.target.value)}
                      className="text-center text-2xl font-bold h-16 bg-white/10 border-white/30 text-white"
                      placeholder="1"
                    />
                    <p className="text-xs text-slate-300">
                      Pengambilan baru: {new Date(new Date(selectedTransaction.pickupTime).getTime() + parseInt(extendHours || '0') * 60 * 60 * 1000).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} WITA
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleExtendHours}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-2 border-purple-400/50 shadow-lg shadow-purple-500/30 rounded-xl transition-all"
                  >
                    Tambah {extendHours} Jam
                  </Button>
                  <Button
                    onClick={() => setShowExtendHoursModal(false)}
                    className="flex-1 h-12 text-base font-semibold bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-600 rounded-xl transition-all"
                  >
                    Batal
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDetailModal(false)}
                className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg bg-card rounded-xl shadow-xl border border-border p-6 mx-4 max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </button>

                <h2 className="text-xl font-bold text-foreground mb-6">Detail Transaksi</h2>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">ID Transaksi</p>
                    <p className="font-bold text-foreground">{selectedTransaction.id}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Nama Pelanggan</p>
                    <p className="font-bold text-foreground">{selectedTransaction.customerName}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Nomor Telepon</p>
                    <p className="font-bold text-foreground">{selectedTransaction.customerPhone}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Tipe Pelanggan</p>
                    <div className="flex items-center gap-2">
                      {selectedTransaction.customerType === 'langganan' ? (
                        <span className="px-3 py-1 rounded-full bg-success/10 text-success border border-success/30 text-sm font-medium">
                          Langganan
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-warning/10 text-warning border border-warning/30 text-sm font-medium">
                          Bukan Langganan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">Status Pembayaran</p>
                    <div className="flex items-center gap-2">
                      {selectedTransaction.paymentStatus === 'paid' && (
                        <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/30 text-sm font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Sudah Bayar
                        </span>
                      )}
                      {selectedTransaction.paymentStatus === 'unpaid' && (
                        <span className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 text-sm font-bold flex items-center gap-2">
                          <X className="w-4 h-4" />
                          Belum Bayar
                        </span>
                      )}
                      {selectedTransaction.paymentStatus === 'partial' && (
                        <div>
                          <span className="px-3 py-1.5 rounded-lg bg-warning/10 text-warning border border-warning/30 text-sm font-bold flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Bayar Sebagian
                          </span>
                          <p className="text-xs text-muted-foreground mt-2">
                            Sudah dibayar: <span className="font-bold text-warning">{formatCurrency(selectedTransaction.paidAmount || 0)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sisa: <span className="font-bold text-destructive">{formatCurrency(selectedTransaction.amount - (selectedTransaction.paidAmount || 0))}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedTransaction.ktpPhoto && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <IdCard className="w-4 h-4" />
                        Foto Setup PS
                      </p>
                      <img
                        src={selectedTransaction.ktpPhoto}
                        alt="Setup PS"
                        className="w-full rounded-lg border-2 border-border cursor-pointer hover:border-primary transition-colors"
                        onClick={() => window.open(selectedTransaction.ktpPhoto, '_blank')}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Klik untuk memperbesar
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Jenis Transaksi</p>
                    <p className="font-bold text-foreground">
                      {selectedTransaction.type === 'jasa_antar'
                        ? selectedTransaction.package
                          ? `Jasa Antar - ${RENTAL_PACKAGES[selectedTransaction.package].name}`
                          : 'Jasa Antar'
                        : selectedTransaction.package
                          ? RENTAL_PACKAGES[selectedTransaction.package].name
                          : 'Ambil Unit'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Tanggal & Waktu</p>
                    <p className="font-bold text-foreground">{formatDate(selectedTransaction.date)}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Lokasi</p>
                    <p className="font-medium text-foreground">{selectedTransaction.location.address}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGoogleMaps(selectedTransaction.location.lat, selectedTransaction.location.lng)}
                      className="gap-1 mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Buka di Maps
                    </Button>
                  </div>

                  {/* Rental Schedule Info */}
                  {selectedTransaction.package && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-success/10 border border-primary/30">
                      <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Jadwal Rental
                      </p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pengantaran:</p>
                          <p className="font-bold text-foreground">
                            {new Date(selectedTransaction.deliveryTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })} WITA
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedTransaction.deliveryTime).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pengambilan:</p>
                          <p className="font-bold text-primary">
                            {new Date(selectedTransaction.pickupTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })} WITA
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedTransaction.pickupTime).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1">Notifikasi 30 menit sebelum:</p>
                        <p className="font-bold text-warning">
                          {new Date(new Date(selectedTransaction.pickupTime).getTime() - 30 * 60 * 1000).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })} WITA
                        </p>
                      </div>
                      {(selectedTransaction.rentalDays > 1 || selectedTransaction.additionalHours > 0) && (
                        <div className="mt-3 pt-3 border-t border-primary/20">
                          <p className="text-sm font-bold text-primary">
                            Durasi: {selectedTransaction.rentalDays} hari
                            {selectedTransaction.additionalHours > 0 && ` + ${selectedTransaction.additionalHours} jam`}
                          </p>
                        </div>
                      )}
                      {selectedTransaction.sessionEnded && (
                        <div className="mt-3 pt-3 border-t border-destructive/20">
                          <p className="text-sm font-bold text-destructive">
                            ✓ Sesi Sudah Berakhir
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTransaction.notes && (
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Catatan</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTransaction.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={() => handleShare(selectedTransaction)}
                    className="flex-1 gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white"
                  >
                    <Share2 className="w-4 h-4" />
                    Bagikan
                  </Button>
                  {isAdmin && (
                    <Button
                      onClick={() => {
                        setShowDetailModal(false);
                        openAddPaymentModal(selectedTransaction);
                      }}
                      className="flex-1 gap-2 gradient-success text-secondary-foreground"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Uang
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Payment Modal */}
        <AnimatePresence>
          {showAddPaymentModal && selectedTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddPaymentModal(false)}
                className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-card rounded-xl shadow-xl border border-border p-6 mx-4"
              >
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Tambah Uang</h2>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.id}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Saat Ini</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedTransaction.amount)}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Jumlah Tambahan *
                    </label>
                    <Input
                      type="text"
                      value={additionalAmount}
                      onChange={(e) => setAdditionalAmount(formatNumberInput(e.target.value))}
                      placeholder="Contoh: 25.000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format otomatis dengan pemisah ribuan
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Keterangan *
                    </label>
                    <Input
                      value={additionalNote}
                      onChange={(e) => setAdditionalNote(e.target.value)}
                      placeholder="Contoh: Biaya tambahan hari ke-2"
                    />
                  </div>

                  {additionalAmount && parseFormattedNumber(additionalAmount) > 0 && (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-sm text-muted-foreground mb-1">Total Setelah Ditambah</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(selectedTransaction.amount + parseFormattedNumber(additionalAmount))}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="flex-1"
                    disabled={isAddingPayment}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleAddPayment}
                    disabled={isAddingPayment || !additionalAmount || !additionalNote.trim()}
                    className="flex-1 gap-2 gradient-success text-secondary-foreground"
                  >
                    {isAddingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Tambah
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Payment Status Modal */}
        <AnimatePresence>
          {showPaymentStatusModal && selectedTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPaymentStatusModal(false)}
                className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-card rounded-xl shadow-xl border border-border p-6 mx-4"
              >
                <button
                  onClick={() => setShowPaymentStatusModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Status Pembayaran</h2>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.customerName}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Tagihan</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(selectedTransaction.amount)}</p>
                  {selectedTransaction.paymentStatus === 'partial' && selectedTransaction.paidAmount && (
                    <p className="text-sm text-warning mt-2">
                      Sudah dibayar: {formatCurrency(selectedTransaction.paidAmount)}
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleUpdatePaymentStatus('paid');
                      setShowPartialInput(false);
                    }}
                    className={cn(
                      "w-full h-14 justify-start gap-3 text-left",
                      selectedTransaction.paymentStatus === 'paid' && "border-success bg-success/10"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Sudah Bayar</p>
                      <p className="text-xs text-muted-foreground">Pembayaran lunas</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      handleUpdatePaymentStatus('unpaid');
                      setShowPartialInput(false);
                    }}
                    className={cn(
                      "w-full h-14 justify-start gap-3 text-left",
                      selectedTransaction.paymentStatus === 'unpaid' && "border-destructive bg-destructive/10"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <X className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Belum Bayar</p>
                      <p className="text-xs text-muted-foreground">Belum ada pembayaran</p>
                    </div>
                  </Button>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowPartialInput(!showPartialInput)}
                      className={cn(
                        "w-full h-14 justify-start gap-3 text-left",
                        selectedTransaction.paymentStatus === 'partial' && "border-warning bg-warning/10",
                        showPartialInput && "border-warning bg-warning/5"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">Bayar Sebagian</p>
                        <p className="text-xs text-muted-foreground">
                          {showPartialInput ? 'Masukkan jumlah di bawah' : 'Bayar DP atau cicilan'}
                        </p>
                      </div>
                    </Button>

                    <AnimatePresence>
                      {showPartialInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 pt-2"
                        >
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">
                              Jumlah yang sudah dibayar
                            </label>
                            <Input
                              type="text"
                              value={partialAmount}
                              onChange={(e) => setPartialAmount(formatNumberInput(e.target.value))}
                              placeholder="Contoh: 10.000"
                              className="text-sm"
                              autoFocus
                            />
                          </div>

                          {partialAmount && parseFormattedNumber(partialAmount) > 0 && (
                            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                              <p className="text-xs text-muted-foreground mb-1">Jumlah yang dibayar:</p>
                              <p className="text-lg font-bold text-warning">
                                {formatCurrency(parseFormattedNumber(partialAmount))}
                              </p>
                              {parseFormattedNumber(partialAmount) < selectedTransaction.amount && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Sisa: {formatCurrency(selectedTransaction.amount - parseFormattedNumber(partialAmount))}
                                </p>
                              )}
                              {parseFormattedNumber(partialAmount) >= selectedTransaction.amount && (
                                <p className="text-xs text-success mt-1 font-medium">
                                  ✓ Lebih dari total tagihan
                                </p>
                              )}
                            </div>
                          )}

                          <Button
                            onClick={() => handleUpdatePaymentStatus('partial')}
                            disabled={!partialAmount || parseFormattedNumber(partialAmount) <= 0}
                            className="w-full gap-2 bg-warning hover:bg-warning/90 text-warning-foreground"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Update Status
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowPaymentStatusModal(false)}
                  className="w-full"
                >
                  Tutup
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
