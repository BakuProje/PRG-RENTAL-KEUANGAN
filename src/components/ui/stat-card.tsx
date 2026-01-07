import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'seabank';
  delay?: number;
  onClick?: () => void;
  customIcon?: string; // For custom image icons
}

const variantStyles = {
  default: {
    container: 'bg-card',
    icon: 'bg-muted text-muted-foreground',
  },
  primary: {
    container: 'bg-card',
    icon: 'gradient-primary text-primary-foreground shadow-glow',
  },
  success: {
    container: 'bg-card',
    icon: 'gradient-success text-secondary-foreground shadow-glow-success',
  },
  warning: {
    container: 'bg-card',
    icon: 'gradient-warm text-warning-foreground',
  },
  danger: {
    container: 'bg-card',
    icon: 'gradient-danger text-destructive-foreground',
  },
  seabank: {
    container: 'bg-card',
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30',
  },
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default',
  delay = 0,
  onClick,
  customIcon
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'stat-card',
        styles.container,
        onClick && 'cursor-pointer hover:shadow-md transition-shadow'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs minggu lalu</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
          styles.icon
        )}>
          {customIcon ? (
            <img src={customIcon} alt={title} className="w-8 h-8 object-contain" />
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
