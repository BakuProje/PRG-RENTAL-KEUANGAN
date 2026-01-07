import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, PiggyBank, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationProps {
  type: 'savings' | 'pickup' | 'info' | 'warning';
  title: string;
  message: string;
  onClose: () => void;
  onAction?: () => void;
  actionText?: string;
  autoClose?: number; // milliseconds
}

export function ModernNotification({ 
  type, 
  title, 
  message, 
  onClose, 
  onAction, 
  actionText,
  autoClose = 8000 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const getIcon = () => {
    switch (type) {
      case 'savings':
        return <PiggyBank className="w-6 h-6" />;
      case 'pickup':
        return <Clock className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <Bell className="w-6 h-6" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'savings':
        return {
          bg: 'from-emerald-500 to-teal-600',
          icon: 'text-emerald-100',
          text: 'text-white',
          button: 'bg-white/20 hover:bg-white/30 text-white border-white/30'
        };
      case 'pickup':
        return {
          bg: 'from-amber-500 to-orange-600',
          icon: 'text-amber-100',
          text: 'text-white',
          button: 'bg-white/20 hover:bg-white/30 text-white border-white/30'
        };
      case 'warning':
        return {
          bg: 'from-red-500 to-pink-600',
          icon: 'text-red-100',
          text: 'text-white',
          button: 'bg-white/20 hover:bg-white/30 text-white border-white/30'
        };
      default:
        return {
          bg: 'from-blue-500 to-indigo-600',
          icon: 'text-blue-100',
          text: 'text-white',
          button: 'bg-white/20 hover:bg-white/30 text-white border-white/30'
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.4 
          }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className={cn(
            "relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-sm",
            "bg-gradient-to-br", colors.bg
          )}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/20 animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-white/10 animate-pulse delay-1000" />
            </div>

            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-white/20 backdrop-blur-sm", colors.icon
                )}>
                  {getIcon()}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-bold text-lg mb-1", colors.text)}>
                    {title}
                  </h3>
                  <p className={cn("text-sm opacity-90 leading-relaxed", colors.text)}>
                    {message}
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                    "hover:bg-white/20 transition-colors", colors.icon
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Button */}
              {onAction && actionText && (
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={onAction}
                    size="sm"
                    className={cn(
                      "flex-1 font-medium transition-all",
                      colors.button
                    )}
                  >
                    {actionText}
                  </Button>
                </div>
              )}
            </div>

            {/* Progress bar for auto-close */}
            {autoClose > 0 && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoClose / 1000, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-white/30"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}