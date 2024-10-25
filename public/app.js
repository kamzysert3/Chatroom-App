const socket = io('https://greysoft-intern-chat-app.onrender.com');
// const socket = io('ws://localhost:3001');

const msgInput = document.querySelector('#message');
const usersList = document.querySelector('.user-list');
const friendsLists = document.querySelectorAll('.friends');
const roomLists = document.querySelectorAll('.rooms');
const chatDisplay = document.querySelector('.chat-display');
const currentUser = JSON.parse(sessionStorage.getItem('user'));

let activeRoom;
let activityTimer;
let activitybool = false;

async function sendMessage(e) {
    e.preventDefault();

    
    if (currentUser.name && msgInput.value.trim() !== '') {
        socket.emit('message', {
            name: currentUser.name,
            email: currentUser.email,
            text: msgInput.value.trim(),
        });
    }
    
    if (activeRoom == "AI Chat" || msgInput.value.trim().startsWith("@AI")) {
        async function GetAIResponse() {
            let message;            
            const response = await fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: msgInput.value.trim().startsWith('@AI') ? msgInput.value.trim().substring(4) : msgInput.value.trim(),
                }),
            })

            const data = await response.json();            
            
            if(data.answer.error){
                console.error(data.answer.error);
                message = "Something went wrong"
            } else {
                message = data.answer.prediction;
                message = message.replace(/\[INST\] .*? \[\/INST\]/g, '');
            }

            socket.emit('message', {
                name: 'AI Chat',
                text: message,
            });

        }
        GetAIResponse()
    }

    msgInput.value = '';
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
    document.querySelector('.chat-display').classList.remove('disabled');
    document.querySelector('.messageInp').classList.remove('disabled');
    document.querySelector('.messageInp').placeholder = "Your message"
    document.querySelector('.create-room-dialog').classList.toggle('visible');
    document.querySelector('.box').style.display = 'none'
    document.querySelector('#create-room-name').value = ''
    document.querySelector('#create-room-password').value = ''
    document.querySelector('#description').value = ''
}

socket.on('enterCreatedRoom', (room) => {
    socket.emit('enterRoom', room);
})


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
    document.querySelector('.chat-display').classList.remove('disabled');
    document.querySelector('.messageInp').classList.remove('disabled');
    document.querySelector('.messageInp').placeholder = "Your message"
    document.querySelector('.join-room-dialog').classList.toggle('visible');
    document.querySelector('.box').style.display = 'none'
    document.querySelector('#join-room-name').value = ''
    document.querySelector('#join-room-password').value = ''
      
}

function addFriend(e) {
    e.preventDefault()
    const friendName = document.getElementById('add-friend-name').value
    
    if(friendName){
        socket.emit('addFriend', {
            email: currentUser.email,
            friend: friendName,
        })
    }
    document.querySelector('.add-friend-dialog').classList.toggle('visible');
    document.querySelector('.box').style.display = 'none'
    document.querySelector('#add-friend-name').value = ''
}

function connect() {    
    socket.emit('connects', {
        email: currentUser.email
    })
}

function chatFriend() {
    const roomName = "Chat"
    activeRoom = roomName 
    socket.emit('chatFriend', {
        name: currentUser.name,
        friend: this.innerText,
    })
    document.querySelector('.chat-display').classList.remove('disabled');
    document.querySelector('.messageInp').classList.remove('disabled');
    document.querySelector('.messageInp').placeholder = "Your message"
}

function AIChat() {
    const roomName = "AI Chat"
    activeRoom = roomName
    socket.emit('chatFriend', {
        name: currentUser.name,
        friend: roomName,
    });
    document.querySelector('.chat-display').classList.remove('disabled');
    document.querySelector('.messageInp').classList.remove('disabled');
    document.querySelector('.messageInp').placeholder = "Your message"
}

function openEditMessageDialog() {
    document.querySelector('.edit-message-dialog').classList.toggle('visible');
    document.querySelector('.box').style.display = 'flex';
}

