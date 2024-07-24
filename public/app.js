const socket = io('https://greysoft-intern-chat-app.onrender.com');
// const socket = io('ws://localhost:3001');

const msgInput = document.querySelector('#message');
const chatRoom = document.querySelector('#room');
const activity = document.querySelector('.activity');
const usersList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');
const currentUser = JSON.parse(sessionStorage.getItem('user'));

function sendMessage(e) {
    e.preventDefault()
    
    if (currentUser.name && msgInput.value.trim() !== '' && chatRoom.value) {
        socket.emit('message', {
            name: currentUser.name,
            text: msgInput.value.trim(),
        })
        msgInput.value = ''
    }

    msgInput.focus()
}

function enterRoom(e) {
    e.preventDefault()
    if (currentUser.name && chatRoom.value.trim() !== '') {
        document.querySelector('.chat-display').textContent = '';
        socket.emit('enterRoom', {
            name: currentUser.name,
            room: chatRoom.value.toLowerCase().trim(),
        })
        chatRoom.value = chatRoom.value.trim().toLowerCase()
    }
}

document.querySelector('.form-msg').addEventListener('submit', sendMessage)

document.querySelector('.form-join').addEventListener('submit', enterRoom)

msgInput.addEventListener('keypress', () => {
    socket.emit('activity', currentUser.name);
})

socket.on('message', (data) => {
    activity.textContent = ''
    const {name, text, time, tag} = data
    const li = document.createElement('li')
    li.className = 'post'

    if (name === currentUser.name) li.className = 'post post--right'
    if (name !== currentUser.name && name !== 'Admin') li.className = 'post post--left'
    if (name !== 'Admin') {
        li.innerHTML = `<div class="post__header post__header--user-${tag}">
        <span class="post__header--name">${name}</span>
        <span class="post__header--time">${time}</span>
        </div>
        <div class="post__text">${text}</div>`
    } else {
        li.innerHTML = `<div class="post__text">${text}</div>`
    }

    document.querySelector('.chat-display').appendChild(li)

    chatDisplay.scrollTop = chatDisplay.scrollHeight
})

let activityTimer;
socket.on('activity', (name) => {
    activity.textContent = `${name} is typing...`

    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        activity.textContent = ''
    }, 3000)
})

socket.on('userList', ({ users }) => {
    showUsers(users)
})

socket.on('roomsList', ({ rooms }) => {
    showRooms(rooms)
})

function showUsers(users) {
    usersList.textContent = ''
    if (users) {
        usersList.innerHTML = `<em> Users in ${chatRoom.value.trim().toLowerCase()}:</em>`
        users.forEach((user, i) => {
            usersList.textContent += ` ${user.name}`
            if (users.length > 1 && i !== users.length - 1) {
                usersList.textContent += ','
            }
        });
    }
}

function showRooms(rooms) {
    roomList.textContent = ''
    if (rooms) {
        roomList.innerHTML = '<em>Active Rooms:</em>'
        rooms.forEach((room, i) => {
            roomList.textContent += ` ${room}`
            if (rooms.length > 1 && i !== rooms.length - 1) {
                roomList.textContent += ','
            }
        });
    }
}
