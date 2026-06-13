/**
 * ============================================================================
 * DevMaster Wealth Engine - Financial Console
 * Version: 1.8.1-PRO (Carlos Custom Ohio Release - Netlify Strict Mode)
 * Last Updated: June 12, 2026
 * * HISTORIAL DE CAMBIOS Y MEJORAS DE ARQUITECTURA (v1.8.1):
 * 1. Resolución de Errores Estrictos TS: Se corrigió la referencia huérfana de 
 * 'state.accounts.emergencyFundGoal' en la UI del Dashboard.
 * 2. Limpieza de Código Muerto (Dead Code): Se eliminó la variable 'state' sin 
 * uso en el componente PaystubSimulatorView para aprobar el pipeline de Netlify.
 * ============================================================================
 */

import React, { createContext, useContext, useReducer, useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  ShieldCheck, 
  Wallet, 
  Landmark, 
  LayoutDashboard, 
  Sun, 
  Moon, 
  PlusCircle, 
  Trash2, 
  AlertTriangle, 
  RefreshCw, 
  UserCheck, 
  Coins, 
  Calculator,
  ArrowLeftRight,
  Play,
  Pause,
  Upload,
  Download,
  Eye,
  Plus,
  X
} from 'lucide-react';


type TransactionType = 'INCOME' | 'EXPENSE';
type AssetType = 'STOCKS' | 'CRYPTO' | 'FIXED_INCOME' | 'CASH';
type Tab = 'DASHBOARD' | 'BUDGET' | 'PORTFOLIO' | 'PAYSTUB';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: 'Vivienda' | 'Comida' | 'Transporte' | 'Ocio' | 'Inversión' | 'Salario' | 'Otros';
  date: string;
}

interface InvestmentAsset {
  id: string;
  name: string;
  type: AssetType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  prevPrice?: number;
}

interface WatchlistItem {
  ticker: string;
  name: string;
  currentPrice: number;
  prevPrice?: number;
}

interface BankAccounts {
  wellsFargo: number;
  bofA: number;
  marcus: number;
  robinhoodCash: number;
}

interface PaystubConfig {
  hourlyRate: number;
  regularHours: number;
  doubleTimeHours: number;
  filingStatus: 'SINGLE' | 'JOINT';
  dependents: number;
}

interface FinancialState {
  transactions: Transaction[];
  assets: InvestmentAsset[];
  watchlist: WatchlistItem[];
  accounts: BankAccounts;
  monthlyBudgetLimit: number;
  emergencyFundGoal: number;
  paystubConfig: PaystubConfig;
}

type FinancialAction =
  | { type: 'RESET_STATE' }
  | { type: 'IMPORT_STATE'; payload: FinancialState }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_MANY_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'DELETE_ALL_TRANSACTIONS' }
  | { type: 'ADD_ASSET'; payload: InvestmentAsset }
  | { type: 'UPDATE_ASSET_PRICE'; payload: { id: string; currentPrice: number } }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'EXECUTE_LIMIT_ORDER'; payload: { assetName: string; shares: number; price: number; totalCost: number } }
  | { type: 'UPDATE_LIQUID_CASH'; payload: { account: keyof BankAccounts; amount: number } }
  | { type: 'TRANSFER_FUNDS'; payload: { from: keyof BankAccounts; to: keyof BankAccounts; amount: number } }
  | { type: 'SET_BUDGET_LIMIT'; payload: number }
  | { type: 'SET_EMERGENCY_GOAL'; payload: number }
  | { type: 'UPDATE_PAYSTUB_CONFIG'; payload: Partial<PaystubConfig> }
  | { type: 'TICK_MARKET_PRICES' }
  | { type: 'ADD_WATCHLIST_ITEM'; payload: WatchlistItem }
  | { type: 'REMOVE_WATCHLIST_ITEM'; payload: string };

const LOCAL_STORAGE_KEY = 'DEVMASTER_CARLOS_FINANCES_V150';

// Base de datos de tickers conocidos para autocompletado inteligente
const TICKER_DATABASE: Record<string, { name: string; price: number }> = {
  AAPL: { name: 'Apple Inc.', price: 189.30 },
  MSFT: { name: 'Microsoft Corporation', price: 392.96 },
  NVDA: { name: 'NVIDIA Corporation', price: 206.18 },
  TSLA: { name: 'Tesla, Inc.', price: 178.50 },
  AMZN: { name: 'Amazon.com, Inc.', price: 181.20 },
  VOO: { name: 'Vanguard S&P 500 ETF', price: 680.05 },
  SCHD: { name: 'Schwab US Dividend Equity ETF', price: 32.52 },
  SCHG: { name: 'Schwab US Large-Cap Growth ETF', price: 33.64 },
  VTV: { name: 'Vanguard Value ETF', price: 215.00 },
  O: { name: 'Realty Income Corporation', price: 61.98 },
  VXUS: { name: 'Vanguard Total Intl Stock ETF', price: 57.50 },
  AMD: { name: 'Advanced Micro Devices', price: 160.20 },
  INTC: { name: 'Intel Corporation', price: 30.50 },
  META: { name: 'Meta Platforms, Inc.', price: 502.30 },
  GOOGL: { name: 'Alphabet Inc.', price: 176.80 },
  JPM: { name: 'JPMorgan Chase & Co.', price: 198.50 },
  COST: { name: 'Costco Wholesale Corp.', price: 815.20 },
  BRK: { name: 'Berkshire Hathaway Inc.', price: 410.15 },
  V: { name: 'Visa Inc.', price: 322.26 }
};

const initialCarlosState: FinancialState = {
  transactions: [
    // Junio 2026
    { id: 't1', description: 'Pago de Renta Mensual', amount: 1900, type: 'EXPENSE', category: 'Vivienda', date: '2026-06-01' },
    { id: 't2', description: 'Salario Especialista Eléctrico (Neto)', amount: 2650.67, type: 'INCOME', category: 'Salario', date: '2026-06-10' },
    { id: 't3', description: 'Dividendo Realty Income (O)', amount: 1.29, type: 'INCOME', category: 'Otros', date: '2026-06-02' },
    { id: 't4', description: 'Intereses Robinhood Gold', amount: 8.85, type: 'INCOME', category: 'Otros', date: '2026-06-01' },
    { id: 't5', description: 'Compras Supermercado', amount: 320.00, type: 'EXPENSE', category: 'Comida', date: '2026-06-04' },
    { id: 't6', description: 'Gasolina Camioneta Trabajo', amount: 85.00, type: 'EXPENSE', category: 'Transporte', date: '2026-06-06' },
    // Mayo 2026 (Para Historial Comparativo Inicial)
    { id: 'tm1', description: 'Pago de Renta Mensual (Mayo)', amount: 1900, type: 'EXPENSE', category: 'Vivienda', date: '2026-05-01' },
    { id: 'tm2', description: 'Salario Base ESI (Mayo)', amount: 2450.00, type: 'INCOME', category: 'Salario', date: '2026-05-15' },
    { id: 'tm3', description: 'Compra de Víveres Costco', amount: 410.00, type: 'EXPENSE', category: 'Comida', date: '2026-05-10' },
    { id: 'tm4', description: 'Mantenimiento Herramientas', amount: 150.00, type: 'EXPENSE', category: 'Otros', date: '2026-05-18' }
  ],
  assets: [
    { id: 'a1', name: 'NVDA', type: 'STOCKS', quantity: 1.93, buyPrice: 110.00, currentPrice: 206.18, prevPrice: 206.18 },
    { id: 'a2', name: 'VOO', type: 'STOCKS', quantity: 1.42, buyPrice: 480.00, currentPrice: 680.05, prevPrice: 680.05 },
    { id: 'a3', name: 'SCHG', type: 'STOCKS', quantity: 25.80, buyPrice: 32.50, currentPrice: 33.64, prevPrice: 33.64 },
    { id: 'a4', name: 'VTV', type: 'STOCKS', quantity: 1.27, buyPrice: 165.00, currentPrice: 215.00, prevPrice: 215.00 },
    { id: 'a5', name: 'SCHD', type: 'STOCKS', quantity: 8.15, buyPrice: 30.50, currentPrice: 32.52, prevPrice: 32.52 },
    { id: 'a6', name: 'MSFT', type: 'STOCKS', quantity: 0.386615, buyPrice: 410.00, currentPrice: 392.96, prevPrice: 392.96 },
    { id: 'a7', name: 'Realty Income (O)', type: 'STOCKS', quantity: 7.29, buyPrice: 59.66, currentPrice: 61.98, prevPrice: 61.98 }
  ],
  watchlist: [
    { ticker: 'TSLA', name: 'Tesla, Inc.', currentPrice: 178.50, prevPrice: 178.50 },
    { ticker: 'AAPL', name: 'Apple Inc.', currentPrice: 189.30, prevPrice: 189.30 },
    { ticker: 'AMZN', name: 'Amazon.com, Inc.', currentPrice: 181.20, prevPrice: 181.20 },
    { ticker: 'VXUS', name: 'Vanguard Total Intl Stock ETF', currentPrice: 57.50, prevPrice: 57.50 }
  ],
  accounts: {
    wellsFargo: 6135.00,
    bofA: 1697.00,
    marcus: 16533.00,
    robinhoodCash: 4403.86
  },
  monthlyBudgetLimit: 2500,
  emergencyFundGoal: 15000,
  paystubConfig: {
    hourlyRate: 46.00,
    regularHours: 40,
    doubleTimeHours: 23,
    filingStatus: 'JOINT',
    dependents: 1
  }
};


