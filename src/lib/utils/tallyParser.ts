/**
 * Tally XML Parser
 * Parses standard Tally ERP XML exports and extracts financial data
 */

import {
    TallyLedgerData,
    TallyCompanyInfo,
    TallySalesVoucher,
    TallyPurchaseVoucher,
    TallyInventoryItem,
    TallyBankPayment,
    TallyLedgerSummary,
    TallyGSTDetails,
    TallyImportResult,
} from '@/types/tally';

// Confidence boost for having Tally data
const TALLY_CONFIDENCE_BOOST = 18;

/**
 * Parse Tally XML string and extract all financial data
 */
export function parseTallyXML(xmlString: string): TallyImportResult {
    const warnings: string[] = [];

    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            return {
                success: false,
                error: 'Invalid XML format: ' + parseError.textContent,
                warnings,
            };
        }

        // Extract company info
        const company = extractCompanyInfo(xmlDoc, warnings);

        // Extract vouchers and ledger data
        const salesVouchers = extractSalesVouchers(xmlDoc, warnings);
        const purchaseVouchers = extractPurchaseVouchers(xmlDoc, warnings);
        const inventoryItems = extractInventoryItems(xmlDoc, warnings);
        const bankPayments = extractBankPayments(xmlDoc, warnings);
        const ledgerSummaries = extractLedgerSummaries(xmlDoc, warnings);

        // Calculate totals
        const totalSales = salesVouchers.reduce((sum, v) => sum + v.amount, 0);
        const totalPurchases = purchaseVouchers.reduce((sum, v) => sum + v.amount, 0);
        const totalInventoryValue = inventoryItems.reduce((sum, i) => sum + i.value, 0);
        const totalBankPayments = bankPayments.reduce((sum, p) => sum + p.amount, 0);
        const voucherCount = salesVouchers.length + purchaseVouchers.length + bankPayments.length;

        const data: TallyLedgerData = {
            company,
            salesVouchers,
            purchaseVouchers,
            inventoryItems,
            bankPayments,
            ledgerSummaries,
            metadata: {
                totalSales,
                totalPurchases,
                totalInventoryValue,
                totalBankPayments,
                voucherCount,
                importedAt: new Date().toISOString(),
                confidenceBoost: TALLY_CONFIDENCE_BOOST,
            },
        };

        return { success: true, data, warnings };
    } catch (error: any) {
        return {
            success: false,
            error: 'Failed to parse Tally XML: ' + error.message,
            warnings,
        };
    }
}

/**
 * Extract company information from Tally XML
 */
function extractCompanyInfo(xmlDoc: Document, warnings: string[]): TallyCompanyInfo {
    const companyNode = xmlDoc.querySelector('COMPANY, TALLYMESSAGE > COMPANY');

    const getName = () => {
        return getNodeText(companyNode, 'NAME, COMPANYNAME') ||
            getNodeText(xmlDoc.documentElement, 'COMPANYNAME') ||
            'Unknown Company';
    };

    const financialYear = getNodeText(companyNode, 'FINANCIALYEAR, BOOKSDATE');
    let fyStart = '';
    let fyEnd = '';

    if (financialYear) {
        // Tally typically exports FY as "20230401-20240331" format
        const parts = financialYear.split('-');
        if (parts.length === 2) {
            fyStart = formatTallyDate(parts[0]);
            fyEnd = formatTallyDate(parts[1]);
        }
    }

    return {
        name: getName(),
        gstin: getNodeText(companyNode, 'GSTIN, PARTYGSTIN, GSTREGISTRATIONNUMBER'),
        address: getNodeText(companyNode, 'ADDRESS, MAILINGNAME'),
        state: getNodeText(companyNode, 'STATENAME, STATE'),
        financialYearStart: fyStart || new Date().getFullYear() + '-04-01',
        financialYearEnd: fyEnd || (new Date().getFullYear() + 1) + '-03-31',
        exportDate: new Date().toISOString().split('T')[0],
    };
}

/**
 * Extract sales vouchers (invoices)
 */
