const socket = io('https://greysoft-intern-chat-app.onrender.com');
// const socket = io('ws://localhost:3001');

const msgInput = document.querySelector('#message');
const usersList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list ul');
const chatDisplay = document.querySelector('.chat-display');
const currentUser = JSON.parse(sessionStorage.getItem('user'));
let activeRoom;
let activityTimer;
let activitybool = false;

function sendMessage(e) {
    e.preventDefault();

    if (currentUser.name && msgInput.value.trim() !== '') {
        socket.emit('message', {
            name: currentUser.name,
            email: currentUser.email,
            text: msgInput.value.trim(),
        });
        msgInput.value = '';
    }

    msgInput.focus();
}


function createRoom(e) {
    e.preventDefault()
    const roomName = document.getElementById('create-room-name').value
    activeRoom = roomName
    const roomPassword = document.getElementById('create-room-password').value
    let roomDescription = document.getElementById('description').value
    if (roomDescription == ''){
        roomDescription = 'No description Provided'
    }
    
    if(roomName){
        socket.emit('createRoom', {
            RoomName: roomName.toLowerCase().trim(),
            password: roomPassword,
            description: roomDescription,
            username: currentUser.name
        })
    }
    document.querySelector('.create-room-box').style.display = 'none'
    document.querySelector('#create-room-name').value = ''
    document.querySelector('#create-room-password').value = ''
    document.querySelector('#description').value = ''
}

function joinRoom(e) {
    e.preventDefault()
    const roomName = document.getElementById('join-room-name').value
    activeRoom = roomName
    const roomPassword = document.getElementById('join-room-password').value
    
    if(roomName){
        socket.emit('enterRoom', {
            name: currentUser.name,
            room: roomName.toLowerCase().trim(),
            password: roomPassword,
        })
    }
    document.querySelector('.join-room-box').style.display = 'none'
    document.querySelector('#join-room-name').value = ''
    document.querySelector('#join-room-password').value = ''
      
}

document.querySelector('.create-room-dialog').addEventListener('submit', createRoom)

document.querySelector('.join-room-dialog').addEventListener('submit', joinRoom)

document.querySelector('.form-msg').addEventListener('submit', sendMessage)

socket.on('message', (data) => {
    activityTimer = setTimeout(() => {
        socket.emit('stopTyping');
    }, 1);    const {name, text, time, tag, room} = data
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
        if (room) {
            document.querySelector('.chat-display').textContent = '';
        }
        li.innerHTML = `<div class="post__text">${text}</div>`
    }

    document.querySelector('.chat-display').appendChild(li)

    chatDisplay.scrollTop = chatDisplay.scrollHeight
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
        usersList.innerHTML = `<em> Users in ${activeRoom}:</em>`
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
        rooms.forEach((room) => {
            roomList.innerHTML += `<li class='active-room'> ${room} </li>`
        });
    }
}

socket.on('enterRoom', (room) => {
    socket.emit('enterRoom', room);
})


function isTyping(typing) {
    if (typing) {
    chatDisplay.scrollTop = chatDisplay.scrollHeight
        if (!document.getElementById('typingIndicator')) {
            const typingIndicator = document.createElement('li');
            typingIndicator.id = 'typingIndicator';
            typingIndicator.className = 'bubble post--left';
            typingIndicator.innerHTML = `<div class="post__text">
            <div class="activity-container">
            <div class="typing-indicator"></div>
            </div>
            </div>`;
            document.querySelector('.chat-display').appendChild(typingIndicator);
            chatDisplay.scrollTop = chatDisplay.scrollHeight
        }
    } else {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            document.querySelector('.chat-display').removeChild(typingIndicator);
        }
    }
}

function handleTyping() {
    clearTimeout(activityTimer);
    socket.emit('typing');
    activityTimer = setTimeout(() => {
        socket.emit('stopTyping');
    }, 3000); 
}

msgInput.addEventListener('keypress', handleTyping);

socket.on('typing', () => {
    isTyping(true);
});

socket.on('stopTyping', () => {
    isTyping(false);
});