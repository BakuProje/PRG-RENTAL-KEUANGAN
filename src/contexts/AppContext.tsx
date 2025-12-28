import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  User, 
  Transaction, 
  InventoryItem, 
  FavoriteLocation, 
  StockHistory,
  DeletedTransaction,
  RENTAL_PACKAGES
} from '@/types/rental';

interface AppState {
  user: User | null;
  transactions: Transaction[];
  deletedTransactions: DeletedTransaction[];
  inventory: InventoryItem[];
  favoriteLocations: FavoriteLocation[];
  stockHistory: StockHistory[];
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdBy' | 'status' | 'sessionEnded'>) => void;
  deleteTransaction: (id: string, reason: string) => void;
  endSession: (id: string) => void;
  updateStock: (itemId: string, newStock: number, reason: string) => void;
  addFavoriteLocation: (location: Omit<FavoriteLocation, 'id' | 'createdAt'>) => void;
  removeFavoriteLocation: (id: string) => void;
  updateProfile: (name: string, email: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  addAdditionalPayment: (transactionId: string, amount: number, note: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'ps_rental_transactions',
  DELETED_TRANSACTIONS: 'ps_rental_deleted_transactions',
  INVENTORY: 'ps_rental_inventory',
  FAVORITE_LOCATIONS: 'ps_rental_favorite_locations',
  STOCK_HISTORY: 'ps_rental_stock_history',
  USER: 'ps_rental_user',
  PASSWORD: 'ps_rental_password',
};

// Load from localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      // Convert date strings back to Date objects
      return JSON.parse(stored, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

// Save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Mock initial data
const mockUser: User = {
  id: '1',
  name: 'Admin Rental',
  email: 'admin@psrental.com',
  role: 'admin',
};

const defaultInventory: InventoryItem[] = [
  { id: '1', name: 'PlayStation 3', type: 'ps3', stock: 0, available: 0, minStock: 2 },
  { id: '2', name: 'PlayStation 4', type: 'ps4', stock: 1, available: 1, minStock: 1 },
  { id: '3', name: 'TV 32 inch', type: 'tv_32', stock: 0, available: 0, minStock: 2 },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({
    user: loadFromStorage(STORAGE_KEYS.USER, mockUser),
    transactions: loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []),
    deletedTransactions: loadFromStorage(STORAGE_KEYS.DELETED_TRANSACTIONS, []),
    inventory: loadFromStorage(STORAGE_KEYS.INVENTORY, defaultInventory),
    favoriteLocations: loadFromStorage(STORAGE_KEYS.FAVORITE_LOCATIONS, []),
    stockHistory: loadFromStorage(STORAGE_KEYS.STOCK_HISTORY, []),
    isLoading: false,
  }));

  // Save to localStorage whenever state changes
  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER, state.user);
  }, [state.user]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions);
  }, [state.transactions]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.DELETED_TRANSACTIONS, state.deletedTransactions);
  }, [state.deletedTransactions]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.INVENTORY, state.inventory);
  }, [state.inventory]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.FAVORITE_LOCATIONS, state.favoriteLocations);
  }, [state.favoriteLocations]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.STOCK_HISTORY, state.stockHistory);
  }, [state.stockHistory]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'admin@psrental.com' && password === 'admin123') {
      setState(prev => ({ ...prev, user: mockUser, isLoading: false }));
      return true;
    }
    
    setState(prev => ({ ...prev, isLoading: false }));
    return false;
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, user: null }));
  }, []);

  const addTransaction = useCallback(
    (transaction: Omit<Transaction, 'id' | 'createdBy' | 'status' | 'sessionEnded'>) => {
      const newTransaction: Transaction = {
        ...transaction,
        id: `TRX-${String(state.transactions.length + 1).padStart(3, '0')}`,
        createdBy: state.user?.id || '',
        status: 'active',
        sessionEnded: false,
      };

      setState((prev) => {
        let updatedInventory = prev.inventory;

        // Reduce inventory if package is selected
        if (transaction.package) {
          const pkg = RENTAL_PACKAGES[transaction.package];
          updatedInventory = prev.inventory.map((item) => {
            if (pkg.items.includes(item.type)) {
              return {
                ...item,
                available: Math.max(0, item.available - 1),
              };
            }
            return item;
          });
        }

        return {
          ...prev,
          transactions: [newTransaction, ...prev.transactions],
          inventory: updatedInventory,
        };
      });
    },
    [state.transactions.length, state.user?.id]
  );

  const endSession = useCallback((id: string) => {
    setState((prev) => {
      const transaction = prev.transactions.find((t) => t.id === id);
      if (!transaction || transaction.sessionEnded) return prev;

      let updatedInventory = prev.inventory;

      // Return inventory if package was used
      if (transaction.package) {
        const pkg = RENTAL_PACKAGES[transaction.package];
        updatedInventory = prev.inventory.map((item) => {
          if (pkg.items.includes(item.type)) {
            return {
              ...item,
              available: Math.min(item.stock, item.available + 1),
            };
          }
          return item;
        });
      }

      return {
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === id
            ? { ...t, sessionEnded: true, sessionEndedAt: new Date() }
            : t
        ),
        inventory: updatedInventory,
      };
    });
  }, []);

  const deleteTransaction = useCallback((id: string, reason: string) => {
    setState((prev) => {
      const transaction = prev.transactions.find((t) => t.id === id);
      if (!transaction) return prev;

      const deletedTransaction: DeletedTransaction = {
        ...transaction,
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: prev.user?.id || '',
        deleteReason: reason,
      };

      let updatedInventory = prev.inventory;

      // Return inventory if package was used
      if (transaction.package) {
        const pkg = RENTAL_PACKAGES[transaction.package];
        updatedInventory = prev.inventory.map((item) => {
          if (pkg.items.includes(item.type)) {
            return {
              ...item,
              available: Math.min(item.stock, item.available + 1),
            };
          }
          return item;
        });
      }

      return {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        deletedTransactions: [deletedTransaction, ...prev.deletedTransactions],
        inventory: updatedInventory,
      };
    });
  }, []);

  const updateStock = useCallback((itemId: string, newStock: number, reason: string) => {
    setState(prev => {
      const item = prev.inventory.find(i => i.id === itemId);
      if (!item) return prev;

      const history: StockHistory = {
        id: `SH-${Date.now()}`,
        itemId,
        previousStock: item.stock,
        newStock,
        reason,
        changedBy: prev.user?.id || '',
        changedAt: new Date(),
      };

      return {
        ...prev,
        inventory: prev.inventory.map(i =>
          i.id === itemId ? { ...i, stock: newStock, available: newStock } : i
        ),
        stockHistory: [history, ...prev.stockHistory],
      };
    });
  }, []);

  const addFavoriteLocation = useCallback((location: Omit<FavoriteLocation, 'id' | 'createdAt'>) => {
    const newLocation: FavoriteLocation = {
      ...location,
      id: `FAV-${Date.now()}`,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      favoriteLocations: [...prev.favoriteLocations, newLocation],
    }));
  }, []);

  const removeFavoriteLocation = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      favoriteLocations: prev.favoriteLocations.filter(l => l.id !== id),
    }));
  }, []);

  const updateProfile = useCallback((name: string, email: string) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, name, email } : null,
    }));
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get stored password or use default
    const storedPassword = localStorage.getItem(STORAGE_KEYS.PASSWORD) || 'admin123';
    
    if (oldPassword === storedPassword) {
      // Save new password
      localStorage.setItem(STORAGE_KEYS.PASSWORD, newPassword);
      return true;
    }
    
    return false;
  }, []);

  const addAdditionalPayment = useCallback((transactionId: string, amount: number, note: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(tx => {
        if (tx.id === transactionId) {
          return {
            ...tx,
            amount: tx.amount + amount,
            notes: tx.notes 
              ? `${tx.notes}\n[Tambahan: ${formatCurrency(amount)} - ${note}]`
              : `[Tambahan: ${formatCurrency(amount)} - ${note}]`,
          };
        }
        return tx;
      }),
    }));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        addTransaction,
        deleteTransaction,
        endSession,
        updateStock,
        addFavoriteLocation,
        removeFavoriteLocation,
        updateProfile,
        changePassword,
        addAdditionalPayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
