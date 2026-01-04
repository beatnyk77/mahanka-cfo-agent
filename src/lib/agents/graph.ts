import { ChatAnthropic } from '@langchain/anthropic';
import { StateGraph, MessagesAnnotation, MemorySaver } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from './tools';

const checkpointer = new MemorySaver();

// Specialist Nodes
async function orchestratorNode(state: typeof MessagesAnnotation.State) {
    const model = new ChatAnthropic({
        modelName: 'claude-3-5-sonnet-20240620',
        apiKey: process.env.ANTHROPIC_API_KEY,
    }).bindTools(tools);

    const response = await model.invoke([
        { role: 'system', content: 'You are the Mahanka CFO Orchestrator. Plan tasks and use specialists for reconciliation, economics, inventory, and forecasting.' },
        ...state.messages
    ]);
    return { messages: [response] };
}

// Define the function that determines whether to continue or not
function shouldContinue(state: typeof MessagesAnnotation.State) {
    const { messages } = state;
    const lastMessage = (messages[messages.length - 1] as any);

    // Check if the last message has tool calls
    if (lastMessage.tool_calls?.length > 0) {
        // Human-in-the-loop: interrupt before sending alerts
        const hasAlertTool = lastMessage.tool_calls.some((tc: any) => tc.name === 'send_whatsapp_alert');
        if (hasAlertTool) {
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