function extractSalesVouchers(xmlDoc: Document, warnings: string[]): TallySalesVoucher[] {
    const vouchers: TallySalesVoucher[] = [];
    const voucherNodes = xmlDoc.querySelectorAll('VOUCHER[VCHTYPE="Sales"], VOUCHER[VOUCHERTYPENAME="Sales"]');

    voucherNodes.forEach((node, index) => {
        try {
            const gstDetails = extractGSTDetails(node);
            const amount = parseFloat(getNodeText(node, 'AMOUNT, PARTYLEDGERS.LIST > AMOUNT') || '0');

            vouchers.push({
                voucherNumber: getNodeText(node, 'VOUCHERNUMBER, NUMBER') || `SALE-${index + 1}`,
                date: formatTallyDate(getNodeText(node, 'DATE, VOUCHERDATE') || ''),
                partyName: getNodeText(node, 'PARTYNAME, PARTYLEDGERNAME') || 'Unknown Party',
                ledgerName: getNodeText(node, 'LEDGERNAME, BASICBUYERNAME') || 'Sales',
                amount: Math.abs(amount),
                taxableValue: Math.abs(amount) - gstDetails.totalTax,
                gstDetails,
                invoiceNumber: getNodeText(node, 'INVOICENUMBER, REFERENCENUMBER'),
                narration: getNodeText(node, 'NARRATION'),
            });
        } catch (e: any) {
            warnings.push(`Failed to parse sales voucher at index ${index}: ${e.message}`);
        }
    });

    // Also check for Receipt vouchers that might be sales
    const receiptNodes = xmlDoc.querySelectorAll('VOUCHER[VCHTYPE="Receipt"]');
    receiptNodes.forEach((node) => {
        const ledger = getNodeText(node, 'LEDGERNAME, PARTYLEDGERNAME');
        if (ledger?.toLowerCase().includes('sales') || ledger?.toLowerCase().includes('revenue')) {
            const amount = parseFloat(getNodeText(node, 'AMOUNT') || '0');
            vouchers.push({
                voucherNumber: getNodeText(node, 'VOUCHERNUMBER') || `RCV-${vouchers.length + 1}`,
                date: formatTallyDate(getNodeText(node, 'DATE') || ''),
                partyName: getNodeText(node, 'PARTYNAME') || 'Unknown',
                ledgerName: ledger || 'Sales',
                amount: Math.abs(amount),
                taxableValue: Math.abs(amount),
                gstDetails: extractGSTDetails(node),
            });
        }
    });

    return vouchers;
}

/**
 * Extract purchase vouchers
 */
function extractPurchaseVouchers(xmlDoc: Document, warnings: string[]): TallyPurchaseVoucher[] {
    const vouchers: TallyPurchaseVoucher[] = [];
    const voucherNodes = xmlDoc.querySelectorAll('VOUCHER[VCHTYPE="Purchase"], VOUCHER[VOUCHERTYPENAME="Purchase"]');

    voucherNodes.forEach((node, index) => {
        try {
            const gstDetails = extractGSTDetails(node);
            const amount = parseFloat(getNodeText(node, 'AMOUNT, PARTYLEDGERS.LIST > AMOUNT') || '0');

            vouchers.push({
                voucherNumber: getNodeText(node, 'VOUCHERNUMBER, NUMBER') || `PUR-${index + 1}`,
                date: formatTallyDate(getNodeText(node, 'DATE, VOUCHERDATE') || ''),
                supplierName: getNodeText(node, 'PARTYNAME, PARTYLEDGERNAME') || 'Unknown Supplier',
                ledgerName: getNodeText(node, 'LEDGERNAME') || 'Purchase',
                amount: Math.abs(amount),
                taxableValue: Math.abs(amount) - gstDetails.totalTax,
                gstDetails,
                billNumber: getNodeText(node, 'BILLNUMBER, REFERENCE'),
                narration: getNodeText(node, 'NARRATION'),
            });
        } catch (e: any) {
            warnings.push(`Failed to parse purchase voucher at index ${index}: ${e.message}`);
        }
    });

    return vouchers;
}

/**
 * Extract inventory/stock items
 */
