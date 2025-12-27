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

export type RentalPackage = 'ps3_only' | 'ps3_tv' | 'ps4_only' | 'ps4_tv';

export interface RentalPackageInfo {
  id: RentalPackage;
  name: string;
  price: number;
  items: string[];
}

export type TransactionType = 'jasa_antar' | 'ambil_unit';

export interface Transaction {
  id: string;
  type: TransactionType;
  package?: RentalPackage;
  customerName: string;
  customerPhone: string;
  location: Location;
  amount: number;
  date: Date;
  createdBy: string;
  notes?: string;
  status: 'active' | 'completed' | 'deleted';
}

export interface DeletedTransaction extends Transaction {
  deletedAt: Date;
  deletedBy: string;
  deleteReason: string;
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
