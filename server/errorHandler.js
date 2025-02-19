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

    async getErrorMessage(errorCode, errorInfo, isArabic) {
        if (!isArabic) {
            return `I understand you're experiencing Error ${errorCode}. This is happening because ${errorInfo.reason}. Please try again or contact our support team for assistance.`;
        } else {
            return `أفهم أنك تواجه الخطأ ${errorCode}. يحدث هذا بسبب ${errorInfo.reason}. يرجى المحاولة مرة أخرى أو الاتصال بفريق الدعم للمساعدة.`;
        }
    }

    async convertToEnglishNumbers(input) {
        if (!input) return input;
        
        // Convert input to string if it's not already
        const str = input.toString();
        
        // Map of Arabic digits to English digits
        const arabicToEnglish = {
            '٠': '0', '۰': '0',
            '١': '1', '۱': '1',
            '٢': '2', '۲': '2',
            '٣': '3', '۳': '3',
            '٤': '4', '۴': '4',
            '٥': '5', '۵': '5',
            '٦': '6', '۶': '6',
            '٧': '7', '۷': '7',
            '٨': '8', '۸': '8',
            '٩': '9', '۹': '9'
        };
        
        // Replace any Arabic digits with their English equivalents
        return str.replace(/[٠-٩۰-۹]/g, digit => arabicToEnglish[digit]);
      }
    
    
      async getErrorResponse(errorCode, isArabic) {
        const englishErrorCode = await this.convertToEnglishNumbers(errorCode);
        const errorInfo = this.errorMap.get(englishErrorCode);
        //console.log(isArabic);
        if (!errorInfo) {
            return isArabic 
                ? "عذراً، لم أتمكن من العثور على معلومات حول رمز الخطأ هذا. هل يمكنك التحقق من رمز الخطأ أو تقديم المزيد من التفاصيل حول المشكلة التي تواجهها؟"
                : "I apologize, but I couldn't find information about this specific error code. Could you please verify the error code or provide more details about the issue you're experiencing?";
        }

        try {
            const systemPrompt = `You are a helpful and empathetic customer service representative chatbot. A customer is experiencing an error with their bank transaction.
            Error details:
            - Error Code: ${errorCode}
            - Status: ${errorInfo.status}
            - Reason: ${errorInfo.reason}

            Please provide a human-friendly response that:
            1. Clearly explains the issue in simple terms
            2. Provides specific next steps or solutions (don't outright suggest to contact the human customer support)
            3. Maintains a professional tone
            4. Don't be overly sympathetic
            5. No need to start with sentences like "Hello! I'm sorry to hear about your transaction issue." You can directly jump to the reasoning part
            6. ${isArabic ? 'Respond in Arabic' : 'Respond in English'}
            Keep the response very concise and helpful.`;

            const response = await this.chatModel.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage("What's wrong with my transaction?")
            ]);

            return response.content;

        } catch (error) {
            console.error('Error generating AI response:', error);
            return this.getErrorMessage(errorCode, errorInfo, isArabic);
        }
    }
}

module.exports = new ErrorHandler();