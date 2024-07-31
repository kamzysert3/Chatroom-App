const express = require('express')
const server = require('socket.io')
const path = require('path')
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const processRoutes = require('./routes/users');
const authenticate = require('./middleware/authenticate');
const Message = require('./models/Messages');
const Room = require('./models/Room');
const User = require('./models/User');

// MongoDB Connection
// const dbURI = 'mongodb://localhost:27017/chatroom';
const dbURI = 'mongodb+srv://kamsinnaegbuna:CQPRUPTkHTDjL3C8@chatroomapp.ru2wple.mongodb.net/?retryWrites=true&w=majority&appName=chatroomApp';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));


const PORT = process.env.PORT || 3001

const ADMIN = "Admin"

const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'))
})

app.get('/chat', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
})

app.use('/process', processRoutes)

const expressServer = app.listen(PORT, (err) => {
    if (err) throw err
    console.log(`Server is running on port ${PORT}`);
})

const userState = {
    users: [],
    setUsers: (newUsersArray) => {
        userState.users = newUsersArray
    }
}

const io = new server.Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5501", "http://127.0.0.1:5501"],
    },
    pingInterval: 60000,
    pingTimeout: 60000
})

io.on('connection', async (socket) => {
    console.log(`User: ${socket.id} connected`);

    socket.emit('message', await buildMsg(ADMIN, "Welcome to Greysoft Intern Chatroom"))

    activateUser(socket.id)
    
    socket.emit('roomsList', {
        rooms: getAllActiveRooms()
    })

    socket.on('createRoom', async ({ RoomName, password, description, username }) => {
        const AvailableRooms = await Room.find({ RoomName })
        if (AvailableRooms.length > 0) {
            return socket.emit('message', await buildMsg(ADMIN, "Room name already exists"));
        }

        const room = new Room({ RoomName, password, description });
        await room.save();
        socket.emit('enterRoom', {
            name: username,
            room: RoomName,
            password: password,
        })
    })

    socket.on('enterRoom', async ({ name, room, password }) => {
        const targetRoom = await Room.findOne({ RoomName: room })

        if (!targetRoom) {
            return socket.emit('message', await buildMsg(ADMIN, "Room does not exist")); 
        }

        const isMatch = await targetRoom.isValidPassword(password);
        if (!isMatch) {
            return socket.emit('message', await buildMsg(ADMIN, "Invalid password"));
        }

        const user = getUser(socket.id)
        user.name = name
        const prevRoom = getUser(socket.id)?.room
        user.room = room
        
        if (prevRoom) {
            socket.leave(prevRoom)
            io.to(prevRoom).emit('message', await buildMsg(ADMIN, `${name} has left the room`))
        }

        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            })
        }

        socket.join(user.room)

        socket.emit('message', await buildMsg(ADMIN, `You has now joined ${user.room}`, '', getUser(socket.id)))

        const messages = Array.from(await Message.find({ room: user.room }));
        for (let m = 0; m < messages.length; m++) {
            socket.emit('message', messages[m]);            
        }


        socket.broadcast.to(user.room).emit('message', await buildMsg(ADMIN, `${user.name} have now joined the room`))

        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room)
        })

        io.emit('roomsList', {
            rooms: getAllActiveRooms()
        })
    })

    socket.on('disconnect', async () => {
        console.log(`User: ${socket.id} disconnected`);

        const user = getUser(socket.id);
        userLeavesApp(socket.id)

        if (user) {
            io.to(user.room).emit('message', await buildMsg(ADMIN, `${user.name} has left the room`))
            
            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            })

            io.emit('roomsList', {
                rooms: getAllActiveRooms()
            })
        }

    })
    
    socket.on('message', async ({ name, email, text }) => {
        const room = getUser(socket.id)?.room
        if (room){
            io.to(room).emit('message', await buildMsg(name, text, email, getUser(socket.id)))
        }
    })    

    socket.on('typing', () => {

        const room = getUser(socket.id)?.room
        if (room){
            socket.broadcast.to(room).emit('typing')
        }
    })

    socket.on('stopTyping', () => {

        const room = getUser(socket.id)?.room
        if (room){
            socket.broadcast.to(room).emit('stopTyping')
        }
    })
})

async function buildMsg(name, text, email, user) {
    if (name === ADMIN){
        return {
            name: ADMIN,
            text: text,
            time: new Intl.DateTimeFormat('default', {
                hour: 'numeric',
                minute: "numeric",
                second: 'numeric'
            }).format(new Date()),
            tag: null,
            room: user?.room
        }
    }
    var USER = await User.find({ email })
    let messageSent = {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: "numeric",
            second: 'numeric'
        }).format(new Date()),
        tag: (USER[0].tag % 9) + 1,
        room: user.room,
    }
    const message =  new Message(messageSent);
    message.save();
    return messageSent
}

function activateUser(id, name=undefined, room=undefined) {
    const user = {id, name, room }
    userState.setUsers([
        ...userState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function userLeavesApp(id) {
    userState.setUsers([
        ...userState.users.filter(user => user.id !== id)
    ])
}

function getUser(id) {
    return userState.users.find(user => user.id === id)
}

function getUsersInRoom(room) {
    return userState.users.filter(user => user.room === room)
}

function getAllActiveRooms() {
    let activeRooms = [];
    for (let r = 0; r < userState.users.length; r++) {
        if (userState.users[r].room) {
            activeRooms.push(userState.users[r].room);
        }        
    }
    return Array.from(new Set(activeRooms))
}