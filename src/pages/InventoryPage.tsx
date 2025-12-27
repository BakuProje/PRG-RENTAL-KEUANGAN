import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Minus, 
  History,
  Save,
  AlertTriangle,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function InventoryPage() {
  const { inventory, stockHistory, updateStock, user } = useApp();
  
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const isAdmin = user?.role === 'admin';
  const hasChanges = Object.keys(editedStock).length > 0;

  // Handle stock change
  const handleStockChange = (itemId: string, value: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    if (value === item.stock) {
      const newEdited = { ...editedStock };
      delete newEdited[itemId];
      setEditedStock(newEdited);
    } else {
      setEditedStock(prev => ({ ...prev, [itemId]: Math.max(0, value) }));
    }
  };

  // Handle reason change
  const handleReasonChange = (itemId: string, reason: string) => {
    setReasons(prev => ({ ...prev, [itemId]: reason }));
  };

  // Save changes
  const handleSave = async () => {
    if (!hasChanges) return;

    const itemsToUpdate = Object.entries(editedStock);
    const missingReasons = itemsToUpdate.filter(([id]) => !reasons[id]?.trim());

    if (missingReasons.length > 0) {
      toast.error('Semua perubahan stok harus memiliki alasan');
      return;
    }

    setIsSaving(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    itemsToUpdate.forEach(([id, newStock]) => {
      updateStock(id, newStock, reasons[id]);
    });

    setEditedStock({});
    setReasons({});
    setIsSaving(false);
    toast.success('Stok berhasil diperbarui!');
  };

  // Reset changes
  const handleReset = () => {
    setEditedStock({});
    setReasons({});
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ps3':
        return '🎮';
      case 'ps4':
        return '🎮';
      case 'tv_32':
        return '📺';
      case 'tv_40':
        return '📺';
      default:
        return '📦';
    }
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
              Kelola Inventory
            </h1>
            <p className="text-muted-foreground mt-1">
              Atur stok barang rental Anda
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              {showHistory ? 'Sembunyikan' : 'Lihat'} Riwayat
            </Button>
            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </motion.div>

        {/* Warning for non-admin */}
        {!isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-4"
          >
            <AlertTriangle className="w-6 h-6 text-warning" />
            <p className="text-sm text-foreground">
              Hanya admin yang dapat mengubah stok. Hubungi admin jika diperlukan.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory List */}
          <div className={cn('space-y-4', showHistory ? 'lg:col-span-2' : 'lg:col-span-3')}>
            {inventory.map((item, index) => {
              const currentValue = editedStock[item.id] ?? item.stock;
              const hasChanged = editedStock[item.id] !== undefined;
              const isLow = currentValue <= item.minStock;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'bg-card rounded-xl border p-6 shadow-md transition-all',
                    hasChanged ? 'border-primary shadow-glow' : 'border-border',
                    isLow && 'border-destructive/50'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Item Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {item.type.replace('_', ' ')}
                        </p>
                        {isLow && (
                          <span className="text-xs text-destructive font-medium">
                            ⚠️ Stok rendah (min: {item.minStock})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Controls */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStockChange(item.id, currentValue - 1)}
                        disabled={currentValue <= 0 || !isAdmin}
                        className="h-10 w-10"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>

                      <div className="relative">
                        <Input
                          type="number"
                          value={currentValue}
                          onChange={(e) => handleStockChange(item.id, parseInt(e.target.value) || 0)}
                          disabled={!isAdmin}
                          className={cn(
                            'w-20 text-center text-lg font-bold',
                            hasChanged && 'border-primary ring-2 ring-primary/20'
                          )}
                          min={0}
                        />
                        {hasChanged && (
                          <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                            •
                          </span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleStockChange(item.id, currentValue + 1)}
                        disabled={!isAdmin}
                        className="h-10 w-10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Reason Input */}
                  {hasChanged && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Alasan perubahan *
                      </label>
                      <Input
                        value={reasons[item.id] || ''}
                        onChange={(e) => handleReasonChange(item.id, e.target.value)}
                        placeholder="Contoh: Beli 2 unit baru, Unit rusak, dll."
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Perubahan: {item.stock} → {currentValue} ({currentValue > item.stock ? '+' : ''}{currentValue - item.stock})
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}

            {/* Save Button */}
            {hasChanges && isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 gradient-success text-secondary-foreground shadow-glow-success hover:shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Stock History */}
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-xl border border-border shadow-md"
            >
              <div className="p-5 border-b border-border">
                <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Riwayat Perubahan
                </h2>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {stockHistory.length > 0 ? (
                  <div className="divide-y divide-border">
                    {stockHistory.slice(0, 20).map((history) => {
                      const item = inventory.find(i => i.id === history.itemId);
                      const change = history.newStock - history.previousStock;
                      
                      return (
                        <div key={history.id} className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground text-sm">
                              {item?.name || 'Unknown'}
                            </span>
                            <span className={cn(
                              'text-sm font-bold',
                              change > 0 ? 'text-success' : 'text-destructive'
                            )}>
                              {change > 0 ? '+' : ''}{change}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {history.previousStock} → {history.newStock}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {history.reason}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatDate(history.changedAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Belum ada riwayat perubahan</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