const financialReducer = (state: FinancialState, action: FinancialAction): FinancialState => {
  switch (action.type) {
    case 'RESET_STATE':
      return initialCarlosState;
    case 'IMPORT_STATE':
      return action.payload;
    case 'ADD_TRANSACTION': {
      const isIncome = action.payload.type === 'INCOME';
      const updatedWF = isIncome 
        ? state.accounts.wellsFargo + action.payload.amount 
        : state.accounts.wellsFargo - action.payload.amount;
      return { 
        ...state, 
        transactions: [action.payload, ...state.transactions],
        accounts: { ...state.accounts, wellsFargo: Number(updatedWF.toFixed(2)) }
      };
    }
    case 'ADD_MANY_TRANSACTIONS': {
      let tempWF = state.accounts.wellsFargo;
      action.payload.forEach(tx => {
        if (tx.type === 'INCOME') tempWF += tx.amount;
        else tempWF -= tx.amount;
      });
      return {
        ...state,
        transactions: [...action.payload, ...state.transactions],
        accounts: { ...state.accounts, wellsFargo: Number(tempWF.toFixed(2)) }
      };
    }
    case 'DELETE_TRANSACTION': {
      const tx = state.transactions.find(t => t.id === action.payload);
      if (!tx) return state;
      const isIncome = tx.type === 'INCOME';
      const reversedWF = isIncome
        ? state.accounts.wellsFargo - tx.amount
        : state.accounts.wellsFargo + tx.amount;
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        accounts: { ...state.accounts, wellsFargo: Number(reversedWF.toFixed(2)) }
      };
    }
    case 'DELETE_ALL_TRANSACTIONS': {
      // Revertimos el impacto en el balance principal iterando los montos
      let tempWF = state.accounts.wellsFargo;
      state.transactions.forEach(tx => {
        if (tx.type === 'INCOME') tempWF -= tx.amount;
        else tempWF += tx.amount;
      });
      return {
        ...state,
        transactions: [],
        accounts: { ...state.accounts, wellsFargo: Number(tempWF.toFixed(2)) }
      };
    }
    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, action.payload] };
    case 'UPDATE_ASSET_PRICE':
      return {
        ...state,
        assets: state.assets.map(asset =>
          asset.id === action.payload.id 
            ? { ...asset, prevPrice: asset.currentPrice, currentPrice: action.payload.currentPrice } 
            : asset
        ),
      };
    case 'DELETE_ASSET':
      return { ...state, assets: state.assets.filter(a => a.id !== action.payload) };
    case 'EXECUTE_LIMIT_ORDER': {
      if (state.accounts.robinhoodCash < action.payload.totalCost) return state;
      const existingAssetIndex = state.assets.findIndex(a => a.name.toUpperCase() === action.payload.assetName.toUpperCase());
      let updatedAssets = [...state.assets];

      if (existingAssetIndex > -1) {
        const existing = state.assets[existingAssetIndex];
        const newQty = existing.quantity + action.payload.shares;
        const newAverageBuyPrice = ((existing.quantity * existing.buyPrice) + (action.payload.shares * action.payload.price)) / newQty;
        updatedAssets[existingAssetIndex] = {
          ...existing,
          quantity: newQty,
          buyPrice: Number(newAverageBuyPrice.toFixed(2)),
          prevPrice: existing.currentPrice,
          currentPrice: action.payload.price
        };
      } else {
        updatedAssets.push({
          id: crypto.randomUUID(),
          name: action.payload.assetName.toUpperCase(),
          type: 'STOCKS',
          quantity: action.payload.shares,
          buyPrice: action.payload.price,
          prevPrice: action.payload.price,
          currentPrice: action.payload.price
        });
      }

      return {
        ...state,
        assets: updatedAssets,
        accounts: {
          ...state.accounts,
          robinhoodCash: Number((state.accounts.robinhoodCash - action.payload.totalCost).toFixed(2))
        }
      };
    }
    case 'UPDATE_LIQUID_CASH':
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [action.payload.account]: action.payload.amount
        }
      };
    case 'TRANSFER_FUNDS': {
      const { from, to, amount } = action.payload;
      if (state.accounts[from] < amount) return state;
      return {
        ...state,
        accounts: {
          ...state.accounts,
          [from]: Number((state.accounts[from] - amount).toFixed(2)),
          [to]: Number((state.accounts[to] + amount).toFixed(2))
        }
      };
    }
    case 'SET_BUDGET_LIMIT':
      return { ...state, monthlyBudgetLimit: action.payload };
    case 'SET_EMERGENCY_GOAL':
      return { ...state, emergencyFundGoal: action.payload };
    case 'UPDATE_PAYSTUB_CONFIG':
      return { ...state, paystubConfig: { ...state.paystubConfig, ...action.payload } };
    case 'ADD_WATCHLIST_ITEM':
      if (state.watchlist.some(w => w.ticker.toUpperCase() === action.payload.ticker.toUpperCase())) return state;
      return { ...state, watchlist: [...state.watchlist, action.payload] };
    case 'REMOVE_WATCHLIST_ITEM':
      return { ...state, watchlist: state.watchlist.filter(w => w.ticker !== action.payload) };
    case 'TICK_MARKET_PRICES':
      return {
        ...state,
        assets: state.assets.map(asset => {
          const changePercent = (Math.random() * 0.40 - 0.18) / 100;
          const newPrice = Number(Math.max(0.01, asset.currentPrice * (1 + changePercent)).toFixed(2));
          return { ...asset, prevPrice: asset.currentPrice, currentPrice: newPrice };
        }),
        watchlist: state.watchlist.map(item => {
          const changePercent = (Math.random() * 0.40 - 0.18) / 100;
          const newPrice = Number(Math.max(0.01, item.currentPrice * (1 + changePercent)).toFixed(2));
          return { ...item, prevPrice: item.currentPrice, currentPrice: newPrice };
        })
      };
    default:
      return state;
  }
};


