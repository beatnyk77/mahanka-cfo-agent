import { NextResponse } from 'next/server';
import { graph } from '@/lib/agents/graph';
import { HumanMessage } from '@langchain/core/messages';

export async function POST(request: Request) {
    try {
        const { message, history } = await request.json();

        const result = await graph.invoke({
            messages: [
                ...history.map((h: any) => h.role === 'user' ? new HumanMessage(h.content) : h.content),
                new HumanMessage(message)
            ]
        });

        const lastMessage = result.messages[result.messages.length - 1];

        return NextResponse.json({
            role: 'assistant',
            content: lastMessage.content,
            // You could also return intermediate tool calls if needed for the UI
        });
    } catch (error: any) {
        console.error('Agent chat error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
