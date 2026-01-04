export interface FinancialMetric {
  date: string;
  value: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface Revenue extends FinancialMetric {
  source: string; // e.g., 'Shopify', 'Amazon', 'Direct'
  category: string;
}

export interface COGS extends FinancialMetric {
  productId: string;
  components: {
    manufacturing: number;
    shipping: number;
    packaging: number;
    duty?: number;
  };
}

export interface Inventory {
  productId: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  reorderPoint: number;
  value: number;
  lastUpdated: string;
}

export interface GST {
  period: string;
  inputTaxCredit: number;
  outputTaxLiability: number;
  netPayable: number;
  status: 'pending' | 'filed' | 'paid';
}

export interface Cashflow {
  period: string;
  inflow: number;
  outflow: number;
  netCashflow: number;
  openingBalance: number;
  closingBalance: number;
}

export interface UnifiedFinancialState {
  revenue: Revenue[];
  cogs: COGS[];
  inventory: Inventory[];
  gst: GST[];
  cashflow: Cashflow[];
}
