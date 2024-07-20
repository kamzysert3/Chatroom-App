const express = require('express')
const server = require('socket.io')
const path = require('path')

const PORT = process.env.PORT || 3500

const ADMIN = "Admin"

const app = express()

app.use(express.static(path.join(__dirname, 'public')))

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
    }
})

var tag = 1

io.on('connection', (socket) => {
    console.log(`User: ${socket.id} connected`);

    socket.emit('message', buildMsg(ADMIN, "Welcome to Greysoft Intern Chatroom"))

    activateUser(socket.id, getSmallestTag())
    console.log(userState.users);
    
    socket.emit('roomsList', {
        rooms: getAllActiveRooms()
    })

    socket.on('enterRoom', ({ name, room }) => {
        const prevRoom = getUser(socket.id)?.room
        if (prevRoom) {
            socket.leave(prevRoom)
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`))
        }

        const user = getUser(socket.id)
        user.name = name
        user.room = room

        console.log(userState.users);

        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            })
        }

        socket.join(user.room)

        socket.emit('message', buildMsg(ADMIN, `You have now joined ${user.room}`))

        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} have now joined the room`))

        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room)
        })

        io.emit('roomsList', {
            rooms: getAllActiveRooms()
        })
    })

    socket.on('disconnect', () => {
        console.log(`User: ${socket.id} disconnected`);

        const user = getUser(socket.id);
        userLeavesApp(socket.id)

        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`))
            
            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            })

            io.emit('roomsList', {
                rooms: getAllActiveRooms()
            })
        }

    })
    
    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room
        if (room){
            io.to(room).emit('message', buildMsg(name, text, getUser(socket.id)))
        }
    })    

    socket.on('activity', (name) => {

        const room = getUser(socket.id)?.room
        if (room){
            socket.broadcast.to(room).emit('activity', name)
        }
    })
})

function buildMsg(name, text, user) {
    let msgTag
    if(name !== ADMIN) { msgTag = user.tag }
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: "numeric",
            second: 'numeric'
        }).format(new Date()),
        tag: (msgTag) % 9,
    }
}

function activateUser(id, tag, name='', room='') {
    const user = {id, tag, name, room }
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
    return Array.from(new Set(userState.users.map(user => user.room)))
}

function getSmallestTag() {
    var tagged = userState.users.map(user => user.tag).sort()
    console.log(tagged);

    if (tagged.length === 0 || tagged[0] !== 1) {
        return 1
    }

    for (let j = 0; j < tagged.length - 1; j++) {
        if (tagged[j + 1] !== tagged[j] + 1) {
            return (tagged[j] + 1);
        }        
    }

    return (tagged[tagged.length - 1] + 1);
}