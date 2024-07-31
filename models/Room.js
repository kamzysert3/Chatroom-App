const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const roomSchema = new Schema({
    RoomName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: 'No description provided'
    }
}, {timestamps: true});

// Hash the password before saving the room
roomSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to validate password
roomSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const Room = mongoose.model('Room', roomSchema, 'rooms');
module.exports = Room;