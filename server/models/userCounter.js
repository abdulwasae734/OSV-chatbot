const mongoose = require('mongoose');

const UserCounterSchema = new mongoose.Schema({
    lastUserId: { 
        type: Number, 
        default: 0 
    }
});

module.exports = mongoose.model('UserCounter', UserCounterSchema);