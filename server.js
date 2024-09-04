const express = require('express')
const cookieParser = require('cookie-parser');
const authenticate = require('./middleware/authenticate');
const bodyParser = require('body-parser');
const path = require('path')
const processRoutes = require('./routes/users');
const Answer = require('./middleware/answer.js').answer;
const server = require('socket.io').Server;
const mongoose = require('mongoose');
const Message = require('./models/Messages');
const Room = require('./models/Room');
const privateChat = require('./models/PrivateChat');
const User = require('./models/User');

// MongoDB Connection
const dbURI = 'mongodb+srv://kamsinnaegbuna:CQPRUPTkHTDjL3C8@chatroomapp.ru2wple.mongodb.net/?retryWrites=true&w=majority&appName=chatroomApp';
// const dbURI = 'mongodb://localhost:27017/chatroom';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));


const PORT = process.env.PORT || 3001

const ADMIN = "Admin"

const app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'))
})

app.get('/chat', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
})

app.get('/setting', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'setting.html'));
})

app.post('/ask', async (req, res) => {
    const { message } = req.body;    
    const answer = await Answer(message);    

    res.json({
        answer
    });
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

const io = new server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5501", "http://127.0.0.1:5501"],
    },
    pingInterval: 60000,
    pingTimeout: 60000
})

