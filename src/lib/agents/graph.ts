import { ChatAnthropic } from '@langchain/anthropic';
import { StateGraph, MessagesAnnotation, MemorySaver } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from './tools';
import { getUserMemory } from '../memory';

const checkpointer = new MemorySaver();

async function orchestratorNode(state: typeof MessagesAnnotation.State, config?: any) {
    const userId = config?.configurable?.user_id || 'default_user';

    // Auth Guard Placeholder
    if (!userId) throw new Error('Unauthorized: No user session found.');

    const memory = await getUserMemory(userId);

    const model = new ChatAnthropic({
        modelName: 'claude-3-5-sonnet-20240620',
        apiKey: process.env.ANTHROPIC_API_KEY,
    }).bindTools(tools);

    const context = memory.last_actions.length > 0
        ? `Agent Memory: Previously, we ${memory.last_actions.slice(-3).join(', ')}. Known Risks: ${memory.known_risks.join(', ') || 'None identified'}.`
        : 'Agent Memory: No prior history found for this user.';

    const response = await model.invoke([
        {
            role: 'system',
            content: `You are the Mahanka CFO Orchestrator (v1.5). 
            ${context}
            
            Specialists:
            1. Compliance Agent (GST/TDS)
            2. Projection Agent (Budget/P&L)
            3. Risk Agent (Fundraising/Inventory)
            4. Margin Engine (Unit Economics)
            
            Your output MUST START with a bracketed Confidence Score header:
            [CONFIDENCE: XX% | COMPLETENESS: YY% | ISSUES: issue1, issue2]
            
            Followed by your "Real Talk" analysis. Emphasize "Human-in-the-loop" for all sensitive actions.
            Internal Naming: Close Engine (Core), Risk Monitor (Inventory), Valuation Engine (Fundraising).`
        },
        ...state.messages
    ]);

    // Parse Confidence/Completeness for Ledger
    const headerMatch = response.content.toString().match(/\[CONFIDENCE: (.*?) | COMPLETENESS: (.*?) | ISSUES: (.*?)\]/);
    const conf = headerMatch ? headerMatch[1] : '85%';

    // Persist to Audit Ledger & Memory
    const { addActionToMemory, logAgentAction } = await import('../memory');
    const actionSummary = response.content.toString().slice(0, 100).replace(/\[.*?\]/, '').trim();

    await addActionToMemory(userId, actionSummary);
    await logAgentAction(userId, 'Orchestrator Analysis', 'ChatAnthropic', state.messages[state.messages.length - 1], response.content, conf);

    return { messages: [response] };
}

// Define the function that determines whether to continue or not
function shouldContinue(state: typeof MessagesAnnotation.State) {
    const { messages } = state;
    const lastMessage = (messages[messages.length - 1] as any);

    // Check if the last message has tool calls
    if (lastMessage.tool_calls?.length > 0) {
        // Human-in-the-loop: interrupt before sensitive actions
        const interruptTools = ['send_whatsapp_alert', 'generate_gst_draft'];
        const needsInterrupt = lastMessage.tool_calls.some((tc: any) => interruptTools.includes(tc.name));

        if (needsInterrupt) {
            return 'interrupt';
        }
        return 'tools';
    }
    return '__end__';
}

// Define the graph
const workflow = new StateGraph(MessagesAnnotation)
    .addNode('orchestrator', orchestratorNode)
    .addNode('tools', new ToolNode(tools))
    .addEdge('__start__', 'orchestrator')
    .addConditionalEdges('orchestrator', (state) => {
        const route = shouldContinue(state);
        if (route === 'interrupt') return 'tools'; // In a real setup, compile() handles interrupts
        return route;
    })
    .addEdge('tools', 'orchestrator');

// Compile with checkpointer and interrupt configuration
export const graph = workflow.compile({
    checkpointer,
    interruptBefore: ['tools'], // Actually we want to interrupt ONLY if it's the alert tool
});

// For simplicity in this MVP, we'll use a wrapper that handles the interrupt logic
// specifically for the whatsapp tool if needed, or broad interruptBefore tools.
// Note: LangGraph JS handles broad interrupts on nodes.

