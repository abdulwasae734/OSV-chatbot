Chat Support System:
A real-time customer support chat system with AI bot integration and human agent handover capabilities for OneSingleView, a specialized POS (Point of Sale) data integration solution provider for retail and restaurant businesses.

🌟 Features:

Real-time Communication: WebSocket-based chat system enabling instant messaging
AI-Powered Chatbot: Integration with OpenAI GPT-4 using LangChain for intelligent responses
Seamless Agent Handover: Smart detection of complex inquiries with automatic handover to human agents
Live Typing Indicators: Real-time typing status for enhanced user experience
Error Code Resolution: Automated handling of transaction error codes
Multi-language Support: Handles both English and Arabic languages
Chat History: Persistent chat storage with MongoDB

🛠️ Technology Stack:

Backend: Node.js, Express
Real-time Communication: WebSocket (ws)
Database: MongoDB with Mongoose
AI Integration: OpenAI GPT-4, LangChain
Frontend: HTML, Tailwind CSS, JavaScript
Data Processing: XLSX for error code mapping

🏗️ Architecture:

The system is built with a modular architecture:

WebSocket Server: Handles real-time messaging between clients and agents
AI Chatbot: Processes routine inquiries with context awareness
Human Agent Interface: Dashboard for support specialists to handle complex issues
Error Handler: Processes transaction error codes with detailed resolution steps
Database Layer: Stores chat history and user interactions

📋 System Flow:

User initiates a chat session
AI bot handles initial inquiries and common questions
System detects complex queries using NLP techniques
Complex inquiries are transferred to a human agent queue
Human agents can view and accept pending chat requests
Seamless conversation continues with the human agent
Chat can be ended by the agent when resolved

🚀 Setup and Installation:
Prerequisites:

Node.js (v14+)
MongoDB
OpenAI API key

Installation Steps:

Clone the repository

bashgit clone https://github.com/yourusername/onesingleview-chat.git
cd onesingleview-chat

Install dependencies

bashnpm install

Create a .env file with the following variables:

MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
PORT=3000

Start the server

bashnode server.js

Access the application:

User chat interface: http://localhost:3000
Agent dashboard: http://localhost:3000/agent



🤖 AI Features:

Intent Recognition: Detects when a user needs to speak with a human agent
Contextual Responses: Maintains conversation context for meaningful interactions
Error Code Processing: Provides user-friendly explanations for error codes
Multi-language Support: Handles both English and Arabic queries
Spelling Correction: Fixes minor typos in user messages

🔄 Workflows:
User Flow:

User connects to the chat interface
System assigns a unique user ID
User sends a message
Bot processes and responds to the message
If complex, system transitions to "waiting for agent" status
Human agent accepts the chat
User continues conversation with the agent

Agent Flow:

Agent logs into the dashboard
System shows pending chat requests
Agent accepts a chat request
Agent can view chat history
Agent communicates with the user
Agent can end the chat when resolved
