# 💬 Chat Support System for OneSingleView

A real-time customer support chat system with AI bot integration and human agent handover capabilities for **OneSingleView**, a specialized POS (Point of Sale) data integration solution provider for retail and restaurant businesses.

---

## 🌟 Features

- **Real-time Communication**: WebSocket-based chat system enabling instant messaging  
- **AI-Powered Chatbot**: Integration with OpenAI GPT-4 using LangChain for intelligent responses  
- **Seamless Agent Handover**: Smart detection of complex inquiries with automatic handover to human agents  
- **Live Typing Indicators**: Real-time typing status for enhanced user experience  
- **Error Code Resolution**: Automated handling of transaction error codes  
- **Multi-language Support**: Handles both English and Arabic languages  
- **Chat History**: Persistent chat storage with MongoDB  

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express  
- **Real-time Communication**: WebSocket (`ws`)  
- **Database**: MongoDB with Mongoose  
- **AI Integration**: OpenAI GPT-4, LangChain  
- **Frontend**: HTML, Tailwind CSS, JavaScript  
- **Data Processing**: `xlsx` for error code mapping  

---

## 🏗️ Architecture

The system is built with a modular architecture:

- **WebSocket Server**: Handles real-time messaging between clients and agents  
- **AI Chatbot**: Processes routine inquiries with context awareness  
- **Human Agent Interface**: Dashboard for support specialists to handle complex issues  
- **Error Handler**: Processes transaction error codes with detailed resolution steps  
- **Database Layer**: Stores chat history and user interactions  

---

## 📋 System Flow

1. User initiates a chat session  
2. AI bot handles initial inquiries and common questions  
3. System detects complex queries using NLP techniques  
4. Complex inquiries are transferred to a human agent queue  
5. Human agents can view and accept pending chat requests  
6. Seamless conversation continues with the human agent  
7. Chat can be ended by the agent when resolved  

---

## 🚀 Setup and Installation

### Prerequisites

- Node.js (v14+)  
- MongoDB  
- OpenAI API key  

### Installation Steps


# Clone the repository
```bash
git clone https://github.com/yourusername/onesingleview-chat.git
cd onesingleview-chat
```
# Install dependencies
```bash
npm install
```
