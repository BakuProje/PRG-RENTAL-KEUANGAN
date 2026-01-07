export type UserRole = 'admin' | 'karyawan';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  accuracy: 'high' | 'medium' | 'low';
}

export interface FavoriteLocation {
  id: string;
  name: string;
  location: Location;
  createdAt: Date;
}

export type RentalPackage = 'tv_only' | 'ps3_only' | 'ps3_tv' | 'ps4_only' | 'ps4_tv';

export interface RentalPackageInfo {
  id: RentalPackage;
  name: string;
  price: number;
  items: string[];
}

export type TransactionType = 'jasa_antar' | 'ambil_unit';

export type CustomerType = 'langganan' | 'bukan_langganan';

export interface Transaction {
  id: string;
  type: TransactionType;
  package?: RentalPackage;
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  ktpPhoto?: string; // Base64 encoded image
  location: Location;
  amount: number;
  deliveryPrice?: number; // Custom delivery price for jasa_antar
  deliveryPricingId?: string; // Reference to pricing option used
  date: Date;
  deliveryTime: Date; // Waktu pengantaran
  pickupTime: Date; // Waktu pengambilan (besok jam yang sama)
  rentalDays: number; // Jumlah hari rental (default 1)
  additionalHours: number; // Tambahan jam (default 0)
  createdBy: string;
  notes?: string;
  status: 'active' | 'completed' | 'deleted';
  sessionEnded?: boolean;
  sessionEndedAt?: Date;
  notificationShown?: boolean; // Flag untuk notifikasi 30 menit sebelum pickup
}

export interface DeletedTransaction extends Transaction {
  deletedAt: Date;
  deletedBy: string;
  deleteReason: string;
}

export interface CompletedTransaction extends Transaction {
  completedAt: Date;
  completedBy: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'ps3' | 'ps4' | 'tv_32';
  stock: number;
  available: number;
  minStock: number;
}

export interface StockHistory {
  id: string;
  itemId: string;
  previousStock: number;
  newStock: number;
  reason: string;
  changedBy: string;
  changedAt: Date;
}

export const RENTAL_PACKAGES: Record<RentalPackage, RentalPackageInfo> = {
  tv_only: {
    id: 'tv_only',
    name: 'TV Only',
    price: 60000,
    items: ['tv_32'],
  },
  ps3_only: {
    id: 'ps3_only',
    name: 'PS3 Only',
    price: 60000,
    items: ['ps3'],
  },
  ps3_tv: {
    id: 'ps3_tv',
    name: 'PS3 + TV',
    price: 75000,
    items: ['ps3', 'tv_32'],
  },
  ps4_only: {
    id: 'ps4_only',
    name: 'PS4 Only',
    price: 100000,
    items: ['ps4'],
  },
  ps4_tv: {
    id: 'ps4_tv',
    name: 'PS4 + TV',
    price: 135000,
    items: ['ps4', 'tv_32'],
  },
};

export const JASA_ANTAR_FEE = 25000;

// Delivery pricing options
export interface DeliveryPricing {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export const DELIVERY_PRICING_OPTIONS: DeliveryPricing[] = [
  { id: 'standard', name: 'Standar', price: 25000, isDefault: true },
  { id: 'promo', name: 'Promo', price: 20000 },
  { id: 'custom', name: 'Custom', price: 0 }, // Will be set by user
];

// Daily revenue tracking
export interface DailyRevenue {
  date: string; // YYYY-MM-DD format
  totalAmount: number;
  transactionCount: number;
  jasaAntarCount: number;
  ambilUnitCount: number;
}

// Savings/Tabungan system
export interface SavingsEntry {
  id: string;
  amount: number;
  date: Date;
  note?: string;
  createdBy: string;
}

export interface SavingsState {
  totalBalance: number;
  entries: SavingsEntry[];
  lastDepositDate?: string; // YYYY-MM-DD format
}

// Helper function to get available count for a package based on inventory
export const getPackageAvailableCount = (
  packageId: RentalPackage,
  inventory: InventoryItem[]
): number => {
  const pkg = RENTAL_PACKAGES[packageId];
  
  // Get minimum available count across all required items
  const counts = pkg.items.map(itemType => {
    const item = inventory.find(i => i.type === itemType);
    return item ? item.available : 0;
  });
  
  // Return the minimum (bottleneck)
  return Math.min(...counts);
};
