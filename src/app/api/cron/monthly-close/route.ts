import { NextResponse } from 'next/server';
import { graph } from '@/lib/agents/graph';
import { HumanMessage } from '@langchain/core/messages';

export async function GET(request: Request) {
    // Verifying cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Execute a standard "Month-end close" task
        const result = await graph.invoke({
            messages: [
                new HumanMessage("Run automated month-end close: Reconcile GST, analyze unit economics for top products, and predict dead stock.")
            ]
        }, {
            configurable: { thread_id: 'cron-monthly-close' }
        });

        console.log('Cron Job executed successfully');

        return NextResponse.json({
            success: true,
            message: 'Monthly close agent task triggered.',
            details: result.messages[result.messages.length - 1].content
        });
    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