function editMessageFunc(e) {
    e.preventDefault()
    const id = document.getElementById('edited-message-id').value
    const text = document.querySelector('#edited-message').value    
    socket.emit('editMessage', {
        id,
        text,
    })
    document.querySelector('.edit-message-dialog').classList.toggle('visible');
    document.querySelector('.box').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', connect)

document.querySelector('.create-room-dialog').addEventListener('submit', createRoom)

document.querySelector('.join-room-dialog').addEventListener('submit', joinRoom)

document.querySelector('.form-msg').addEventListener('submit', sendMessage)

document.querySelector('.add-friend-dialog').addEventListener('submit', addFriend)

document.querySelector('.edit-message-dialog').addEventListener('submit', editMessageFunc)

socket.on('message', (data) => {
    activityTimer = setTimeout(() => {
        socket.emit('stopTyping');
    }, 1);    
    const {id, name, text, time, tag} = data
    const li = document.createElement('li')
    li.className = 'post'
    li.id = id

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

    // context menu
    li.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        const menuOptions = `
        <li>Copy Message</li>
        `;
        if ((!ev.target.parentElement.classList.contains('post')) || ev.target.classList.contains('post__header')) {
            return;
        }
        const menu = document.createElement('div');
        menu.classList.add('context-menu');
        menuList = document.createElement('ul');        
        menuList.innerHTML = ev.target.parentElement.classList.contains('post--right') ? menuOptions + `
        <li>Edit Message</li>
        <li>Delete Message</li>
        ` : menuOptions;
        menu.appendChild(menuList);
        document.body.appendChild(menu);
        // const { left, top } = li.getBoundingClientRect();
        menu.style.left = `${ ev.clientX - 10}px`;
        menu.style.top = `${ ev.clientY - 10}px`;
        menu.addEventListener('click', (e) => {
            if (e.target.innerText === 'Copy Text') {
                navigator.clipboard.writeText(ev.target.parentElement.querySelector('.post__text').innerText);
            } else if (e.target.innerText === 'Delete Message') {          
                socket.emit('deleteMessage', {
                    id: ev.target.parentElement.id
                });
            } else if (e.target.innerText === 'Edit Message') {
                document.getElementById('edited-message-id').value = ev.target.parentElement.id
                document.querySelector('#edited-message').value = ev.target.parentElement.querySelector('.post__text').innerText;
                openEditMessageDialog();
            }
            menu.remove();
        });

        // codes to remove context menu
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.context-menu')) {
                menu.remove();
            }
        });
    });
    document.querySelector('.chat-display').appendChild(li)

    chatDisplay.scrollTop = chatDisplay.scrollHeight
})

socket.on('editedMessage', (message) => {
    const li = document.getElementById(message.id)
    li.querySelector('.post__text').textContent = message.text
})

socket.on('deletedMessage', (message) => {
    const li = document.getElementById(message.id)
    li.remove()
})

socket.on('userList', ({ users }) => {
    showUsers(users)
})

socket.on('roomsList', ({ rooms }) => {
    showRooms(rooms)
})

socket.on('FriendsList', ({ friends }) => {
    showFriends(friends)
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
    roomLists.forEach((roomList) => {
        roomList.textContent = ''
        if (rooms.length > 0) {
            rooms.forEach((room) => {
                roomList.innerHTML += `<li class='active-room'> ${room} </li>`
            });
        } else {
            roomList.innerHTML = `<li class='active-room disabled'> No Recent rooms </li>`;
        }
    });
    document.querySelectorAll('.rooms li').forEach(function(room) {
        room.addEventListener('click', function() {
            document.querySelector('.box').style.display = 'flex'
            document.querySelector('.join-room-dialog').classList.toggle('visible');
            document.querySelector('#join-room-name').value = room.textContent
        })
    })
}

function showFriends(friends) {
    friendsLists.forEach((friendsList) => {
        friendsList.textContent = '';
        if (friends.length > 0) {
            friends.forEach((friend) => {
                friendsList.innerHTML += `
                <li class="friend">
                    <span>${friend}</span>
                </li>`
            });
        } else {
            friendsList.innerHTML = `<li class="friend disabled">No friends added yet</li>`;
        }
    });
    document.querySelectorAll('.friends li').forEach(function(userFriend) {
        userFriend.addEventListener('click', chatFriend)
    })
    
}

function chatDetail(room, type) {
    document.querySelector('.room-icon span').textContent = room;
    if (type === 'Chatroom') {
        document.querySelector('.room-pic').innerHTML = '<i class="fas fa-comments"></i>';
    } else if (type === 'private Chat') {
        document.querySelector('.room-pic').innerHTML = '<i class="fas fa-user-friends"></i>';
    } else {
        document.querySelector('.room-pic').innerHTML = '<i class="fas fa-microchip"></i>';
    }
    document.querySelector('.chat-display').textContent = ''
}

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

socket.on('roomDetails', ({ roomName, type }) => {
    chatDetail(roomName, type)
})