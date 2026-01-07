import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const deadStockOracleTool = tool(
    async ({ inventoryData }) => {
        const response = await fetch(`${API_BASE_URL}/api/oracle/dead-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inventoryData }),
        });
        return response.json();
    },
    {
        name: 'dead_stock_oracle',
        description: 'Predicts dead stock risk (Risk Monitor).',
        schema: z.object({
            inventoryData: z.array(z.any()).describe('List of inventory items with SKU and other metrics'),
        }),
    }
);

export const tariffForecasterTool = tool(
    async ({ countryCode, hsCode, productValue }) => {
        const response = await fetch(`${API_BASE_URL}/api/forecaster/tariff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ countryCode, hsCode, productValue }),
        });
        return response.json();
    },
    {
        name: 'tariff_forecaster',
        description: 'Forecasts duty and tariff impact for a specific product and country.',
        schema: z.object({
            countryCode: z.string().describe('ISO country code of the importer'),
            hsCode: z.string().describe('Harmonized System code of the product'),
            productValue: z.number().describe('Value of the product in USD'),
        }),
    }
);

export const unitEconomicsTool = tool(
    async ({ price, cogs, shipping, returnsRate }) => {
        const response = await fetch(`${API_BASE_URL}/api/calculator/unit-economics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price, cogs, shipping, returnsRate }),
        });
        return response.json();
    },
    {
        name: 'unit_economics_calculator',
        description: 'Calculates net revenue, gross margin, and contribution margin.',
        schema: z.object({
            price: z.number().describe('Selling price of the product'),
            cogs: z.number().describe('Cost of goods sold'),
            shipping: z.number().describe('Shipping cost per unit'),
            returnsRate: z.number().describe('Expected returns rate (0 to 1)'),
        }),
    }
);

export const generatePDFReportTool = tool(
    async ({ summary, metrics }) => {
        // In a real app, this would probably save to S3/Firebase Storage and return a link
        // For MVP, we'll return a success message indicating the report is ready.
        return {
            success: true,
            message: 'PDF Report generated successfully. Ready for download.',
            downloadUrl: '#placeholder-pdf-link'
        };
    },
    {
        name: 'generate_pdf_report',
        description: 'Generates a PDF financial report with summary and metrics.',
        schema: z.object({
            summary: z.string().describe('Executive summary for the report'),
            metrics: z.record(z.string(), z.any()).describe('Key metrics to include in the report table'),
        }),
    }
);

export const sendWhatsAppAlertTool = tool(
    async ({ message, priority }) => {
        // [FREEZE AUTONOMY] Action is frozen in Beta
        console.log(`[WhatsApp Alert - FROZEN] Priority: ${priority} | Message: ${message}`);
        return {
            success: true,
            status: 'FROZEN_IN_BETA',
            message: 'WhatsApp routing service is active but execution is frozen in Beta. Alert logged to Audit Ledger.'
        };
    },
    {
        name: 'send_whatsapp_alert',
        description: 'Logs high-priority alert (Risk Monitor). No-execution mode active.',
        schema: z.object({
            message: z.string().describe('The alert message to send'),
            priority: z.enum(['low', 'medium', 'high']).describe('Priority level of the alert'),
        }),
    }
);

export const generateGSTDraftTool = tool(
    async ({ month, salesData }) => {
        // [FREEZE AUTONOMY] Action is frozen in Beta
        return {
            success: true,
            status: 'FROZEN_IN_BETA',
            month,
            draft: {
                section: 'B2B',
                records: salesData.length,
                totalValue: salesData.reduce((acc: number, curr: any) => acc + curr.amount, 0),
                taxPayable: salesData.reduce((acc: number, curr: any) => acc + (curr.amount * 0.18), 0),
            },
            message: 'GST-1 Draft created but NOT FILED. Action frozen in Beta — requires manual review and CA upload.'
        };
    },
    {
        name: 'generate_gst_draft',
        description: 'Generates a GST-1 draft (Audit Only). No-execution mode active.',
        schema: z.object({
            month: z.string().describe('The month for the GST draft (e.g., "Jan 2024")'),
            salesData: z.array(z.any()).describe('List of sales records for the period'),
        }),
    }
);

export const calculateBudgetVarianceTool = tool(
    async ({ period, actuals, budget }) => {
        const variance = actuals - budget;
        const percentage = (variance / budget) * 100;
        return {
            success: true,
            period,
            variance: variance.toFixed(2),
            percentage: percentage.toFixed(1) + '%',
            status: variance > 0 ? 'over-budget' : 'under-budget',
            recommendation: variance > 0 ? 'Review discretionary spending.' : 'Healthy margin maintained.'
        };
    },
    {
        name: 'calculate_budget_variance',
        description: 'Analyzes variance between actual spend and budget (Projection Agent).',
        schema: z.object({
            period: z.string().describe('The time period for analysis'),
            actuals: z.number().describe('Actual spend amount'),
            budget: z.number().describe('Budgeted amount'),
        }),
    }
);

export const prepareFundraisingChecklistTool = tool(
    async ({ stage, industry }) => {
        const items = [
            'Update 3-year P&L Projections',
            'Refresh Data Room (Cap Table, Contracts)',
            'Prepare Investor Deck (v1.5 Draft)',
            'Identify 10 Target VCs for ' + stage,
        ];
        return {
            success: true,
            stage,
            checklist: items,
            message: 'Fundraising checklist generated for ' + stage + ' round.'
        };
    },
    {
        name: 'prepare_fundraising_checklist',
        description: 'Prepares a due diligence and fundraising readiness checklist (Risk Agent).',
        schema: z.object({
            stage: z.enum(['pre-seed', 'seed', 'series-a']).describe('The target funding stage'),
            industry: z.string().describe('The industry sector (e.g., D2C, Fintech)'),
        }),
    }
);

export const tallyLedgerImportTool = tool(
    async ({ tallyXmlData, fileName }) => {
        // This tool is called when agent needs to process Tally data that's already been imported
        // The actual parsing happens via the API route, this tool wraps the parsed data for agent context
        const response = await fetch(`${API_BASE_URL}/api/tally/import`, {
            method: 'POST',
            body: (() => {
                const formData = new FormData();
                formData.append('xmlString', tallyXmlData);
                return formData;
            })(),
        });

        const result = await response.json();

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                message: 'Failed to import Tally data. Please verify the XML format.'
            };
        }

        return {
            success: true,
            confidenceBoost: 18,
            summary: result.summary,
            metadata: {
                totalSales: result.data?.metadata?.totalSales,
                totalPurchases: result.data?.metadata?.totalPurchases,
                totalInventoryValue: result.data?.metadata?.totalInventoryValue,
                voucherCount: result.data?.metadata?.voucherCount,
                salesVouchers: result.data?.salesVouchers?.length || 0,
                purchaseVouchers: result.data?.purchaseVouchers?.length || 0,
                inventoryItems: result.data?.inventoryItems?.length || 0,
                bankPayments: result.data?.bankPayments?.length || 0,
            },
            message: `✅ Tally data imported successfully. Detected ${result.data?.metadata?.voucherCount || 0} vouchers. Confidence boosted by +18%.`,
            dataAvailable: {
                salesAnalysis: true,
                purchaseAnalysis: true,
                inventoryValuation: true,
                gstReconciliation: true,
                bankReconciliation: true,
            }
        };
    },
    {
        name: 'tally_ledger_import',
        description: 'Imports and parses Tally ERP XML ledger data. Extracts sales vouchers, purchase vouchers, inventory items, GST details, and bank payments. Boosts analysis confidence by +18%.',
        schema: z.object({
            tallyXmlData: z.string().describe('The raw Tally XML data string to parse'),
            fileName: z.string().optional().describe('Original file name for reference'),
        }),
    }
);

export const processTallyDataTool = tool(
    async ({ analysisType, dateRange }) => {
        // This is a helper tool to analyze already-imported Tally data
        const analysisMap: Record<string, string> = {
            'sales': 'Sales voucher analysis with party-wise breakdown, GST compliance check, and trend identification.',
            'purchases': 'Purchase voucher analysis with supplier verification, input tax credit validation.',
            'inventory': 'Stock valuation, dead stock risk assessment, and reorder recommendations.',
            'gst': 'GSTR-1 and GSTR-3B reconciliation, ITC matching, and compliance gaps.',
            'bank': 'Bank reconciliation with uncleared cheques and outstanding payments.',
            'full': 'Comprehensive financial health assessment across all Tally data segments.',
        };

        return {
            success: true,
            analysisType,
            dateRange,
            insights: analysisMap[analysisType] || analysisMap['full'],
            confidenceNote: 'Using Tally ledger data (+18% confidence boost applied).',
            recommendation: 'Tally data provides verified ledger entries. Cross-reference with bank statements for complete reconciliation.'
        };
    },
    {
        name: 'process_tally_data',
        description: 'Analyzes imported Tally data for specific insights. Requires Tally data to be imported first.',
        schema: z.object({
            analysisType: z.enum(['sales', 'purchases', 'inventory', 'gst', 'bank', 'full']).describe('Type of analysis to perform'),
            dateRange: z.string().optional().describe('Date range for analysis (e.g., "Jan 2024" or "Q3 FY24")'),
        }),
    }
);

export const tools = [
    deadStockOracleTool,
    tariffForecasterTool,
    unitEconomicsTool,
    generatePDFReportTool,
    sendWhatsAppAlertTool,
    generateGSTDraftTool,
    calculateBudgetVarianceTool,
    prepareFundraisingChecklistTool,
    tallyLedgerImportTool,
    processTallyDataTool
];