function extractInventoryItems(xmlDoc: Document, warnings: string[]): TallyInventoryItem[] {
    const items: TallyInventoryItem[] = [];
    const itemNodes = xmlDoc.querySelectorAll('STOCKITEM, INVENTORYENTRIES.LIST, ALLINVENTORYENTRIES.LIST');

    itemNodes.forEach((node, index) => {
        try {
            const quantity = parseFloat(getNodeText(node, 'CLOSINGBALANCE, BILLEDQTY, ACTUALQTY') || '0');
            const rate = parseFloat(getNodeText(node, 'RATE, STANDARDCOST') || '0');
            const value = parseFloat(getNodeText(node, 'CLOSINGVALUE, AMOUNT') || '0') || quantity * rate;

            items.push({
                name: getNodeText(node, 'NAME, STOCKITEMNAME') || `Item-${index + 1}`,
                partNumber: getNodeText(node, 'PARTNUMBER, ITEMCODE'),
                group: getNodeText(node, 'PARENT, STOCKGROUP') || 'Default',
                category: getNodeText(node, 'CATEGORY, STOCKCATEGORY'),
                quantity,
                unit: getNodeText(node, 'BASEUNITS, UNIT') || 'Nos',
                rate,
                value,
                closingBalance: quantity,
                openingBalance: parseFloat(getNodeText(node, 'OPENINGBALANCE') || '0'),
                hsnCode: getNodeText(node, 'HSNCODE, GSTDETAILS > HSNCODE'),
            });
        } catch (e: any) {
            warnings.push(`Failed to parse inventory item at index ${index}: ${e.message}`);
        }
    });

    return items;
}

/**
 * Extract bank payment vouchers
 */
function extractBankPayments(xmlDoc: Document, warnings: string[]): TallyBankPayment[] {
    const payments: TallyBankPayment[] = [];
    const paymentNodes = xmlDoc.querySelectorAll(
        'VOUCHER[VCHTYPE="Payment"], VOUCHER[VCHTYPE="Bank Payment"], VOUCHER[VOUCHERTYPENAME="Payment"]'
    );
    const receiptNodes = xmlDoc.querySelectorAll(
        'VOUCHER[VCHTYPE="Receipt"], VOUCHER[VCHTYPE="Bank Receipt"]'
    );

    const processNode = (node: Element, type: 'payment' | 'receipt', index: number) => {
        try {
            const amount = parseFloat(getNodeText(node, 'AMOUNT') || '0');
            const bankLedger = getNodeText(node, 'BANKALLOCATIONS.LIST > LEDGERNAME, LEDGERNAME');

            // Only include if it's a bank transaction
            if (bankLedger?.toLowerCase().includes('bank') ||
                getNodeText(node, 'INSTRUMENTNUMBER, CHEQUENUMBER')) {
                payments.push({
                    voucherNumber: getNodeText(node, 'VOUCHERNUMBER') || `${type.toUpperCase()}-${index + 1}`,
                    date: formatTallyDate(getNodeText(node, 'DATE') || ''),
                    bankName: bankLedger || 'Bank Account',
                    payeeName: getNodeText(node, 'PARTYNAME, PARTYLEDGERNAME') || 'Unknown',
                    amount: Math.abs(amount),
                    transactionType: type,
                    referenceNumber: getNodeText(node, 'REFERENCE, REFERENCENUMBER'),
                    chequeNumber: getNodeText(node, 'INSTRUMENTNUMBER, CHEQUENUMBER'),
                    narration: getNodeText(node, 'NARRATION'),
                    cleared: getNodeText(node, 'ISCLEARED, BANKALLOCATIONS.LIST > BANKERSDATE') === 'Yes',
                });
            }
        } catch (e: any) {
            warnings.push(`Failed to parse ${type} at index ${index}: ${e.message}`);
        }
    };

    paymentNodes.forEach((node, i) => processNode(node, 'payment', i));
    receiptNodes.forEach((node, i) => {
        // Only process as bank receipt if not already captured as sales
        const ledger = getNodeText(node, 'LEDGERNAME');
        if (!ledger?.toLowerCase().includes('sales')) {
            processNode(node, 'receipt', i);
        }
    });

    return payments;
}

/**
 * Extract ledger summaries
 */