interface FinancialContextType {
  state: FinancialState;
  addTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  addManyTransactions: (t: Transaction[]) => void;
  deleteTransaction: (id: string) => void;
  deleteAllTransactions: () => void;
  addAsset: (a: Omit<InvestmentAsset, 'id'>) => void;
  updateAssetPrice: (id: string, currentPrice: number) => void;
  deleteAsset: (id: string) => void;
  updateLiquidCash: (account: keyof BankAccounts, amount: number) => void;
  executeLimitOrder: (assetName: string, shares: number, price: number) => boolean;
  transferFunds: (from: keyof BankAccounts, to: keyof BankAccounts, amount: number) => boolean;
  setBudgetLimit: (limit: number) => void;
  setEmergencyGoal: (goal: number) => void;
  updatePaystubConfig: (config: Partial<PaystubConfig>) => void;
  resetAllData: () => void;
  importBackup: (backup: FinancialState) => void;
  addToWatchlist: (ticker: string, name: string, currentPrice: number) => void;
  removeFromWatchlist: (ticker: string) => void;
  isLiveFeed: boolean;
  setIsLiveFeed: (val: boolean) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const loadResilientState = (): FinancialState => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return initialCarlosState;
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return initialCarlosState;
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : initialCarlosState.transactions,
      assets: Array.isArray(parsed.assets) ? parsed.assets : initialCarlosState.assets,
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : initialCarlosState.watchlist,
      accounts: { ...initialCarlosState.accounts, ...parsed.accounts },
      monthlyBudgetLimit: parsed.monthlyBudgetLimit || initialCarlosState.monthlyBudgetLimit,
      emergencyFundGoal: parsed.emergencyFundGoal || initialCarlosState.emergencyFundGoal,
      paystubConfig: { ...initialCarlosState.paystubConfig, ...parsed.paystubConfig }
    };
  } catch {
    return initialCarlosState;
  }
};

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financialReducer, null, loadResilientState);
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Hilo de fluctuación del mercado
  useEffect(() => {
    if (!isLiveFeed) return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK_MARKET_PRICES' });
    }, 3500);
    return () => clearInterval(interval);
  }, [isLiveFeed]);

  const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: { ...t, id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0] }
    });
  };

  const addManyTransactions = (payload: Transaction[]) => dispatch({ type: 'ADD_MANY_TRANSACTIONS', payload });
  const deleteTransaction = (id: string) => dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  const deleteAllTransactions = () => dispatch({ type: 'DELETE_ALL_TRANSACTIONS' });
  const addAsset = (a: Omit<InvestmentAsset, 'id'>) => dispatch({ type: 'ADD_ASSET', payload: { ...a, id: crypto.randomUUID() } });
  const updateAssetPrice = (id: string, currentPrice: number) => dispatch({ type: 'UPDATE_ASSET_PRICE', payload: { id, currentPrice } });
  const deleteAsset = (id: string) => dispatch({ type: 'DELETE_ASSET', payload: id });
  const updateLiquidCash = (account: keyof BankAccounts, amount: number) => dispatch({ type: 'UPDATE_LIQUID_CASH', payload: { account, amount } });
  const setBudgetLimit = (limit: number) => dispatch({ type: 'SET_BUDGET_LIMIT', payload: limit });
  const setEmergencyGoal = (goal: number) => dispatch({ type: 'SET_EMERGENCY_GOAL', payload: goal });
  const updatePaystubConfig = (config: Partial<PaystubConfig>) => dispatch({ type: 'UPDATE_PAYSTUB_CONFIG', payload: config });
  const resetAllData = () => dispatch({ type: 'RESET_STATE' });
  const importBackup = (payload: FinancialState) => dispatch({ type: 'IMPORT_STATE', payload });
  
  const addToWatchlist = (ticker: string, name: string, currentPrice: number) => {
    dispatch({ type: 'ADD_WATCHLIST_ITEM', payload: { ticker, name, currentPrice, prevPrice: currentPrice } });
  };
  const removeFromWatchlist = (ticker: string) => dispatch({ type: 'REMOVE_WATCHLIST_ITEM', payload: ticker });

  const executeLimitOrder = (assetName: string, shares: number, price: number): boolean => {
    const totalCost = shares * price;
    if (state.accounts.robinhoodCash < totalCost) return false;
    dispatch({ type: 'EXECUTE_LIMIT_ORDER', payload: { assetName, shares, price, totalCost } });
    return true;
  };

  const transferFunds = (from: keyof BankAccounts, to: keyof BankAccounts, amount: number): boolean => {
    if (state.accounts[from] < amount) return false;
    dispatch({ type: 'TRANSFER_FUNDS', payload: { from, to, amount } });
    return true;
  };

  return (
    <FinancialContext.Provider value={{ 
      state, addTransaction, addManyTransactions, deleteTransaction, deleteAllTransactions, addAsset, updateAssetPrice, 
      deleteAsset, updateLiquidCash, executeLimitOrder, transferFunds, setBudgetLimit, setEmergencyGoal, 
      updatePaystubConfig, resetAllData, importBackup, addToWatchlist, removeFromWatchlist, isLiveFeed, setIsLiveFeed 
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

const useFinancials = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error('useFinancials debe usarse bajo el FinancialProvider');
  return context;
};

// ==========================================
// 3. SELECCIÓN DINÁMICA DE PERIODOS (ÚLTIMOS 2 MESES DE DATOS)
// ==========================================
const useDynamicPeriods = (transactions: Transaction[]) => {
  return useMemo(() => {
    // Obtiene meses únicos presentes en el historial ordenados de manera descendente (los más recientes primero)
    const uniqueMonths = Array.from(
      new Set(
        transactions
          .map(t => t.date.substring(0, 7))
          .filter(d => /^\d{4}-\d{2}$/.test(d))
      )
    ).sort((a, b) => b.localeCompare(a));

    const currentMonth = uniqueMonths[0] || '2026-06';
    const previousMonth = uniqueMonths[1] || '2026-05';

    const getMonthLabel = (yearMonth: string) => {
      const [year, month] = yearMonth.split('-');
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${months[parseInt(month, 10) - 1]} ${year}`;
    };

    return {
      currentMonth,
      previousMonth,
      currentMonthLabel: getMonthLabel(currentMonth),
      previousMonthLabel: getMonthLabel(previousMonth)
    };
  }, [transactions]);
};

// ==========================================
// 4. COMPONENTES DE INTERFAZ PREMIUM
// ==========================================


const DashboardView: React.FC = () => {
  const { state, updateLiquidCash, importBackup } = useFinancials();
  const [editingAccount, setEditingAccount] = useState<keyof BankAccounts | null>(null);
  const [tempAmount, setTempAmount] = useState('');
  
  const periods = useDynamicPeriods(state.transactions);

  const analytics = useMemo(() => {
    const totalPortfolioValue = state.assets.reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0);
    const totalLiquidCash = state.accounts.wellsFargo + state.accounts.bofA + state.accounts.marcus + state.accounts.robinhoodCash;
    const netWorth = totalPortfolioValue + totalLiquidCash;

    // Métricas para el mes más reciente de la base de datos
    const monthlyIncome = state.transactions
      .filter(t => t.type === 'INCOME' && t.date.startsWith(periods.currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = state.transactions
      .filter(t => t.type === 'EXPENSE' && t.date.startsWith(periods.currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    return { netWorth, totalPortfolioValue, totalLiquidCash, monthlyIncome, monthlyExpenses, savingsRate };
  }, [state, periods]);

  const handleEditCash = (account: keyof BankAccounts) => {
    setEditingAccount(account);
    setTempAmount(state.accounts[account].toString());
  };

  const saveCashUpdate = (account: keyof BankAccounts) => {
    const value = parseFloat(tempAmount);
    if (!isNaN(value) && value >= 0) {
      updateLiquidCash(account, Number(value.toFixed(2)));
    }
    setEditingAccount(null);
  };

  const handleBackupExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Devmaster_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (payload.accounts && payload.assets) {
          importBackup(payload);
        }
      } catch {
        console.error("Archivo de respaldo inválido");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Panel Integrado de Wealth Engine</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Vigente al 12 de junio, 2026 • Moneda USD</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBackupExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar Backup
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300/20 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" /> Importar Backup
            <input type="file" accept=".json" onChange={handleBackupImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Patrimonio Neto</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white text-left">${analytics.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <span className="text-[10px] text-slate-400 block text-left">Vigencia Actual</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase text-left">Ingresos de {periods.currentMonthLabel}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 text-left">${analytics.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <span className="text-xs text-slate-400 block text-left font-mono">{periods.currentMonthLabel}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase text-left">Gastos de {periods.currentMonthLabel}</span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 text-left">${analytics.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <span className="text-xs text-slate-400 block text-left font-mono">{periods.currentMonthLabel}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase text-left">Tasa de Ahorro</span>
            <PieChart className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 text-left">{analytics.savingsRate.toFixed(1)}%</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2">
            <div className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(analytics.savingsRate, 100)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribución de Cuentas Líquidas - Editable */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Coins className="text-amber-500 w-5 h-5" /> Distribución de Liquidez (Editable)
          </h3>
          <div className="space-y-3 text-left">
            {(['wellsFargo', 'bofA', 'marcus', 'robinhoodCash'] as const).map(acc => (
              <div key={acc} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 group relative">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    {acc === 'wellsFargo' ? 'Wells Fargo' : acc === 'bofA' ? 'BofA' : acc === 'marcus' ? 'Marcus HYSA' : 'Robinhood Power'}
                  </p>
                  {acc === 'marcus' && <p className="text-[10px] text-amber-600 font-bold">3.50% APY</p>}
                  {acc === 'robinhoodCash' && <p className="text-[10px] text-indigo-600 font-bold">3.75% APY</p>}
                </div>
                
                {editingAccount === acc ? (
                  <input
                    type="number"
                    value={tempAmount}
                    onChange={(e) => setTempAmount(e.target.value)}
                    onBlur={() => saveCashUpdate(acc)}
                    onKeyDown={(e) => e.key === 'Enter' && saveCashUpdate(acc)}
                    className="w-24 p-1 text-right text-xs bg-transparent border border-indigo-500 rounded font-bold text-slate-800 dark:text-white focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span onClick={() => handleEditCash(acc)} className="text-md font-bold text-slate-800 dark:text-slate-100 cursor-pointer hover:text-indigo-600 flex items-center gap-1">
                    ${state.accounts[acc].toLocaleString()}
                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reserva y Cobertura de Fondo de Emergencia */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="text-left">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="text-emerald-500 w-5 h-5" /> Escudo Financiero
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tu colchón estratégico para blindar a tu familia en Ohio de contingencias imprevistas sin tocar tu portafolio de inversión.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sueldo Resguardado</span>
                <span className="text-md font-bold text-slate-800 dark:text-white">${state.accounts.marcus.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Meta Estratégica</span>
                <span className="text-md font-bold text-slate-800 dark:text-white">${state.emergencyFundGoal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-50 h-full rounded-full transition-all duration-500"
                style={{ width: `${state.emergencyFundGoal > 0 ? Math.min((state.accounts.marcus / state.emergencyFundGoal) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400">Progreso de Cobertura</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {state.emergencyFundGoal > 0 ? ((state.accounts.marcus / state.emergencyFundGoal) * 100).toFixed(0) : 0}% Cubierto
              </span>
            </div>
          </div>
        </div>

        {/* Distribución Global de Activos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PieChart className="text-indigo-500 w-5 h-5" /> Distribución de Patrimonio
          </h3>
          <div className="flex justify-center py-2">
            <svg width="140" height="140" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="3.2" 
                strokeDasharray={`${analytics.netWorth > 0 ? (analytics.totalPortfolioValue / analytics.netWorth) * 100 : 0} ${analytics.netWorth > 0 ? (1 - (analytics.totalPortfolioValue / analytics.netWorth)) * 100 : 100}`} 
                strokeDashoffset="0" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2" 
                strokeDasharray={`${analytics.netWorth > 0 ? (analytics.totalLiquidCash / analytics.netWorth) * 100 : 0} ${analytics.netWorth > 0 ? (1 - (analytics.totalLiquidCash / analytics.netWorth)) * 100 : 100}`} 
                strokeDashoffset={`-${analytics.netWorth > 0 ? (analytics.totalPortfolioValue / analytics.netWorth) * 100 : 0}`} />
            </svg>
          </div>
          <div className="flex justify-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block"></span>
              <span>Inversiones ({analytics.netWorth > 0 ? ((analytics.totalPortfolioValue / analytics.netWorth) * 100).toFixed(0) : 0}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              <span>Liquidez ({analytics.netWorth > 0 ? ((analytics.totalLiquidCash / analytics.netWorth) * 100).toFixed(0) : 0}%)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- GESTOR DE FLUJO DE CAJA (BUDGET MANAGER) ---

const BudgetManagerView: React.FC = () => {
  const { state, addTransaction, addManyTransactions, deleteTransaction, deleteAllTransactions, transferFunds, setBudgetLimit } = useFinancials();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [category, setCategory] = useState<'Vivienda' | 'Comida' | 'Transporte' | 'Ocio' | 'Inversión' | 'Salario' | 'Otros'>('Comida');

  const [fromAccount, setFromAccount] = useState<keyof BankAccounts>('wellsFargo');
  const [toAccount, setToAccount] = useState<keyof BankAccounts>('marcus');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferStatus, setTransferStatus] = useState<{ status: 'IDLE' | 'SUCCESS' | 'ERROR'; msg: string }>({ status: 'IDLE', msg: '' });

  const periods = useDynamicPeriods(state.transactions);

  // Cálculos de Flujo de Caja dinámicos comparando los 2 meses más recientes disponibles
  const stats = useMemo(() => {
    const curIncome = state.transactions
      .filter(t => t.type === 'INCOME' && t.date.startsWith(periods.currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const curExpenses = state.transactions
      .filter(t => t.type === 'EXPENSE' && t.date.startsWith(periods.currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const prevIncome = state.transactions
      .filter(t => t.type === 'INCOME' && t.date.startsWith(periods.previousMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const prevExpenses = state.transactions
      .filter(t => t.type === 'EXPENSE' && t.date.startsWith(periods.previousMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeDelta = prevIncome > 0 ? ((curIncome - prevIncome) / prevIncome) * 100 : 0;
    const expensesDelta = prevExpenses > 0 ? ((curExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    // Desglose de gastos por categoría para el periodo más reciente
    const categoryTotals = state.transactions
      .filter(t => t.type === 'EXPENSE' && t.date.startsWith(periods.currentMonth))
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const totalCurExpenses = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

    const categoriesDistribution = Object.entries(categoryTotals).map(([cat, val]) => {
      const percentage = totalCurExpenses > 0 ? (val / totalCurExpenses) * 100 : 0;
      return { category: cat, amount: val, percentage };
    }).sort((a, b) => b.amount - a.amount);

    return {
      curIncome,
      curExpenses,
      prevIncome,
      prevExpenses,
      incomeDelta,
      expensesDelta,
      categoriesDistribution
    };
  }, [state.transactions, periods]);

  const handleSubmitTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || parseFloat(amount) <= 0) return;

    addTransaction({
      description,
      amount: parseFloat(amount),
      type,
      category
    });

    setDescription('');
    setAmount('');
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(transferAmount);
    if (!value || value <= 0) return;

    if (fromAccount === toAccount) {
      setTransferStatus({ status: 'ERROR', msg: 'Las cuentas origen y destino deben ser distintas.' });
      return;
    }

    const ok = transferFunds(fromAccount, toAccount, value);
    if (ok) {
      setTransferStatus({ status: 'SUCCESS', msg: `Transferencia de $${value.toLocaleString()} realizada correctamente.` });
      setTransferAmount('');
      setTimeout(() => setTransferStatus({ status: 'IDLE', msg: '' }), 4000);
    } else {
      setTransferStatus({ status: 'ERROR', msg: 'Saldo insuficiente en la cuenta de origen.' });
    }
  };

  // Mapeador de archivos bancarios CSV flexible
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const tempTransactions: Transaction[] = [];

      lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (columns.length < 3) return;

        const rawDate = columns[0]?.trim().replace(/"/g, '') || new Date().toISOString().split('T')[0];
        const rawDesc = columns[1]?.trim().replace(/"/g, '') || 'Carga CSV Bancaria';
        const rawAmount = parseFloat(columns[2]?.trim().replace(/"/g, '').replace('$', '')) || 0;
        const rawType: TransactionType = rawAmount < 0 ? 'EXPENSE' : 'INCOME';
        
        tempTransactions.push({
          id: crypto.randomUUID(),
          description: rawDesc,
          amount: Math.abs(rawAmount),
          type: rawType,
          category: rawType === 'INCOME' ? 'Salario' : 'Otros' as any,
          date: rawDate
        });
      });

      if (tempTransactions.length > 0) {
        addManyTransactions(tempTransactions);
      }
    };
    reader.readAsText(file);
  };

  const budgetPercent = state.monthlyBudgetLimit > 0 ? (stats.curExpenses / state.monthlyBudgetLimit) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Controles de Entrada */}
      <div className="space-y-6">
        
        {/* Registro Transacción */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Añadir Transacción</h3>
            <label className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3 h-3" /> Cargar CSV
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          </div>
          <form onSubmit={handleSubmitTx} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Descripción</label>
              <input 
                type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                placeholder="Ej. Gasolina, Compras Super..." required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo</label>
                <select 
                  value={type} onChange={(e) => {
                    const nextType = e.target.value as TransactionType;
                    setType(nextType);
                    setCategory(nextType === 'INCOME' ? 'Salario' : 'Comida');
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                >
                  <option value="EXPENSE">Gasto</option>
                  <option value="INCOME">Ingreso</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Monto ($)</label>
                <input 
                  type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  placeholder="0.00" required 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría</label>
              <select 
                value={category} onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              >
                {type === 'EXPENSE' ? (
                  <>
                    <option value="Vivienda">Vivienda</option>
                    <option value="Comida">Comida</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Ocio">Ocio</option>
                    <option value="Inversión">Inversión</option>
                    <option value="Otros">Otros</option>
                  </>
                ) : (
                  <>
                    <option value="Salario">Salario</option>
                    <option value="Otros">Otros</option>
                  </>
                )}
              </select>
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm">
              <PlusCircle className="w-4 h-4" /> Registrar Transacción
            </button>
          </form>
        </div>

        {/* Optimización de Intereses - Trasvasar liquidez */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Trasvasar Liquidez</h3>
            <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs text-slate-400">Optimiza tus APYs moviendo los excedentes de Checking (WF/BofA) a Marcus o Robinhood Gold.</p>
          <form onSubmit={handleTransfer} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Origen</label>
                <select 
                  value={fromAccount} onChange={(e) => setFromAccount(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white"
                >
                  <option value="wellsFargo">Wells Fargo</option>
                  <option value="bofA">BofA</option>
                  <option value="marcus">Marcus</option>
                  <option value="robinhoodCash">Robinhood Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Destino</label>
                <select 
                  value={toAccount} onChange={(e) => setToAccount(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white"
                >
                  <option value="marcus">Marcus (3.5%)</option>
                  <option value="robinhoodCash">Robinhood (3.75%)</option>
                  <option value="wellsFargo">Wells Fargo</option>
                  <option value="bofA">BofA</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cantidad a Mover ($)</label>
              <input 
                type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-xs"
                placeholder="0.00" required 
              />
            </div>
            {transferStatus.status !== 'IDLE' && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${transferStatus.status === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'}`}>
                {transferStatus.msg}
              </div>
            )}
            <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors">
              Ejecutar Movimiento
            </button>
          </form>
        </div>

      </div>

      {/* Historial, Gráficos de Flujo y Gráficos por Categoría */}
      <div className="lg:col-span-2 space-y-6 text-left">
        
        {/* Barra de Progreso Límite */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Límite Mensual de Egresos ({periods.currentMonthLabel})</h3>
              <p className="text-xs text-slate-400">Controles preventivos de control de flujo de caja para el mes vigente.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Configurar Techo:</span>
              <input 
                type="number" value={state.monthlyBudgetLimit} onChange={(e) => setBudgetLimit(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold bg-transparent text-slate-800 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Consumido: ${stats.curExpenses.toLocaleString('en-US')}</span>
              <span className="text-slate-400">Límite: ${state.monthlyBudgetLimit.toLocaleString('en-US')}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 90 ? 'bg-rose-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              ></div>
            </div>
          </div>

          {budgetPercent >= 100 && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Has excedido el presupuesto de egresos configurado para este periodo mensual.</span>
            </div>
          )}
        </div>

        {/* Gráfico de Tendencia Histórica e Intermensual SVG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Flujo de Caja Intermensual</h3>
            <p className="text-xs text-slate-400">Análisis comparativo automático de {periods.previousMonthLabel} vs {periods.currentMonthLabel}.</p>
            
            {/* Gráfico de barras SVG */}
            <div className="flex justify-center h-40 items-end gap-6 pt-6 relative border-b border-slate-150 dark:border-slate-800">
              {/* Periodo Anterior */}
              <div className="flex flex-col items-center gap-1.5 w-18">
                <div className="flex gap-1.5 items-end h-28 w-full justify-center">
                  <div className="bg-emerald-500/85 rounded-t w-5 transition-all duration-500" style={{ height: `${Math.min((stats.prevIncome / 5000) * 100, 100)}%` }} title={`Ingreso: $${stats.prevIncome}`}></div>
                  <div className="bg-slate-400 dark:bg-slate-700 rounded-t w-5 transition-all duration-500" style={{ height: `${Math.min((stats.prevExpenses / 5000) * 100, 100)}%` }} title={`Gasto: $${stats.prevExpenses}`}></div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 truncate max-w-full text-center">{periods.previousMonthLabel}</span>
              </div>
              
              {/* Periodo Actual */}
              <div className="flex flex-col items-center gap-1.5 w-18">
                <div className="flex gap-1.5 items-end h-28 w-full justify-center">
                  <div className="bg-emerald-600 rounded-t w-5 transition-all duration-500" style={{ height: `${Math.min((stats.curIncome / 5000) * 100, 100)}%` }} title={`Ingreso: $${stats.curIncome}`}></div>
                  <div className="bg-rose-500 rounded-t w-5 transition-all duration-500" style={{ height: `${Math.min((stats.curExpenses / 5000) * 100, 100)}%` }} title={`Gasto: $${stats.curExpenses}`}></div>
                </div>
                <span className="text-[10px] font-bold text-indigo-500 truncate max-w-full text-center">{periods.currentMonthLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block mb-0.5">Δ Ingresos:</span>
                <span className={stats.incomeDelta >= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                  {stats.incomeDelta >= 0 ? '+' : ''}{stats.incomeDelta.toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] text-slate-400 block mb-0.5">Δ Egresos:</span>
                <span className={stats.expensesDelta <= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                  {stats.expensesDelta >= 0 ? '+' : ''}{stats.expensesDelta.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico de Gastos por Categoría (Sustituto de cada dólar) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">Distribución de Gastos por Categoría</h3>
            <p className="text-xs text-slate-400">Detalle de egresos acumulados para {periods.currentMonthLabel}. <strong className="text-slate-600 dark:text-slate-300">Total Gastado: ${stats.curExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
            
            <div className="space-y-3 pt-1">
              {stats.categoriesDistribution.map((item) => {
                const colorsMap: Record<string, string> = {
                  Vivienda: 'bg-indigo-500',
                  Comida: 'bg-emerald-500',
                  Transporte: 'bg-amber-500',
                  Ocio: 'bg-rose-500',
                  Inversión: 'bg-purple-500',
                  Otros: 'bg-sky-500'
                };
                const colorClass = colorsMap[item.category] || 'bg-slate-500';
                
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.category}</span>
                      <span className="text-slate-400 font-semibold">${item.amount.toLocaleString()} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {stats.categoriesDistribution.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8">Sin gastos registrados en {periods.currentMonthLabel}.</p>
              )}
            </div>
          </div>
        </div>

        {/* Historial Transaccional del Periodo Vigente */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Historial General de Movimientos</h3>
            <button onClick={() => deleteAllTransactions()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 rounded-xl transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Borrar Historial
            </button>
          </div>
          <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-100 dark:divide-slate-800 pr-1">
            {state.transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-3">
                <div className="space-y-0.5 text-left">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{tx.description}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold">{tx.category}</span>
                    <span>{tx.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => deleteTransaction(tx.id)} className="text-slate-400 hover:text-rose-500 transition-colors p-1" aria-label="Eliminar transacción">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {state.transactions.length === 0 && (
              <p className="text-center py-8 text-sm text-slate-400">Sin movimientos registrados.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

// --- PORTAFOLIO DE INVERSIONES (INVESTMENT PORTFOLIO) ---

const InvestmentPortfolioView: React.FC = () => {
  const { state, addAsset, updateAssetPrice, deleteAsset, executeLimitOrder, isLiveFeed, setIsLiveFeed, addToWatchlist, removeFromWatchlist } = useFinancials();

  const [consoleTab, setConsoleTab] = useState<'LIMIT_ORDER' | 'MANUAL_ADD' | 'WATCHLIST'>('LIMIT_ORDER');

  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('STOCKS');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');

  const [targetAsset, setTargetAsset] = useState('VXUS');
  const [limitShares, setLimitShares] = useState('8.70');
  const [limitPrice, setLimitPrice] = useState('57.50');
  const [orderStatus, setOrderStatus] = useState<{ status: 'IDLE' | 'SUCCESS' | 'ERROR'; msg: string }>({ status: 'IDLE', msg: '' });

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // Estados locales para la Watchlist con busqueda / autocompletado automático
  const [watchTicker, setWatchTicker] = useState('');
  const [watchName, setWatchName] = useState('');
  const [watchPrice, setWatchPrice] = useState('');

  // Efecto de autocompletado inteligente para la adición simplificada de la Watchlist
  useEffect(() => {
    const cleanTicker = watchTicker.trim().toUpperCase();
    if (!cleanTicker) {
      setWatchName('');
      setWatchPrice('');
      return;
    }

    // 1. Coincidencia Exacta por Ticker oficial
    if (TICKER_DATABASE[cleanTicker]) {
      setWatchName(TICKER_DATABASE[cleanTicker].name);
      setWatchPrice(TICKER_DATABASE[cleanTicker].price.toString());
      return;
    }
    
    // 2. Búsqueda Bidireccional: Coincidencia por fragmento de Nombre (Ej: "VISA")
    const matchedTicker = Object.keys(TICKER_DATABASE).find(key => 
      TICKER_DATABASE[key].name.toUpperCase().includes(cleanTicker)
    );

    if (matchedTicker) {
      setWatchName(TICKER_DATABASE[matchedTicker].name);
      setWatchPrice(TICKER_DATABASE[matchedTicker].price.toString());
      return;
    }

    // 3. Fallback: Generador pseudo-estable para autocompletar tickers desconocidos
    if (cleanTicker.length >= 2) {
      const generatedPrice = (cleanTicker.charCodeAt(0) * 1.5 + (cleanTicker.charCodeAt(1) || 50) * 0.8).toFixed(2);
      setWatchName(`${cleanTicker} Asset`);
      setWatchPrice(generatedPrice);
    } else {
      setWatchName('');
      setWatchPrice('');
    }
  }, [watchTicker]);

  const summary = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;

    const list = state.assets.map(asset => {
      const cost = asset.quantity * asset.buyPrice;
      const value = asset.quantity * asset.currentPrice;
      const gainLoss = value - cost;
      const percent = asset.buyPrice > 0 ? (gainLoss / cost) * 100 : 0;

      totalCost += cost;
      totalValue += value;

      return { ...asset, cost, value, gainLoss, percent };
    });

    const netGain = totalValue - totalCost;
    const netPercent = totalCost > 0 ? (netGain / totalCost) * 100 : 0;

    return { list, totalCost, totalValue, netGain, netPercent };
  }, [state.assets]);

  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !shares || !price) return;
    addAsset({
      name: assetName.toUpperCase(),
      type: assetType,
      quantity: parseFloat(shares),
      buyPrice: parseFloat(price),
      currentPrice: parseFloat(price),
      prevPrice: parseFloat(price)
    });
    setAssetName('');
    setShares('');
    setPrice('');
    setOrderStatus({
      status: 'SUCCESS',
      msg: `¡Activo ${assetName.toUpperCase()} incorporado manualmente al portafolio de forma exitosa!`
    });
    setTimeout(() => setOrderStatus({ status: 'IDLE', msg: '' }), 4000);
  };

  const handleLaunchLimitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(limitShares);
    const p = parseFloat(limitPrice);
    if (!q || !p) return;

    const success = executeLimitOrder(targetAsset, q, p);
    if (success) {
      setOrderStatus({
        status: 'SUCCESS',
        msg: `¡Orden límite ejecutada con éxito! Compraste ${q} acciones de ${targetAsset} a $${p}.`
      });
      setTimeout(() => setOrderStatus({ status: 'IDLE', msg: '' }), 4000);
    } else {
      setOrderStatus({
        status: 'ERROR',
        msg: `Error: Saldo de efectivo Robinhood insuficiente para completar la orden ($${(q * p).toFixed(2)} requeridos).`
      });
    }
  };

  const handleAddWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchTicker || !watchPrice) return;
    addToWatchlist(watchTicker.toUpperCase(), watchName || watchTicker.toUpperCase(), parseFloat(watchPrice));
    setWatchTicker('');
    setWatchName('');
    setWatchPrice('');
    setOrderStatus({
      status: 'SUCCESS',
      msg: `¡Activo ${watchTicker.toUpperCase()} incorporado exitosamente a tu Watchlist!`
    });
    setTimeout(() => setOrderStatus({ status: 'IDLE', msg: '' }), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* KPIs Portafolio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400 block mb-1">Costo Base Inicial</span>
          <span className="text-xl font-bold text-slate-800 dark:text-white">${summary.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400 block mb-1">Valoración de Mercado</span>
          <span className="text-xl font-bold text-slate-800 dark:text-white">${summary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400 block mb-1">Rendimiento Histórico</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold ${summary.netGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {summary.netGain >= 0 ? '+' : ''}${summary.netGain.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-bold ${summary.netGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ({summary.netPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Consola de Control de Inversiones y Watchlist */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Control del Simulador en Tiempo Real */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">Cotizaciones en Vivo</span>
                <span className="text-[10px] text-slate-400 block">Flujo de ticks cada 3.5s</span>
              </div>
              <button 
                onClick={() => setIsLiveFeed(!isLiveFeed)}
                className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-xs font-bold ${isLiveFeed ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-150 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
              >
                {isLiveFeed ? (
                  <><Pause className="w-3.5 h-3.5" /> Pausar Ticker</>
                ) : (
                  <><Play className="w-3.5 h-3.5 fill-current" /> Activar Ticker</>
                )}
              </button>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold tracking-tight">
              <button 
                onClick={() => { setConsoleTab('LIMIT_ORDER'); setOrderStatus({ status: 'IDLE', msg: '' }); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${consoleTab === 'LIMIT_ORDER' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
              >
                Orden Límite
              </button>
              <button 
                onClick={() => { setConsoleTab('MANUAL_ADD'); setOrderStatus({ status: 'IDLE', msg: '' }); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${consoleTab === 'MANUAL_ADD' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
              >
                Añadir Activo
              </button>
              <button 
                onClick={() => { setConsoleTab('WATCHLIST'); setOrderStatus({ status: 'IDLE', msg: '' }); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${consoleTab === 'WATCHLIST' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
              >
                + Watchlist
              </button>
            </div>

            {consoleTab === 'LIMIT_ORDER' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <UserCheck className="text-indigo-500 w-5 h-5" /> Orden Límite Robinhood
                  </h3>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 px-2 rounded-full font-bold">Gold Mode</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ejecuta las compras de Robinhood Gold (**${state.accounts.robinhoodCash.toLocaleString()}** disponibles rindiendo 3.75%).
                </p>
                <form onSubmit={handleLaunchLimitOrder} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ticker / Activo</label>
                    <input 
                      type="text" value={targetAsset} onChange={(e) => setTargetAsset(e.target.value.toUpperCase())}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Ej. VXUS, O, VOO" required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Acciones</label>
                      <input 
                        type="number" step="any" value={limitShares} onChange={(e) => setLimitShares(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00" required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Precio ($)</label>
                      <input 
                        type="number" step="0.01" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00" required
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-colors shadow-md">
                    Desplegar Orden Límite
                  </button>
                </form>
              </div>
            ) : consoleTab === 'MANUAL_ADD' ? (
              <div className="space-y-3">
                <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Coins className="text-indigo-500 w-5 h-5" /> Añadir Activo Manual
                </h3>
                <form onSubmit={handleAddAssetSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nombre / Ticker</label>
                    <input 
                      type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-xs"
                      placeholder="Ej. SCHD, VTV" required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo de Activo</label>
                    <select 
                      value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white"
                    >
                      <option value="STOCKS">Acciones / ETFs</option>
                      <option value="CRYPTO">Criptomonedas</option>
                      <option value="FIXED_INCOME">Renta Fija / Bonos</option>
                      <option value="CASH">Efectivo Equivalente</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cantidades</label>
                      <input 
                        type="number" step="any" value={shares} onChange={(e) => setShares(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-xs"
                        placeholder="0.00" required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Precio Compra ($)</label>
                      <input 
                        type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-xs"
                        placeholder="0.00" required
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors">
                    Registrar Activo
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Eye className="text-indigo-500 w-5 h-5" /> Agregar a Watchlist
                </h3>
                <form onSubmit={handleAddWatchlist} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ticker</label>
                    <input 
                      type="text" value={watchTicker} onChange={(e) => setWatchTicker(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-xs font-bold uppercase"
                      placeholder="Ej. AMD, INTC..." required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nombre (Autocompletado)</label>
                    <input 
                      type="text" value={watchName} onChange={(e) => setWatchName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-xs"
                      placeholder="Nombre del activo" required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Precio Base ($) (Autocompletado)</label>
                    <input 
                      type="number" step="0.01" value={watchPrice} onChange={(e) => setWatchPrice(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white text-xs"
                      placeholder="100.00" required
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">
                    Añadir a Seguimiento
                  </button>
                </form>
              </div>
            )}
          </div>

          {orderStatus.status !== 'IDLE' && (
            <div className={`p-3 mt-4 rounded-xl text-xs font-medium ${orderStatus.status === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'}`}>
              {orderStatus.msg}
            </div>
          )}
        </div>

        {/* Tabla Detallada Portafolio con Editor de Cotizaciones en Vivo */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-[10px] tracking-wider text-slate-400 uppercase font-bold">
                  <th className="p-4">Activo</th>
                  <th className="p-4 text-right">Cantidades</th>
                  <th className="p-4 text-right">Precio Base</th>
                  <th className="p-4 text-right">Precio Actual (Editar)</th>
                  <th className="p-4 text-right">Valor Mercado</th>
                  <th className="p-4 text-right">Rendimiento</th>
                  <th className="p-4 text-center">Baja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.list.map(a => {
                  const hasPriceChanged = a.prevPrice !== undefined && a.prevPrice !== a.currentPrice;
                  const isUp = hasPriceChanged && a.prevPrice !== undefined && a.currentPrice > a.prevPrice;
                  const isDown = hasPriceChanged && a.prevPrice !== undefined && a.currentPrice < a.prevPrice;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                      <td className="p-4 font-bold text-slate-800 dark:text-white font-sans">
                        <div className="flex flex-col items-start gap-1">
                          <span>{a.name}</span>
                          {/* Yahoo Finance Advanced Interactive Chart Deep-Link */}
                          <a 
                            href={`https://finance.yahoo.com/chart/${a.name.includes('(') ? a.name.match(/\(([^)]+)\)/)?.[1] : a.name.trim().split(' ')[0]}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[9px] bg-indigo-50/80 hover:bg-indigo-600 hover:text-white text-indigo-600 px-1.5 py-0.5 rounded font-mono font-bold uppercase transition-colors"
                            title="Ver Gráfico Avanzado en Yahoo Finance"
                          >
                            Advanced Chart ↗
                          </a>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">{a.quantity.toLocaleString('en-US', { maximumFractionDigits: 6 })}</td>
                      <td className="p-4 text-right">${a.buyPrice.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        {editingAssetId === a.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input 
                              type="number"
                              step="0.01"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-20 p-1 border border-indigo-500 rounded bg-white dark:bg-slate-850 text-slate-800 dark:text-white text-xs text-right focus:outline-none"
                              onBlur={() => {
                                const val = parseFloat(editingPrice);
                                if (!isNaN(val) && val > 0) {
                                  updateAssetPrice(a.id, val);
                                }
                                setEditingAssetId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseFloat(editingPrice);
                                  if (!isNaN(val) && val > 0) {
                                    updateAssetPrice(a.id, val);
                                  }
                                  setEditingAssetId(null);
                                }
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 group cursor-pointer" onClick={() => {
                            setEditingAssetId(a.id);
                            setEditingPrice(a.currentPrice.toString());
                          }}>
                            {/* Micro-animación de Tick en Vivo */}
                            <span className={`flex items-center gap-1 font-mono transition-all duration-500 px-1.5 py-0.5 rounded ${isUp ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : isDown ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10' : ''}`}>
                              {isUp && <span className="text-[10px] animate-bounce">▲</span>}
                              {isDown && <span className="text-[10px] animate-bounce">▼</span>}
                              <span>${a.currentPrice.toFixed(2)}</span>
                            </span>
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-500 p-0.5 transition-all"
                              title="Actualizar precio de mercado"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200">${a.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`p-4 text-right font-bold ${a.gainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {a.gainLoss >= 0 ? '+' : ''}{a.percent.toFixed(1)}%
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => deleteAsset(a.id)} className="text-slate-400 hover:text-rose-500 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Haz clic en el precio actual para editarlo manualmente</span>
            <span>VXUS: Protección Anti-Riesgo País</span>
          </div>
        </div>

      </div>

      {/* Watchlist de Activos del Mercado (Junio 2026) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-left">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Watchlist de Activos de Mercado</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {state.watchlist.map(item => {
            const hasChanged = item.prevPrice !== undefined && item.prevPrice !== item.currentPrice;
            const isUp = hasChanged && item.prevPrice !== undefined && item.currentPrice > item.prevPrice;
            const isDown = hasChanged && item.prevPrice !== undefined && item.currentPrice < item.prevPrice;

            return (
              <div key={item.ticker} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 relative group text-left">
                <button onClick={() => removeFromWatchlist(item.ticker)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.ticker}</span>
                  {/* Yahoo Finance Advanced Interactive Chart Deep-Link */}
                  <a 
                    href={`https://finance.yahoo.com/chart/${item.ticker.includes('(') ? item.ticker.match(/\(([^)]+)\)/)?.[1] : item.ticker.trim().split(' ')[0]}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[8px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600/10 hover:text-indigo-600 text-slate-400 px-1.5 py-0.5 rounded transition-all font-bold font-mono"
                    title="Ver Gráfico Avanzado en Yahoo Finance"
                  >
                    Advanced Chart ↗
                  </a>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate mt-1">{item.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-md font-mono font-bold transition-all duration-500 px-1.5 py-0.5 rounded ${isUp ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : isDown ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10' : 'text-slate-700 dark:text-slate-300'}`}>
                    ${item.currentPrice.toFixed(2)}
                  </span>
                  {isUp && <span className="text-[10px] text-emerald-500">▲</span>}
                  {isDown && <span className="text-[10px] text-rose-500">▼</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

// --- SIMULADOR DE PAYSTUB REAL CARLOS (ADP REPLICA) ---

const PaystubSimulatorView: React.FC = () => {
  const { state } = useFinancials();

  // ADP Paystub Real del 10 de Junio de 2026 de Carlos (Basado en extracto de nómina real de 63 hrs)
  const adpData = {
    regularRate: 46.00,
    regularHours: 40.00,
    regularEarnings: 1840.00,
    doubleTimeRate: 92.00,
    doubleTimeHours: 23.00,
    doubleTimeEarnings: 2116.00,
    grossPay: 3956.00,
    
    // Deducciones de Ley Reales al Centavo
    fedWithholding: 680.86,
    socialSecurity: 245.27,
    medicare: 57.36,
    ohStateTax: 124.04,
    ohExemptions: 3,
    newAlbanyTax: 79.12,
    workAssessment: 118.68,
    totalDeductions: 1305.33,
    netPay: 2650.67,

    // Beneficios pagados por el empleador (Employer Paid Benefits)
    benefits: [
      { name: 'Admin Fund', amount: 8.82, ytd: 36.54 },
      { name: 'Apprentice Fund', amount: 60.48, ytd: 250.56 },
      { name: 'Central College', amount: 6.30, ytd: 26.10 },
      { name: 'H&W Fund', amount: 440.37, ytd: 1824.39 },
      { name: 'Local Labor Mgt', amount: 8.82, ytd: 36.54 },
      { name: 'Nat Elec Fund', amount: 9.45, ytd: 39.15 },
      { name: 'Nat Labor Co-Op', amount: 0.63, ytd: 2.61 },
      { name: 'Natl Ben Fund', amount: 118.68, ytd: 441.18 },
      { name: 'Natl Elec App', amount: 118.68, ytd: 441.18 }
    ]
  };

  return (
    <div className="space-y-6">
      
      {/* Resumen Informativo */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
          <Calculator className="text-indigo-500 w-5 h-5" /> Verificación ADP Earnings Statement
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Historial verificado al periodo finalizado el **07/06/2026** (Fecha de pago: **10/06/2026**). Se detalla tu tarifa base real de **$46.00/hora** con tus 23 horas dobles y deducciones vigentes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Desglose de Retenciones e Impuestos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left">
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">Deducciones de Ley (Statutory)</h4>
          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Federal Income Tax:</span>
              <span className="font-mono font-bold text-rose-600">-$680.86</span>
            </div>
            <div className="flex justify-between">
              <span>Social Security Tax:</span>
              <span className="font-mono font-semibold text-rose-500">-$245.27</span>
            </div>
            <div className="flex justify-between">
              <span>Medicare Tax:</span>
              <span className="font-mono text-rose-500">-$57.36</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span>OH State Income Tax (3 Exemptions):</span>
              <span className="font-mono text-rose-500">-$124.04</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span>New Albany Income Tax (2.0%):</span>
              <span className="font-mono text-rose-500">-$79.12</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 dark:text-white pt-1">
              <span>Total Deducciones Estatutarias:</span>
              <span className="font-mono text-rose-600">-${(adpData.totalDeductions - adpData.workAssessment).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Otras Cuotas</h4>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
              <span>Work Assessment (3.0%):</span>
              <span className="font-mono font-bold text-rose-600">-$118.68</span>
            </div>
          </div>
        </div>

        {/* Réplica del Talón de Pago ADP */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left shadow-sm space-y-4">
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">ELECTRICAL SPECIALISTS INC</h2>
              <p className="text-[10px] text-slate-400">535 REACH BLVD SUITE 400 • COLUMBUS, OH 43215</p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-full">CONCILIADO ADP</span>
              <p className="text-xs text-slate-400 font-mono mt-1">Pay date: 06/10/2026</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Empleado</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">Carlos A Montero</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Estatus W-4</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">Single/Married Filing Separately</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Periodo de Nómina</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">06/01/26 - 06/07/26</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Consejo de Pago</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">Advice #00000248443</span>
            </div>
          </div>

          <div className="border-t border-b border-slate-200 dark:border-slate-800 py-3 text-xs">
            <div className="grid grid-cols-3 font-bold text-slate-400 mb-2 uppercase text-[10px]">
              <span>Earning Description</span>
              <span className="text-right">Rate / Hours</span>
              <span className="text-right">Total Periodo ($)</span>
            </div>
            <div className="space-y-1.5 font-mono text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-3">
                <span>Regular Base Pay</span>
                <span className="text-right">$46.00 / 40.00</span>
                <span className="text-right font-bold">$1,840.00</span>
              </div>
              <div className="grid grid-cols-3">
                <span>Double Time Pay</span>
                <span className="text-right">$92.00 / 23.00</span>
                <span className="text-right font-bold">$2,116.00</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Informational / Employer Paid Benefits</h5>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-500">
                {adpData.benefits.map(b => (
                  <div key={b.name} className="flex justify-between bg-slate-100 dark:bg-slate-800/40 p-1.5 rounded">
                    <span>{b.name}:</span>
                    <span className="font-bold">${b.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-end items-end space-y-2">
              <div className="text-right w-full">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Salario Bruto (Gross):</span>
                <p className="text-xl font-bold font-mono text-slate-800 dark:text-white">${adpData.grossPay.toFixed(2)}</p>
              </div>
              <div className="text-right w-full border-t border-slate-200 dark:border-slate-800 pt-2">
                <span className="text-[10px] text-emerald-500 uppercase font-bold">Depósito Directo Wells Fargo (xxxx9844):</span>
                <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">${adpData.netPay.toFixed(2)}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

// ==========================================
// 5. ESTRUCTURA CENTRAL (APP COMPONENT)
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  return (
    <FinancialProvider>
      <div className={`${darkMode ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'} min-h-screen flex flex-col md:flex-row transition-colors duration-200`}>
        
        {/* Barra Lateral Navegación */}
        <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="space-y-8">
            
            {/* Logo Corporativo */}
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
                <Landmark className="w-5.5 h-5.5" />
              </div>
              <div className="text-left">
                <h1 className="font-bold text-sm tracking-tight leading-none text-slate-800 dark:text-white">DevMaster</h1>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mt-1">Wealth Engine v1.8.1</span>
              </div>
            </div>

            {/* Navegación por Pestañas */}
            <nav className="space-y-1.5" aria-label="Menú Principal">
              <button
                onClick={() => setActiveTab('DASHBOARD')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <LayoutDashboard className="w-5 h-5" /> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('BUDGET')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${activeTab === 'BUDGET' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Wallet className="w-5 h-5" /> Flujo de Caja
              </button>
              <button
                onClick={() => setActiveTab('PORTFOLIO')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${activeTab === 'PORTFOLIO' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Landmark className="w-5 h-5" /> Inversiones
              </button>
              <button
                onClick={() => setActiveTab('PAYSTUB')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${activeTab === 'PAYSTUB' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Calculator className="w-5 h-5" /> Paystub & W-4
              </button>
            </nav>

          </div>

          {/* Pie de Panel & Modo Oscuro & Botón de Pánico Safe Reset */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {/* Componente del Consumidor de Contexto para el Reseteo */}
            <FinancialContext.Consumer>
              {(financials) => (
                <button
                  onClick={() => {
                    if (financials) financials.resetAllData();
                  }}
                  className="w-full text-center text-[10px] font-bold tracking-wider text-rose-500 hover:text-rose-700 bg-rose-500/5 hover:bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 transition-all uppercase"
                >
                  Restablecer Datos Completos
                </button>
              )}
            </FinancialContext.Consumer>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2"
            >
              <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 text-left">
              SISTEMA LOCAL-FIRST • COLUMBUS, OHIO
            </div>
          </div>

        </aside>

        {/* Contenido Dinámico */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          {activeTab === 'DASHBOARD' && <DashboardView />}
          {activeTab === 'BUDGET' && <BudgetManagerView />}
          {activeTab === 'PORTFOLIO' && <InvestmentPortfolioView />}
          {activeTab === 'PAYSTUB' && <PaystubSimulatorView />}
        </main>

      </div>
    </FinancialProvider>
  );
}