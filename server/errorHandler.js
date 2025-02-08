const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { ChatOpenAI } = require("@langchain/openai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");

class ErrorHandler {
    constructor() {
        this.errorMap = new Map();
        this.initialized = false;
        this.chatModel = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'gpt-4',
            temperature: 0.7,
        });
    }

    async initialize() {
        if (this.initialized) return;

        try {
            const excelPath = path.join(__dirname, 'excel.xlsx');
            const fileBuffer = fs.readFileSync(excelPath);
            
            const workbook = XLSX.read(fileBuffer, {
                cellStyles: true,
                cellDates: true,
                cellNF: true,
                sheetStubs: true
            });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            data.forEach(row => {
                this.errorMap.set(row.Error_Code.toString(), {
                    status: row.Status,
                    reason: row.Reason
                });
            });

            this.initialized = true;
            console.log('Error handler initialized successfully');
        } catch (error) {
            console.error('Error initializing error handler:', error);
            throw error;
        }
    }

    async getErrorResponse(errorCode) {
        const errorInfo = this.errorMap.get(errorCode.toString());
        if (!errorInfo) {
            return "I apologize, but I couldn't find information about this specific error code. Could you please verify the error code or provide more details about the issue you're experiencing?";
        }

        try {
            const systemPrompt = `You are a helpful and empathetic customer service representative chatbot. A customer is experiencing an error with their bank transaction.
            Error details:
            - Error Code: ${errorCode}
            - Status: ${errorInfo.status}
            - Reason: ${errorInfo.reason}

            Please provide a human-friendly response that:
            1. Clearly explains the issue in simple terms
            2. Provides specific next steps or solutions (dont outright suggest to contact the human customer support)
            3. Maintains a professional tone.
            4. Dont be overly sympathetic.
            5. No need to start with sentences like "Hello! I'm sorry to hear about your transaction issue." You can directly jump to the reasoning part.
            
            
            Keep the response very concise and helpful.`;

            const response = await this.chatModel.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage("What's wrong with my transaction?")
            ]);

            return response.content;

        } catch (error) {
            console.error('Error generating AI response:', error);
            // Fallback to a basic response if AI fails
            return `I understand you're experiencing Error ${errorCode}. This is happening because ${errorInfo.reason}. Please try again or contact our support team for assistance.`;
        }
    }
}

module.exports = new ErrorHandler();