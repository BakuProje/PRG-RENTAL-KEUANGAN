import { useState, useEffect } from 'react';
import { ModernNotification } from './ModernNotification';
import { useApp } from '@/contexts/AppContext';

interface Notification {
  id: string;
  type: 'savings' | 'pickup' | 'info' | 'warning';
  title: string;
  message: string;
  onAction?: () => void;
  actionText?: string;
  autoClose?: number;
}

export function NotificationManager() {
  const { transactions, shouldShowSavingsReminder } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check for pickup reminders
  useEffect(() => {
    const checkPickupReminders = () => {
      const now = new Date();
      const upcomingPickups = transactions.filter(tx => {
        if (tx.sessionEnded || tx.notificationShown) return false;
        
        const pickupTime = new Date(tx.pickupTime);
        const reminderTime = new Date(pickupTime.getTime() - 30 * 60 * 1000); // 30 minutes before
        
        return now >= reminderTime && now < pickupTime;
      });

      upcomingPickups.forEach(tx => {
        const existingNotification = notifications.find(n => n.id === `pickup-${tx.id}`);
        if (!existingNotification) {
          addNotification({
            id: `pickup-${tx.id}`,
            type: 'pickup',
            title: '⏰ Waktu Pengambilan Segera!',
            message: `${tx.customerName} - Pengambilan dalam 30 menit di ${tx.location.address}`,
            actionText: 'Lihat Detail',
            onAction: () => {
              // Navigate to history or show details
              window.location.href = '/history';
            },
            autoClose: 0, // Don't auto-close pickup reminders
          });
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkPickupReminders, 60000);
    checkPickupReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [transactions, notifications]);

  // Check for savings reminder (once per day)
  useEffect(() => {
    const checkSavingsReminder = () => {
      if (shouldShowSavingsReminder()) {
        const existingNotification = notifications.find(n => n.id === 'savings-reminder');
        if (!existingNotification) {
          // Show reminder after a delay to not overwhelm user
          setTimeout(() => {
            addNotification({
              id: 'savings-reminder',
              type: 'savings',
              title: '🏦 Jangan Lupa Menabung!',
              message: 'Hari ini kamu belum menabung. Yuk sisihkan sedikit untuk masa depan yang lebih baik!',
              actionText: 'Menabung Sekarang',
              onAction: () => {
                // Navigate to savings or show savings modal
                window.location.href = '/dashboard#savings';
              },
              autoClose: 12000, // 12 seconds
            });
          }, 5000); // Show after 5 seconds
        }
      }
    };

    checkSavingsReminder();
  }, [shouldShowSavingsReminder, notifications]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="pointer-events-auto space-y-4 p-4">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 50 - index 
            }}
          >
            <ModernNotification
              type={notification.type}
              title={notification.title}
              message={notification.message}
              onClose={() => removeNotification(notification.id)}
              onAction={notification.onAction}
              actionText={notification.actionText}
              autoClose={notification.autoClose}
            />
          </div>
        ))}
      </div>
    </div>
  );
}