function extractLedgerSummaries(xmlDoc: Document, warnings: string[]): TallyLedgerSummary[] {
    const summaries: TallyLedgerSummary[] = [];
    const ledgerNodes = xmlDoc.querySelectorAll('LEDGER, LEDGERENTRIESLIST');

    ledgerNodes.forEach((node) => {
        try {
            const name = getNodeText(node, 'NAME, LEDGERNAME');
            if (name) {
                summaries.push({
                    ledgerName: name,
                    openingBalance: parseFloat(getNodeText(node, 'OPENINGBALANCE') || '0'),
                    closingBalance: parseFloat(getNodeText(node, 'CLOSINGBALANCE') || '0'),
                    debitTotal: parseFloat(getNodeText(node, 'DEBITTOTAL') || '0'),
                    creditTotal: parseFloat(getNodeText(node, 'CREDITTOTAL') || '0'),
                    group: getNodeText(node, 'PARENT, GROUP') || 'Unknown',
                });
            }
        } catch (e) {
            // Skip invalid ledgers silently
        }
    });

    return summaries;
}

/**
 * Extract GST details from a voucher node
 */
function extractGSTDetails(node: Element): TallyGSTDetails {
    const gstNode = node.querySelector('GSTDETAILS, LEDGERENTRIESLIST');

    const cgst = parseFloat(getNodeText(gstNode || node, 'CGSTAMOUNT, CGST') || '0');
    const sgst = parseFloat(getNodeText(gstNode || node, 'SGSTAMOUNT, SGST') || '0');
    const igst = parseFloat(getNodeText(gstNode || node, 'IGSTAMOUNT, IGST') || '0');
    const cess = parseFloat(getNodeText(gstNode || node, 'CESSAMOUNT, CESS') || '0');
    const taxRate = parseFloat(getNodeText(gstNode || node, 'GSTRATE, TAXRATE') || '0');

    return {
        gstin: getNodeText(gstNode || node, 'PARTYGSTIN, GSTIN'),
        taxRate,
        cgst: Math.abs(cgst),
        sgst: Math.abs(sgst),
        igst: Math.abs(igst),
        cess: Math.abs(cess),
        totalTax: Math.abs(cgst) + Math.abs(sgst) + Math.abs(igst) + Math.abs(cess),
        placeOfSupply: getNodeText(gstNode || node, 'PLACEOFSUPPLY'),
        reverseCharge: getNodeText(gstNode || node, 'ISREVERSECHARGE') === 'Yes',
    };
}

/**
 * Helper: Get text content from first matching selector
 */
function getNodeText(parent: Element | Document | null, selectors: string): string | undefined {
    if (!parent) return undefined;

    const selectorList = selectors.split(',').map((s) => s.trim());
    for (const selector of selectorList) {
        try {
            const node = parent.querySelector(selector);
            if (node?.textContent) {
                return node.textContent.trim();
            }
        } catch {
            // Invalid selector, try next
        }
    }
    return undefined;
}

/**
 * Helper: Format Tally date (YYYYMMDD) to ISO date
 */
function formatTallyDate(tallyDate: string): string {
    if (!tallyDate) return new Date().toISOString().split('T')[0];

    // Remove any non-numeric characters
    const cleaned = tallyDate.replace(/\D/g, '');

    if (cleaned.length === 8) {
        // YYYYMMDD format
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }

    // Try to parse as regular date
    const parsed = new Date(tallyDate);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
}

/**
 * Get summary statistics for display
 */
export function getTallySummary(data: TallyLedgerData): string {
    const { metadata, salesVouchers, purchaseVouchers, inventoryItems, bankPayments } = data;

    return `
📊 **Tally Import Summary**
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Company: ${data.company.name}
📅 FY: ${data.company.financialYearStart} to ${data.company.financialYearEnd}

💰 **Financials:**
• Total Sales: ₹${metadata.totalSales.toLocaleString('en-IN')}
• Total Purchases: ₹${metadata.totalPurchases.toLocaleString('en-IN')}
• Inventory Value: ₹${metadata.totalInventoryValue.toLocaleString('en-IN')}
• Bank Transactions: ₹${metadata.totalBankPayments.toLocaleString('en-IN')}

📦 **Records Imported:**
• Sales Vouchers: ${salesVouchers.length}
• Purchase Vouchers: ${purchaseVouchers.length}
• Inventory Items: ${inventoryItems.length}
• Bank Payments: ${bankPayments.length}

✅ **Confidence Boost: +${metadata.confidenceBoost}%**
━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
}
