const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    messages: [{
        role: { type: String, enum: ['user', 'bot', 'agent'], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    status: { 
        type: String, 
        enum: ['waiting', 'waiting_for_agent', 'active', 'ended', 'bot', 'paused'], 
        default: 'waiting' 
    },
    agentId: { type: String },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date }
}, { autoIndex: false });

ChatSchema.index({ userId: 1 }, { unique: false });

module.exports = mongoose.model('Chat', ChatSchema);