io.on('connection', async (socket) => {
    console.log(`User: ${socket.id} connected`);    
    
    socket.on('connects', async ({ email }) => {
        socket.emit('message', await buildMsg(ADMIN, "Welcome to Greysoft Intern Chatroom"))

        var USER = await User.find({ email });
        await activateUser(socket.id, USER[0].name)
        
        socket.emit('roomsList', {
            rooms: await getActivity(getUser(socket.id))
        })

        socket.emit('FriendsList', {
            friends: USER[0].friends
        })
    })

    socket.on('createRoom', async ({ RoomName, password, description, username }) => {
        const AvailableRooms = await Room.find({ RoomName })
        if (AvailableRooms.length > 0) {
            return socket.emit('message', await buildMsg(ADMIN, "Room name already exists"));
        }

        const room = new Room({ RoomName, password, description });
        await room.save();
        socket.emit('enterCreatedRoom', {
            name: username,
            room: RoomName,
            password: password,
        })
    })

    socket.on('chatFriend', async ({ name, friend }) => {
        var sortedNames = [name.toLowerCase(), friend.toLowerCase()].sort()
        const privateChatroom = await privateChat.findOne({ privateChatName: sortedNames });
        
        const user =  getUser(socket.id)
        user.name = name
        const prevRoom = getUser(socket.id)?.room
        user.room = undefined
        const prevPrivateChat = getUser(socket.id)?.privateroom
        user.privateroom = privateChatroom.name

        if (prevRoom) {
            socket.leave(prevRoom)
            io.to(prevRoom).emit('message', await buildMsg(ADMIN, `${name} has left the room`))
        }

        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            })
        }

        if(prevPrivateChat) {
            socket.leave(prevPrivateChat)
            io.to(prevPrivateChat).emit('userList', {
                users: getUsersInPrivateRoom(prevPrivateChat)
            })
        }

        socket.join(user.privateroom)

        io.to(user.privateroom).emit('userList', {
            users: getUsersInPrivateRoom(user.privateroom)
        })

        socket.emit('roomDetails', {
            roomName: friend,
            type: sortedNames.includes('ai chat') ? 'AI Chat' : 'private Chat'
        })

        const messages = Array.from(await Message.find({ privateroom: user.privateroom }));
        for (let m = 0; m < messages.length; m++) {
            socket.emit('message', messages[m]);            
        }

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
        user.privateroom = undefined
        
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

        socket.emit('roomDetails', {
            roomName: user.room,
            type: 'Chatroom'
        })

        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room)
        })

        io.emit('roomsList', {
            rooms: await getActivity(getUser(socket.id))
        })
        
        
        const messages = Array.from(await Message.find({ room: user.room }));
        for (let m = 0; m < messages.length; m++) {
            socket.emit('message', messages[m]);            
        }
        
        socket.emit('message', await buildMsg(ADMIN, `You have now joined ${user.room}`))

        socket.broadcast.to(user.room).emit('message', await buildMsg(ADMIN, `${user.name} has now joined the room`))

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

            // io.emit('roomsList', {
            //     rooms: getActivity(getUser(socket.id))
            // })
        }

    })

    socket.on('addFriend', async ({ email, friend }) => {
        var USER = await User.find({ email });

        var addedFriend = await User.find({ name: friend });
        
        if (addedFriend.length < 1) {
            return socket.emit('message', await buildMsg(ADMIN, "Friend does not exist"));
        }
        if (USER[0].friends.includes(addedFriend[0].name)) {
            return socket.emit('message', await buildMsg(ADMIN, "Friend already added"));
        }
        if (addedFriend.length > 0) {
            USER[0].friends.push(addedFriend[0].name);
            USER[0].save();
            addedFriend[0].friends.push(USER[0].name);
            addedFriend[0].save();
            socket.emit('FriendsList', {
                friends: USER[0].friends
            })
            const privatechat = new privateChat({
                privateChatName: [
                    USER[0].name.toLowerCase(),
                    addedFriend[0].name.toLowerCase()
                ].sort(),
                name: `${USER[0].name}, ${addedFriend[0].name}`
            });
            await privatechat.save();
            socket.emit('message', await buildMsg(ADMIN, `You have added ${friend}`))
        } else {
            return socket.emit('message', await buildMsg(ADMIN, "Friend does not exist"));
        }
    })
    
    socket.on('message', async ({ name, email, text }) => {
        const room = getUser(socket.id)?.room
        const privateRoom = getUser(socket.id)?.privateroom
        if (room){
            return io.to(room).emit('message', await buildMsg(name, text, email, getUser(socket.id)))
        }
        if (privateRoom){
            return io.to(privateRoom).emit('message', await buildMsg(name, text, email, getUser(socket.id)))
        }
        // return io.to(socket.id).emit('message', await buildMsg(name, text, email, getUser(socket.id)))

    })    

    socket.on('typing', () => {

        const room = getUser(socket.id)?.room
        const privateRoom = getUser(socket.id)?.privateroom
        if (room){
            socket.broadcast.to(room).emit('typing')
        }
        if (privateRoom){
            socket.broadcast.to(privateRoom).emit('typing')
        }
    })

    socket.on('stopTyping', () => {

        const room = getUser(socket.id)?.room
        const privateRoom = getUser(socket.id)?.privateroom
        if (room){
            socket.broadcast.to(room).emit('stopTyping')
        }
        if (privateRoom){
            socket.broadcast.to(privateRoom).emit('stopTyping')
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
        id: Date.now(),
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: "numeric",
            second: 'numeric'
        }).format(new Date()),
        tag: USER[0] ? (USER[0].tag % 9) + 1 : 0,
        room: user.room || "",
        privateroom: user.privateroom || "",
    }
    const message = new Message(messageSent);
    if (!String(user.privateroom).includes('AI chat')){
        user.room || user.privateroom ? message.save() : null;
    }
    return messageSent
}

async function activateUser(id, name, room=undefined, privateroom=undefined) {
    var USER = await User.find({ name });

    const user = {id, name, room, privateroom, activity: USER[0].activity}
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

function getUsersInPrivateRoom(privateroom) {
    return userState.users.filter(user => user.privateroom === privateroom)
}

async function getActivity(user) {       
    let userRoom = user.room
    if (userRoom) {
        user.activity.push(userRoom);
        user.activity = Array.from(new Set(user.activity));
        user.activity = user.activity.slice(-5);

        var USER = await User.find({ name: user.name });
        USER[0].activity = user.activity;
        USER[0].save();
    }

    return user.activity
}