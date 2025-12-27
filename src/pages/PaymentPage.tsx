import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet,
  CreditCard,
  QrCode,
  ChevronRight,
  Copy,
  Check,
  X,
  Building2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'ewallet' | 'bank' | 'qris';
  logo: string;
  accountNumber?: string;
  accountName?: string;
  qrisImage?: string;
  color: string;
}

export default function PaymentPage() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'dana',
      name: 'DANA',
      type: 'ewallet',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/2560px-Logo_dana_blue.svg.png',
      accountNumber: '085331569338',
      accountName: 'MUHAMMAD FATRI SYEH',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'bri',
      name: 'Bank BRI',
      type: 'bank',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/BRI_2020.svg/2560px-BRI_2020.svg.png',
      accountNumber: '1234567890',
      accountName: 'MUHAMMAD FATRI SYEH',
      color: 'from-blue-600 to-blue-700',
    },
    {
      id: 'qris',
      name: 'QRIS',
      type: 'qris',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/QRIS_logo.svg/2560px-QRIS_logo.svg.png',
      qrisImage: '/PRG KUZU QRIS.png',
      color: 'from-red-500 to-red-600',
    },
  ];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Berhasil disalin!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openDetail = (payment: PaymentMethod) => {
    setSelectedPayment(payment);
  };

  const closeDetail = () => {
    setSelectedPayment(null);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            Metode Pembayaran
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">
            Pilih metode pembayaran yang tersedia
          </p>
        </motion.div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => openDetail(method)}
              className="group cursor-pointer"
            >
              <div className={cn(
                'relative overflow-hidden rounded-xl border border-border p-6',
                'bg-gradient-to-br hover:shadow-xl transition-all duration-300',
                'hover:scale-105 hover:border-primary/50',
                method.color
              )}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-xl p-2 mb-4 shadow-lg flex items-center justify-center">
                    <img 
                      src={method.logo} 
                      alt={method.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{method.name}</h3>
                  <p className="text-white/80 text-sm mb-4">
                    {method.type === 'ewallet' && 'E-Wallet'}
                    {method.type === 'bank' && 'Transfer Bank'}
                    {method.type === 'qris' && 'Scan QR Code'}
                  </p>
                  <div className="flex items-center gap-2 text-white font-medium">
                    <span className="text-sm">Lihat Detail</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-primary/5 to-success/5 rounded-xl border border-border p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">Informasi Pembayaran</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pastikan nominal transfer sesuai dengan tagihan</li>
                <li>• Simpan bukti transfer untuk konfirmasi</li>
                <li>• Pembayaran akan diverifikasi dalam 1x24 jam</li>
                <li>• Hubungi admin jika ada kendala pembayaran</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeDetail}
                className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className={cn(
                  'p-6 bg-gradient-to-br text-white relative overflow-hidden',
                  selectedPayment.color
                )}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <button
                    onClick={closeDetail}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 shadow-lg group"
                  >
                    <X className="w-5 h-5 text-foreground group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                  <div className="relative">
                    <div className="w-20 h-20 bg-white rounded-xl p-4 mb-4 shadow-lg">
                      <img 
                        src={selectedPayment.logo} 
                        alt={selectedPayment.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{selectedPayment.name}</h2>
                    <p className="text-white/80">
                      {selectedPayment.type === 'ewallet' && 'E-Wallet Payment'}
                      {selectedPayment.type === 'bank' && 'Bank Transfer'}
                      {selectedPayment.type === 'qris' && 'QR Code Payment'}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {selectedPayment.type === 'qris' ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                          Scan QR Code di bawah ini untuk melakukan pembayaran
                        </p>
                        <div className="bg-white p-2 rounded-xl inline-block shadow-lg">
                          <img 
                            src={selectedPayment.qrisImage} 
                            alt="QRIS Code"
                            className="w-full max-w-sm h-auto object-contain"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          Gunakan aplikasi e-wallet atau mobile banking untuk scan
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedPayment.accountNumber && (
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">
                              {selectedPayment.type === 'bank' ? 'Nomor Rekening' : 'Nomor'}
                            </p>
                            <button
                              onClick={() => copyToClipboard(selectedPayment.accountNumber!, 'number')}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              {copiedField === 'number' ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          <p className="text-xl font-bold text-foreground font-mono">
                            {selectedPayment.accountNumber}
                          </p>
                        </div>
                      )}

                      {selectedPayment.accountName && (
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">Nama Penerima</p>
                            <button
                              onClick={() => copyToClipboard(selectedPayment.accountName!, 'name')}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              {copiedField === 'name' ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          <p className="text-lg font-bold text-foreground">
                            {selectedPayment.accountName}
                          </p>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-2">Cara Pembayaran:</p>
                        <ol className="text-sm text-foreground space-y-1 list-decimal list-inside">
                          <li>Salin nomor {selectedPayment.type === 'bank' ? 'rekening' : 'akun'} di atas</li>
                          <li>Buka aplikasi {selectedPayment.name}</li>
                          <li>Lakukan transfer sesuai nominal tagihan</li>
                          <li>Simpan bukti transfer</li>
                          <li>Kirim bukti ke admin untuk konfirmasi</li>
                        </ol>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={closeDetail}
                    className="w-full gap-2 gradient-primary text-primary-foreground"
                  >
                    <Check className="w-4 h-4" />
                    Mengerti
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
