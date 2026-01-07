/**
 * Tally XML Export Types
 * TypeScript interfaces for parsing Tally ERP ledger exports
 */

export interface TallySalesVoucher {
    voucherNumber: string;
    date: string;
    partyName: string;
    ledgerName: string;
    amount: number;
    taxableValue: number;
    gstDetails: TallyGSTDetails;
    invoiceNumber?: string;
    narration?: string;
}

export interface TallyPurchaseVoucher {
    voucherNumber: string;
    date: string;
    supplierName: string;
    ledgerName: string;
    amount: number;
    taxableValue: number;
    gstDetails: TallyGSTDetails;
    billNumber?: string;
    narration?: string;
}

export interface TallyInventoryItem {
    name: string;
    partNumber?: string;
    group: string;
    category?: string;
    quantity: number;
    unit: string;
    rate: number;
    value: number;
    closingBalance: number;
    openingBalance?: number;
    hsnCode?: string;
}

export interface TallyGSTDetails {
    gstin?: string;
    taxRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalTax: number;
    placeOfSupply?: string;
    reverseCharge: boolean;
}

export interface TallyBankPayment {
    voucherNumber: string;
    date: string;
    bankName: string;
    payeeName: string;
    amount: number;
    transactionType: 'payment' | 'receipt';
    referenceNumber?: string;
    chequeNumber?: string;
    narration?: string;
    cleared: boolean;
}

export interface TallyLedgerSummary {
    ledgerName: string;
    openingBalance: number;
    closingBalance: number;
    debitTotal: number;
    creditTotal: number;
    group: string;
}

export interface TallyCompanyInfo {
    name: string;
    gstin?: string;
    address?: string;
    state?: string;
    financialYearStart: string;
    financialYearEnd: string;
    exportDate: string;
}

export interface TallyLedgerData {
    company: TallyCompanyInfo;
    salesVouchers: TallySalesVoucher[];
    purchaseVouchers: TallyPurchaseVoucher[];
    inventoryItems: TallyInventoryItem[];
    bankPayments: TallyBankPayment[];
    ledgerSummaries: TallyLedgerSummary[];
    metadata: {
        totalSales: number;
        totalPurchases: number;
        totalInventoryValue: number;
        totalBankPayments: number;
        voucherCount: number;
        importedAt: string;
        confidenceBoost: number; // +18% for Tally data
    };
}

export interface TallyImportResult {
    success: boolean;
    data?: TallyLedgerData;
    error?: string;
    warnings: string[];
}
