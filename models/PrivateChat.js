const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const privateChatSchema = new Schema({
    privateChatName: {
        type: [String],
        required: true
    },
    name: { 
        type: String,
        required: true,
        unique: true
    }
}, {timestamp: true});

const privateChat = mongoose.model('PrivateChat', privateChatSchema, 'PrivateChat');
module.exports = privateChat;