require('dotenv').config();
const mongoose = require('mongoose');
const Chat = require('./models/chat');
const express = require('express');

const http = require('http');
const WebSocket = require('ws');
const { ChatOpenAI } = require("@langchain/openai");
const { ConversationChain } = require("langchain/chains");
const { BufferMemory } = require("langchain/memory");
const { ChatPromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate, SystemMessagePromptTemplate } = require("@langchain/core/prompts");
const cors = require('cors');
const UserCounter = require('./models/userCounter');
const AgentCounter = require('./models/agentCounter');
const errorHandler = require('./errorHandler');


errorHandler.initialize().catch(console.error);


mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


app.use(express.static('public'));

app.get('/agent', (req, res) => {
    res.sendFile(__dirname + '/public/agent.html');
});


app.use(cors()); 
app.get('/chat-history/:userId', async (req, res) => {
    try {
        const activeChat = await Chat.findOne({ 
            userId: req.params.userId,
            status: { $in: ['waiting', 'waiting_for_agent', 'active', 'bot'] } 
        }).sort({ startedAt: -1 }); 
        
        if (!activeChat) {
            return res.json([]);
        }
        
        res.json(activeChat.messages);
    } catch (error) {
        console.error('Error retrieving chat history:', error);
        res.status(500).json({ error: 'Could not retrieve chat history' });
    }
});

const systemMessage = `
You are a customer service representative chatbot for OneSingleView, a specialized software solution provider for retail and restaurant businesses.

Key information about OneSingleView:
- Primary Focus: POS (Point of Sale) data integration and management
- Target Customers: Retail stores and restaurants with multiple locations or POS systems
- Key Value Proposition: Unified view of sales data across all locations and POS systems

Provide helpful information about OneSingleView's POS integration services. Try solving their problems first and if that doesnt work then direct users to human agents for detailed implementation discussions.
Ask for error codes if they have a problem regarding transactions.
Give very short and concise responses.
`;

const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.7,
    streaming: true
});

const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(systemMessage),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}")
]);

const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "history"
});

const chain = new ConversationChain({
    llm: chatModel,
    memory: memory,
    prompt: chatPrompt
});

const clients = new Map();
const agents = new Map();

const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

async function correctSpelling(message) {
    try {
        const completion = await chatModel.invoke([
            new SystemMessage("You are a spelling correction tool. Fix any spelling mistakes in the text while preserving all original words. Do not add, remove, or rephrase any words. Only correct misspellings. Return ONLY the corrected text."),
            new HumanMessage(message)
        ]);

        return completion.content || message;
    } catch (error) {
        console.error('Spelling correction error:', error);
        return message;
    }
}

async function shouldTransferToAgent(message) {
    try {
        const correctedMessage = await correctSpelling(message);
        console.log('Original message:', message);
        console.log('Corrected message:', correctedMessage);
        
        const userMessage = correctedMessage.toLowerCase();
        
        const agentWords = ['agent', 'human', 'person', 'someone', 'staff', 'support', 'representative', 'rep', 'management', 'manager'];
        const connectWords = ['connect', 'speak', 'talk', 'chat', 'help', 'transfer', 'switch'];
        const frustrationWords = ['confused', 'stuck', 'dont understand', "don't understand", 'not helping', 'not working', 'useless', 'waste', 'frustrated', 'annoying', 'unclear'];
        
        const businessTerms = ['pricing', 'quote', 'cost', 'payment', 'integration', 'setup', 'implementation', 
                              'compatible', 'demo', 'trial', 'support plan', 'technical', 'api', 'custom', 
                              'report', 'contract', 'account', 'subscription', 'billing'];

        const wantsAgent = agentWords.some(word => userMessage.includes(word)) &&
                          connectWords.some(word => userMessage.includes(word));

        const directRequest = userMessage.includes('live chat') || 
                             userMessage.includes('real person') ||
                             userMessage.match(/can i speak to/i) ||
                             userMessage.match(/need to speak/i) ||
                             userMessage.match(/want to speak/i) ||
                             userMessage.match(/talk to your/i);

        const hasBusinessTerm = businessTerms.some(term => userMessage.includes(term));
        const isFrustrated = frustrationWords.some(word => userMessage.includes(word));

        return wantsAgent || directRequest || hasBusinessTerm || isFrustrated;
    } catch (error) {
        console.error('Error in shouldTransferToAgent:', error);
        return false;
    }
}

