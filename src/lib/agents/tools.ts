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
        // Placeholder for WhatsApp API integration (e.g., Twilio or 360dialog)
        console.log(`[WhatsApp Alert] Priority: ${priority} | Message: ${message}`);
        return {
            success: true,
            status: 'queued',
            message: 'Alert sent via WhatsApp routing service.'
        };
    },
    {
        name: 'send_whatsapp_alert',
        description: 'Sends high-priority alert (Risk Monitor). Human-in-the-loop required.',
        schema: z.object({
            message: z.string().describe('The alert message to send'),
            priority: z.enum(['low', 'medium', 'high']).describe('Priority level of the alert'),
        }),
    }
);

export const tools = [
    deadStockOracleTool,
    tariffForecasterTool,
    unitEconomicsTool,
    generatePDFReportTool,
    sendWhatsAppAlertTool
];
