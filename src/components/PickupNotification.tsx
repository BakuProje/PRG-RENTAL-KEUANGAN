import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, MapPin } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/rental';

export const PickupNotification = () => {
  const { transactions, markNotificationShown } = useApp();
  const [upcomingPickups, setUpcomingPickups] = useState<Transaction[]>([]);

  useEffect(() => {
    const checkUpcomingPickups = () => {
      const now = new Date();
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

      const upcoming = transactions.filter((tx) => {
        if (tx.sessionEnded || tx.notificationShown) return false;
        
        const pickupTime = new Date(tx.pickupTime);
        // Check if pickup is within next 30 minutes
        return pickupTime <= thirtyMinutesLater && pickupTime > now;
      });

      setUpcomingPickups(upcoming);
    };

    // Check immediately
    checkUpcomingPickups();

    // Check every minute
    const interval = setInterval(checkUpcomingPickups, 60 * 1000);

    return () => clearInterval(interval);
  }, [transactions]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMinutesUntil = (date: Date) => {
    const now = new Date();
    const diff = new Date(date).getTime() - now.getTime();
    return Math.floor(diff / (60 * 1000));
  };

  const handleDismiss = (id: string) => {
    markNotificationShown(id);
    setUpcomingPickups((prev) => prev.filter((tx) => tx.id !== id));
  };

  if (upcomingPickups.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {upcomingPickups.map((tx) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl shadow-2xl p-4 border-2 border-orange-300"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">Waktu Pengambilan!</h3>
                <p className="text-sm opacity-90 mb-2">
                  <strong>{tx.customerName}</strong> akan diambil dalam{' '}
                  <strong>{getMinutesUntil(tx.pickupTime)} menit</strong>
                </p>
                <div className="flex items-center gap-2 text-xs opacity-80 mb-2">
                  <Clock className="w-3 h-3" />
                  <span>Jam: {formatTime(tx.pickupTime)}</span>
                </div>
                <div className="flex items-start gap-2 text-xs opacity-80">
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{tx.location.address}</span>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(tx.id)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
