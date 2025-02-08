const mongoose = require('mongoose');

const AgentCounterSchema = new mongoose.Schema({
    lastAgentId: { 
        type: Number, 
        default: 0 
    }
});

module.exports = mongoose.model('AgentCounter', AgentCounterSchema);