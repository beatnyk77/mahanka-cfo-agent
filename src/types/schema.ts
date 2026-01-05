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
    id: string;
    month: string;
    inflow: number;
    outflow: number;
    net: number;
}

export interface GSTCompliance {
    month: string;
    gst1_draft: any;
    gst3b_draft: any;
    tds_summary: {
        category: string;
        amount: number;
        rate: number;
    }[];
    status: 'draft' | 'filed';
}

export interface BudgetForecast {
    period: string;
    revenue_target: number;
    expense_budget: number;
    growth_lever: 'aggressive' | 'steady' | 'conservative';
    projected_burn: number;
}

export interface FundraisingPrep {
    stage: 'pre-seed' | 'seed' | 'series-a';
    valuation_ask: number;
    milestones: string[];
    capital_allocation: {
        department: string;
        percentage: number;
    }[];
    document_status: {
        deck: boolean;
        data_room: boolean;
    };
}

export interface UnifiedFinancialState {
  revenue: Revenue[];
  cogs: COGS[];
  inventory: Inventory[];
  gst: GST[];
  cashflow: Cashflow[];
}
