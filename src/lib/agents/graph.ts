import { ChatAnthropic } from '@langchain/anthropic';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { tools } from './tools';

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
    const model = new ChatAnthropic({
        modelName: 'claude-3-5-sonnet-20240620',
        apiKey: process.env.ANTHROPIC_API_KEY,
    }).bindTools(tools);

    const response = await model.invoke(state.messages);
    // We return an object with a messages key, which will be merged into the existing state
    return { messages: [response] };
}

// Define the function that determines whether to continue or not
function shouldContinue(state: typeof MessagesAnnotation.State) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.additional_kwargs.tool_calls) {
        return 'tools';
    }
    // Otherwise, we stop (reply to the user)
    return '__end__';
}

// Define the graph
const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addNode('tools', new ToolNode(tools))
    .addEdge('__start__', 'agent')
    .addConditionalEdges('agent', shouldContinue)
    .addEdge('tools', 'agent');

// Finally, we compile it!
export const graph = workflow.compile();
