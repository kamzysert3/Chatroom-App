const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

//Message Schema
const messageSchema = new Schema ({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    time: {
        type: String,
        default:  new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: "numeric",
            second: 'numeric'
        }).format(new Date())
    },
    tag: {
        type: Number,
        required: true
    },
    room: {
        type: String,
    },
    privateroom: {
        type: String,
    }
});

//Create Message model
const Message = mongoose.model('Message', messageSchema, 'messages');

module.exports = Message;