import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { price, cogs, shipping, returnsRate } = body;

        // Simplified Unit Economics Calculation
        const netRevenue = price * (1 - returnsRate);
        const grossMargin = netRevenue - cogs - shipping;
        const contributionMargin = grossMargin / netRevenue;

        const data = {
            netRevenue,
            grossMargin,
            contributionMargin,
            breakEvenUnits: Math.ceil(10000 / grossMargin), // Mock fixed cost of 10000
        };

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