function processMessage(message) {
    const errorCodeMatch = message.match(/(\d{4})/);
    if (errorCodeMatch) {
        return errorHandler.getErrorResponse(errorCodeMatch[1]);
    }
    return null;
}

async function getNextUserId() {
    const counter = await UserCounter.findOneAndUpdate(
        {}, 
        { $inc: { lastUserId: 1 } }, 
        { 
            new: true,  
            upsert: true  
        }
    );
    return `user_${counter.lastUserId}`;
}

async function getNextAgentId() {
    const counter = await AgentCounter.findOneAndUpdate(
        {}, 
        { $inc: { lastAgentId: 1 } }, 
        { 
            new: true,  
            upsert: true  
        }
    );
    return `agent_${counter.lastAgentId}`;
}
wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        
        switch(data.type) {

            case 'register':
                if (data.role === 'user') {
                    const userId = data.userId || await getNextUserId();

                    clients.set(userId, ws);
                    ws.userId = userId;
                
                    ws.send(JSON.stringify({
                        type: 'register_response',
                        userId: userId,
                        message: "Welcome to OneSingleView! How can I assist you today?"
                    }));
                } else if (data.role === 'agent') {
                    const newAgentId = await getNextAgentId();
                    agents.set(newAgentId, ws);
                    ws.agentId = newAgentId;
            
                    ws.send(JSON.stringify({
                        type: 'register_response',
                        agentId: newAgentId
                    }));
                }
                break;
            

                case 'chat':
                    let chat = await Chat.findOne({ 
                        userId: data.userId, 
                        status: { $in: ['waiting', 'waiting_for_agent', 'active', 'bot'] }
                    });
                
                    if (!chat) {
                        chat = new Chat({
                            userId: data.userId,
                            messages: [{ role: 'user', message: data.message }],
                            status: 'bot',
                            startedAt: new Date()
                        });
                        await chat.save();
                    } else {
                        chat.messages.push({ role: 'user', message: data.message });
                        await chat.save();
                    }
                    
                    const errorCodeMatch = data.message.match(/(\d{4})/);
                    if (errorCodeMatch) {
                        const errorResponse = await errorHandler.getErrorResponse(errorCodeMatch[1]);
                        
                        chat.messages.push({ role: 'bot', message: errorResponse });
                        await chat.save();
                
                        ws.send(JSON.stringify({
                            type: 'bot_response',
                            message: errorResponse
                        }));
                        return;
                    }
                
                    const errorResponse = processMessage(data.message);
                    if (errorResponse) {
                        chat.messages.push({ role: 'bot', message: errorResponse });
                        await chat.save();
                    
                        ws.send(JSON.stringify({
                            type: 'bot_response',
                            message: errorResponse
                        }));
                        return;
                    }
                
                    if (chat.status === 'bot') {
                        if (await shouldTransferToAgent(data.message)) {
                            await Chat.findOneAndUpdate(
                                { userId: data.userId },
                                { $set: { status: 'waiting_for_agent' } }
                            );
                    
                            agents.forEach((agentWs) => {
                                agentWs.send(JSON.stringify({
                                    type: 'user_request',
                                    userId: data.userId,
                                    history: chat.messages
                                }));
                            });
                    
                            ws.send(JSON.stringify({
                                type: 'bot_response',
                                message: "I'll connect you with a specialist who can answer your queries. Please wait a moment."
                            }));
                        } else {
                            try {
                                const response = await chain.call({ input: data.message });
                
                                chat.messages.push({ role: 'bot', message: response.response });
                                await chat.save();
                
                                ws.send(JSON.stringify({
                                    type: 'bot_response',
                                    message: response.response
                                }));
                            } catch (error) {
                                console.error('Error in chat response:', error);
                                await Chat.findOneAndUpdate(
                                    { userId: data.userId },
                                    { $set: { status: 'waiting_for_agent' } }
                                );
                
                                ws.send(JSON.stringify({
                                    type: 'bot_response',
                                    message: "I apologize, but I'm having trouble processing your request. Let me connect you with a human specialist who can help."
                                }));
                            }
                        }
                    }
                    else if (chat.status === 'waiting_for_agent') {
                        ws.send(JSON.stringify({
                            type: 'bot_response',
                            message: "A OneSingleView specialist will be with you shortly. Thank you for your patience."
                        }));
                    }
                    else if (chat.status === 'active') {
                        const agentWs = agents.get(chat.agentId);
                        if (agentWs) {
                            agentWs.send(JSON.stringify({
                                type: 'chat',
                                userId: data.userId,
                                message: data.message 
                            }));
                        }
                    }
                    break;

            case 'agent_message':
                const userWs = clients.get(data.userId);
                if (userWs) {
                    const chat = await Chat.findOneAndUpdate(
                        { userId: data.userId, status: 'active' },
                        { $push: { messages: { role: 'agent', message: data.message } } },
                        { new: true }
                    );

                    userWs.send(JSON.stringify({
                        type: 'agent_message',
                        message: data.message
                    }));
                }
                break;

            case 'accept_chat':
                await Chat.findOneAndUpdate(
                    { userId: data.userId, status: 'waiting_for_agent' },
                    { 
                        $set: { 
                            agentId: data.agentId,
                            status: 'active'
                        }
                    }
                );

                const targetUserWs = clients.get(data.userId);
                if (targetUserWs) {
                    targetUserWs.send(JSON.stringify({
                        type: 'agent_connected',
                        message: 'A OneSingleView Agent has joined to assist you.'
                    }));
                }
                break;



            // Add this to your existing WebSocket message handler switch statement inside wss.on('connection', (ws))
            case 'user_typing':
                if (data.userId) {
                    const activeChat = await Chat.findOne({ 
                        userId: data.userId,
                        status: 'active'
                    });
                    
                    if (activeChat && activeChat.agentId) {
                        const agentWs = agents.get(activeChat.agentId);
                        if (agentWs) {
                            agentWs.send(JSON.stringify({
                                type: 'user_typing',
                                userId: data.userId
                            }));
                            
                            // Start a timer to automatically remove typing indicator if no stop_typing event is received
                            setTimeout(() => {
                                agentWs.send(JSON.stringify({
                                    type: 'stop_typing',
                                    userId: data.userId
                                }));
                            }, 3000);
                        }
                    }
                }
                break;
            
            case 'stop_typing':
                if (data.userId) {
                    const activeChat = await Chat.findOne({ 
                        userId: data.userId,
                        status: 'active'
                    });
                    
                    if (activeChat && activeChat.agentId) {
                        const agentWs = agents.get(activeChat.agentId);
                        if (agentWs) {
                            agentWs.send(JSON.stringify({
                                type: 'stop_typing',
                                userId: data.userId
                            }));
                        }
                    }
                }
                break;

                
            // Add these cases to your existing WebSocket message handler switch statement
            case 'agent_typing':
                if (data.userId) {
                    const userWs = clients.get(data.userId);
                    if (userWs) {
                        userWs.send(JSON.stringify({
                            type: 'agent_typing'
                        }));
                    }
                }
                break;
            
            case 'agent_stop_typing':
                if (data.userId) {
                    const userWs = clients.get(data.userId);
                    if (userWs) {
                        userWs.send(JSON.stringify({
                            type: 'stop_typing'
                        }));
                    }
                }
                break;
            
            
            case 'end_chat':
                try {
                await Chat.deleteOne({ 
                    userId: data.userId, 
                    status: { $ne: 'ended' } 
                });} catch (error) {
                    console.error('Error ending chat:', error);
                }

                const userToEnd = clients.get(data.userId);
                if (userToEnd) {
                    userToEnd.send(JSON.stringify({
                        type: 'chat_ended',
                        message: 'Thank you for your interest in OneSingleView. If you have any more questions, feel free to start a new chat.'
                    }));
                }

                agents.forEach((agentWs) => {
                    agentWs.send(JSON.stringify({
                        type: 'remove_request',
                        userId: data.userId
                    }));
                });
                break;
        }
    });

    ws.on('close', () => {
        if (ws.userId) {
            clients.delete(ws.userId);
        }
        if (ws.agentId) {
            agents.delete(ws.agentId);
        }
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});