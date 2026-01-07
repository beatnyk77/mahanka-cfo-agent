import { NextResponse } from 'next/server';
import { parseTallyXML, getTallySummary } from '@/lib/utils/tallyParser';
import { logAgentAction } from '@/lib/memory';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const xmlString = formData.get('xmlString') as string | null;

        let xmlContent: string;

        if (file) {
            xmlContent = await file.text();
        } else if (xmlString) {
            xmlContent = xmlString;
        } else {
            return NextResponse.json(
                { error: 'No XML file or content provided' },
                { status: 400 }
            );
        }

        // Validate it looks like Tally XML
        if (!xmlContent.includes('TALLYMESSAGE') &&
            !xmlContent.includes('VOUCHER') &&
            !xmlContent.includes('ENVELOPE')) {
            return NextResponse.json(
                { error: 'Invalid file format. Please upload a Tally XML export.' },
                { status: 400 }
            );
        }

        // Parse the XML
        const result = parseTallyXML(xmlContent);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error, warnings: result.warnings },
                { status: 422 }
            );
        }

        // Log to agent ledger
        const userId = 'default_user'; // In production, get from auth
        await logAgentAction(
            userId,
            'Tally XML Import',
            'tally_ledger_import',
            { fileName: file?.name || 'direct_input', size: xmlContent.length },
            {
                voucherCount: result.data?.metadata.voucherCount,
                totalSales: result.data?.metadata.totalSales,
                totalPurchases: result.data?.metadata.totalPurchases,
            },
            `+${result.data?.metadata.confidenceBoost}% boost`
        );

        // Generate summary for display
        const summary = result.data ? getTallySummary(result.data) : '';

        return NextResponse.json({
            success: true,
            data: result.data,
            summary,
            warnings: result.warnings,
            confidenceBoost: result.data?.metadata.confidenceBoost || 18,
            message: 'Tally data imported successfully. Confidence boosted by 18%.',
        });
    } catch (error: any) {
        console.error('Tally import error:', error);
        return NextResponse.json(
            { error: 'Failed to process Tally XML: ' + error.message },
            { status: 500 }
        );
    }
}
