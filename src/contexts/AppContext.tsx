import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  User, 
  Transaction, 
  InventoryItem, 
  FavoriteLocation, 
  StockHistory,
  DeletedTransaction,
  CompletedTransaction,
  DailyRevenue,
  DeliveryPricing,
  SavingsEntry,
  SavingsState,
  RENTAL_PACKAGES,
  DELIVERY_PRICING_OPTIONS
} from '@/types/rental';

interface AppState {
  user: User | null;
  transactions: Transaction[];
  deletedTransactions: DeletedTransaction[];
  completedTransactions: CompletedTransaction[];
  inventory: InventoryItem[];
  favoriteLocations: FavoriteLocation[];
  stockHistory: StockHistory[];
  deliveryPricingOptions: DeliveryPricing[];
  savings: SavingsState;
  isLoading: boolean;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdBy' | 'status' | 'sessionEnded' | 'deliveryTime' | 'pickupTime' | 'rentalDays' | 'additionalHours' | 'notificationShown'>) => void;
  deleteTransaction: (id: string, reason: string) => void;
  completeTransaction: (id: string) => void;
  endSession: (id: string) => void;
  extendRentalDays: (id: string, additionalDays: number) => void;
  extendRentalHours: (id: string, additionalHours: number) => void;
  markNotificationShown: (id: string) => void;
  updateStock: (itemId: string, newStock: number, reason: string) => void;
  addFavoriteLocation: (location: Omit<FavoriteLocation, 'id' | 'createdAt'>) => void;
  removeFavoriteLocation: (id: string) => void;
  updateProfile: (name: string, email: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  addAdditionalPayment: (transactionId: string, amount: number, note: string) => void;
  updatePaymentStatus: (transactionId: string, status: 'paid' | 'unpaid' | 'partial', paidAmount?: number) => void;
  updateDeliveryPricing: (pricingId: string, newPrice: number) => void;
  addCustomDeliveryPricing: (name: string, price: number) => void;
  getDailyRevenue: (date: string) => DailyRevenue | null;
  getTodayRevenue: () => DailyRevenue | null;
  getYesterdayRevenue: () => DailyRevenue | null;
  addSavings: (amount: number, note?: string) => void;
  withdrawSavings: (amount: number, note?: string) => void;
  shouldShowSavingsReminder: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'ps_rental_transactions',
  DELETED_TRANSACTIONS: 'ps_rental_deleted_transactions',
  COMPLETED_TRANSACTIONS: 'ps_rental_completed_transactions',
  INVENTORY: 'ps_rental_inventory',
  FAVORITE_LOCATIONS: 'ps_rental_favorite_locations',
  STOCK_HISTORY: 'ps_rental_stock_history',
  DELIVERY_PRICING: 'ps_rental_delivery_pricing',
  SAVINGS: 'ps_rental_savings',
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

const defaultSavings: SavingsState = {
  totalBalance: 0,
  entries: [],
  lastDepositDate: undefined,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    // Load transactions and add default paymentStatus if missing
    const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []).map((tx: any) => ({
      ...tx,
      paymentStatus: tx.paymentStatus || 'unpaid',
    }));
    
    const completedTransactions = loadFromStorage(STORAGE_KEYS.COMPLETED_TRANSACTIONS, []).map((tx: any) => ({
      ...tx,
      paymentStatus: tx.paymentStatus || 'paid',
    }));

    return {
      user: loadFromStorage(STORAGE_KEYS.USER, mockUser),
      transactions,
      deletedTransactions: loadFromStorage(STORAGE_KEYS.DELETED_TRANSACTIONS, []),
      completedTransactions,
      inventory: loadFromStorage(STORAGE_KEYS.INVENTORY, defaultInventory),
      favoriteLocations: loadFromStorage(STORAGE_KEYS.FAVORITE_LOCATIONS, []),
      stockHistory: loadFromStorage(STORAGE_KEYS.STOCK_HISTORY, []),
      deliveryPricingOptions: loadFromStorage(STORAGE_KEYS.DELIVERY_PRICING, DELIVERY_PRICING_OPTIONS),
      savings: loadFromStorage(STORAGE_KEYS.SAVINGS, defaultSavings),
      isLoading: false,
    };
  });

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
    saveToStorage(STORAGE_KEYS.COMPLETED_TRANSACTIONS, state.completedTransactions);
  }, [state.completedTransactions]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.INVENTORY, state.inventory);
  }, [state.inventory]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.FAVORITE_LOCATIONS, state.favoriteLocations);
  }, [state.favoriteLocations]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.STOCK_HISTORY, state.stockHistory);
  }, [state.stockHistory]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.DELIVERY_PRICING, state.deliveryPricingOptions);
  }, [state.deliveryPricingOptions]);

  React.useEffect(() => {
    saveToStorage(STORAGE_KEYS.SAVINGS, state.savings);
  }, [state.savings]);

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
    (transaction: Omit<Transaction, 'id' | 'createdBy' | 'status' | 'sessionEnded' | 'deliveryTime' | 'pickupTime' | 'rentalDays' | 'additionalHours' | 'notificationShown'>) => {
      const now = new Date();
      const pickupTime = new Date(now);
      pickupTime.setDate(pickupTime.getDate() + 1); // Besok jam yang sama
      
      const newTransaction: Transaction = {
        ...transaction,
        id: `TRX-${String(state.transactions.length + state.completedTransactions.length + 1).padStart(3, '0')}`,
        createdBy: state.user?.id || '',
        status: 'active',
        sessionEnded: false,
        deliveryTime: now,
        pickupTime: pickupTime,
        rentalDays: 1,
        additionalHours: 0,
        notificationShown: false,
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
    [state.transactions.length, state.completedTransactions.length, state.user?.id]
  );

  const endSession = useCallback((id: string) => {
    setState((prev) => {
      // Cari transaksi yang spesifik
      const transaction = prev.transactions.find((t) => t.id === id);
      
      // Validasi: transaksi harus ada dan belum diakhiri
      if (!transaction) {
        console.error('Transaksi tidak ditemukan:', id);
        return prev;
      }
      
      if (transaction.sessionEnded) {
        console.warn('Transaksi sudah diakhiri:', id);
        return prev;
      }

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

      // Update hanya transaksi yang spesifik
      const updatedTransactions = prev.transactions.map((t) => {
        if (t.id === id) {
          return { 
            ...t, 
            sessionEnded: true, 
            sessionEndedAt: new Date() 
          };
        }
        return t;
      });

      return {
        ...prev,
        transactions: updatedTransactions,
        inventory: updatedInventory,
      };
    });
  }, []);

  const extendRentalDays = useCallback((id: string, additionalDays: number) => {
    setState((prev) => {
      // Cari transaksi yang spesifik
      const targetTransaction = prev.transactions.find(t => t.id === id);
      if (!targetTransaction) return prev;

      return {
        ...prev,
        transactions: prev.transactions.map((t) => {
          // Hanya update transaksi yang ID-nya PERSIS sama
          if (t.id === id) {
            const newPickupTime = new Date(t.pickupTime);
            newPickupTime.setDate(newPickupTime.getDate() + additionalDays);
            return {
              ...t,
              rentalDays: t.rentalDays + additionalDays,
              pickupTime: newPickupTime,
            };
          }
          return t;
        }),
      };
    });
  }, []);

  const extendRentalHours = useCallback((id: string, additionalHours: number) => {
    setState((prev) => {
      // Cari transaksi yang spesifik
      const targetTransaction = prev.transactions.find(t => t.id === id);
      if (!targetTransaction) return prev;

      return {
        ...prev,
        transactions: prev.transactions.map((t) => {
          // Hanya update transaksi yang ID-nya PERSIS sama
          if (t.id === id) {
            const newPickupTime = new Date(t.pickupTime);
            newPickupTime.setHours(newPickupTime.getHours() + additionalHours);
            return {
              ...t,
              additionalHours: t.additionalHours + additionalHours,
              pickupTime: newPickupTime,
            };
          }
          return t;
        }),
      };
    });
  }, []);

  const markNotificationShown = useCallback((id: string) => {
    setState((prev) => {
      // Cari transaksi yang spesifik
      const targetTransaction = prev.transactions.find(t => t.id === id);
      if (!targetTransaction) return prev;

      return {
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === id ? { ...t, notificationShown: true } : t
        ),
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

      // Return inventory HANYA jika package ada DAN session belum diakhiri
      // Jika session sudah diakhiri, inventory sudah dikembalikan
      if (transaction.package && !transaction.sessionEnded) {
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

  const completeTransaction = useCallback((id: string) => {
    setState((prev) => {
      const transaction = prev.transactions.find((t) => t.id === id);
      if (!transaction) return prev;

      const completedTransaction: CompletedTransaction = {
        ...transaction,
        status: 'completed',
        completedAt: new Date(),
        completedBy: prev.user?.id || '',
      };

      let updatedInventory = prev.inventory;

      // Return inventory HANYA jika package ada DAN session belum diakhiri
      // Jika session sudah diakhiri, inventory sudah dikembalikan
      if (transaction.package && !transaction.sessionEnded) {
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
        completedTransactions: [completedTransaction, ...prev.completedTransactions],
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
    setState(prev => {
      // Cari transaksi yang spesifik
      const targetTransaction = prev.transactions.find(tx => tx.id === transactionId);
      if (!targetTransaction) return prev;

      return {
        ...prev,
        transactions: prev.transactions.map(tx => {
          // Hanya update transaksi yang ID-nya PERSIS sama
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
      };
    });
  }, []);

  const updatePaymentStatus = useCallback((transactionId: string, status: 'paid' | 'unpaid' | 'partial', paidAmount?: number) => {
    setState(prev => {
      // Cari transaksi yang spesifik
      const targetTransaction = prev.transactions.find(tx => tx.id === transactionId);
      if (!targetTransaction) return prev;

      return {
        ...prev,
        transactions: prev.transactions.map(tx => {
          // Hanya update transaksi yang ID-nya PERSIS sama
          if (tx.id === transactionId) {
            return {
              ...tx,
              paymentStatus: status,
              paidAmount: status === 'partial' ? paidAmount : undefined,
            };
          }
          return tx;
        }),
      };
    });
  }, []);

  const updateDeliveryPricing = useCallback((pricingId: string, newPrice: number) => {
    setState(prev => ({
      ...prev,
      deliveryPricingOptions: prev.deliveryPricingOptions.map(option => 
        option.id === pricingId ? { ...option, price: newPrice } : option
      ),
    }));
  }, []);

  const addCustomDeliveryPricing = useCallback((name: string, price: number) => {
    const newPricing: DeliveryPricing = {
      id: `custom_${Date.now()}`,
      name,
      price,
    };

    setState(prev => ({
      ...prev,
      deliveryPricingOptions: [...prev.deliveryPricingOptions, newPricing],
    }));
  }, []);

  // Helper function to get local date string (YYYY-MM-DD) in Indonesia timezone
  const getLocalDateString = useCallback((date: Date): string => {
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
  }, []);

  // Calculate daily revenue for a specific date from all transactions (active + completed)
  const getDailyRevenue = useCallback((date: string): DailyRevenue | null => {
    const allTransactions = [...state.transactions, ...state.completedTransactions];
    
    // Filter transactions that were created on the specified date
    const dayTransactions = allTransactions.filter(t => {
      const txDate = new Date(t.date);
      const txDateStr = getLocalDateString(txDate);
      return txDateStr === date;
    });

    if (dayTransactions.length === 0) {
      return null;
    }

    return {
      date,
      totalAmount: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: dayTransactions.length,
      jasaAntarCount: dayTransactions.filter(t => t.type === 'jasa_antar').length,
      ambilUnitCount: dayTransactions.filter(t => t.type === 'ambil_unit').length,
    };
  }, [state.transactions, state.completedTransactions, getLocalDateString]);

  // Get today's revenue (transactions created today, regardless of current status)
  const getTodayRevenue = useCallback((): DailyRevenue | null => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    return getDailyRevenue(todayStr);
  }, [getDailyRevenue, getLocalDateString]);

  // Get yesterday's revenue (transactions created yesterday, regardless of current status)
  const getYesterdayRevenue = useCallback((): DailyRevenue | null => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    return getDailyRevenue(yesterdayStr);
  }, [getDailyRevenue, getLocalDateString]);

  // Savings functions
  const addSavings = useCallback((amount: number, note?: string) => {
    const now = new Date();
    const newEntry: SavingsEntry = {
      id: `SAV-${Date.now()}`,
      amount,
      date: now,
      note,
      createdBy: state.user?.id || '',
    };

    setState(prev => ({
      ...prev,
      savings: {
        totalBalance: prev.savings.totalBalance + amount,
        entries: [newEntry, ...prev.savings.entries],
        lastDepositDate: getLocalDateString(now),
      },
    }));
  }, [state.user?.id, getLocalDateString]);

  const withdrawSavings = useCallback((amount: number, note?: string) => {
    setState(prev => {
      if (prev.savings.totalBalance < amount) {
        return prev; // Insufficient balance
      }

      const now = new Date();
      const newEntry: SavingsEntry = {
        id: `SAV-${Date.now()}`,
        amount: -amount, // Negative for withdrawal
        date: now,
        note,
        createdBy: prev.user?.id || '',
      };

      return {
        ...prev,
        savings: {
          totalBalance: prev.savings.totalBalance - amount,
          entries: [newEntry, ...prev.savings.entries],
          lastDepositDate: prev.savings.lastDepositDate, // Don't update on withdrawal
        },
      };
    });
  }, []);

  const shouldShowSavingsReminder = useCallback((): boolean => {
    const today = getLocalDateString(new Date());
    return !state.savings.lastDepositDate || state.savings.lastDepositDate !== today;
  }, [state.savings.lastDepositDate, getLocalDateString]);

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
        completeTransaction,
        endSession,
        extendRentalDays,
        extendRentalHours,
        markNotificationShown,
        updateStock,
        addFavoriteLocation,
        removeFavoriteLocation,
        updateProfile,
        changePassword,
        addAdditionalPayment,
        updatePaymentStatus,
        updateDeliveryPricing,
        addCustomDeliveryPricing,
        getDailyRevenue,
        getTodayRevenue,
        getYesterdayRevenue,
        addSavings,
        withdrawSavings,
        shouldShowSavingsReminder,
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
