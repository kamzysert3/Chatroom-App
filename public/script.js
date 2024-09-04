document.addEventListener("DOMContentLoaded", () => {
    var user = JSON.parse(sessionStorage.getItem('user'));
    var profilePic = document.querySelector('.profile-pic');
    profilePic.setAttribute('data-name', user.name);
    profilePic.textContent = user.name.charAt(0).toUpperCase()
    document.querySelector('.profile span').textContent = user.name;
    
    // function handleSidebarClick (e) {
    //     e.stopPropagation();
    //     document.querySelector('aside').classList.toggle('active-sidebar');
    //     document.querySelector('.aside-container').classList.toggle('active-sidebar');
    //     document.querySelector('.profile-pic').classList.toggle('active-sidebar');
    //     document.querySelector('.profile span').classList.toggle('active-sidebar');
    //     document.querySelector('.close-sidebar').classList.toggle('active-sidebar');
    //     document.querySelector('.room-list').classList.toggle('active-sidebar');
    //     document.querySelector('.side-activity').classList.toggle('active-sidebar');
    //     document.querySelector('.create-room-btn').classList.toggle('active-sidebar');
    //     document.querySelector('.join-room-btn').classList.toggle('active-sidebar');
    //     document.querySelector('.create-room-btn span').classList.toggle('active-sidebar');
    //     document.querySelector('.join-room-btn span').classList.toggle('active-sidebar');
    //     document.querySelector('.create-room-btn i').classList.toggle('active-sidebar');
    //     document.querySelector('.join-room-btn i').classList.toggle('active-sidebar');
    //     document.querySelector('#logout').classList.toggle('active-sidebar');
    // }

    // document.querySelector('aside').addEventListener('click', (e) => {
    //     if (document.querySelector('aside').classList.contains('active-sidebar')) {
    //         return;
    //     } else {
    //         handleSidebarClick(e);
    //     }
    // });

    // document.querySelector('.aside-container').addEventListener('click', handleSidebarClick);
    
    // document.querySelector('.close-sidebar').addEventListener('click', handleSidebarClick);

    var icons = document.querySelectorAll('.icons')

    icons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            icons.forEach(icon => {
                icon.style.pointerEvents = 'auto'
            })
            e.stopPropagation();
            const mouseY = e.clientY
            const popup = document.querySelector('.popup')
            
            if (e.target.classList.contains('your-friends')){
                friendsList()
                popup.style.display = 'block'
                popup.style.top = `${mouseY - 20}px`
                icon.style.pointerEvents = 'none'
            }
            if (e.target.classList.contains('room')){
                roomList()
                popup.style.display = 'block'
                popup.style.top = `${mouseY - 20}px`
                icon.style.pointerEvents = 'none'
            }
            if (e.target.classList.contains('your-ai')){
                AIChat()
                popup.style.display = 'none'
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('.icons') && !e.target.classList.contains('.popup')) {
            document.querySelector('.popup').style.display = 'none';
            icons.forEach(icon => {
                icon.style.pointerEvents = 'auto';
            })
        }
    })

    document.querySelectorAll('.create-room-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
        // e.stopPropagation();
        document.querySelector('.box').style.display = 'flex'
        document.querySelector('.create-room-dialog').classList.toggle('visible');
    })
    })
    
    document.querySelectorAll('.join-room-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
        // e.stopPropagation();
        document.querySelector('.box').style.display = 'flex'
        document.querySelector('.join-room-dialog').classList.toggle('visible');
    })
    })
    
    document.querySelectorAll('.add-friend-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
        // e.stopPropagation();
        document.querySelector('.box').style.display = 'flex'
        document.querySelector('.add-friend-dialog').classList.toggle('visible');
    })
    })
    
    document.querySelector('.close-create-room-dialog').addEventListener('click', function() {
        document.querySelector('.create-room-dialog').classList.toggle('visible');
        document.querySelector('.box').style.display = 'none'
        document.querySelector('#create-room-name').value = ''
        document.querySelector('#create-room-password').value = ''
        document.querySelector('#description').value = ''
    })
    
    
    document.querySelector('.close-join-room-dialog').addEventListener('click', function() {
        document.querySelector('.join-room-dialog').classList.toggle('visible');
        document.querySelector('.box').style.display = 'none'
        document.querySelector('#join-room-name').value = ''
        document.querySelector('#join-room-password').value = ''
    })

    document.querySelector('.close-add-friend-dialog').addEventListener('click', function() {
        document.querySelector('.add-friend-dialog').classList.toggle('visible');
        document.querySelector('.box').style.display = 'none'
        document.querySelector('#add-friend-name').value = ''
    })

    const friendsPopup = document.querySelectorAll('.friends-popup')
    const roomsPopup = document.querySelectorAll('.room-popup')
    function friendsList() {
        friendsPopup.forEach( friendPopup => {
            friendPopup.style.display = 'block'
        })
        roomsPopup.forEach( roomPopup => {
            roomPopup.style.display = 'none'
        })
    }
    
    function roomList() {
        friendsPopup.forEach( friendPopup => {
            friendPopup.style.display = 'none'
        })
        roomsPopup.forEach( roomPopup => {
            roomPopup.style.display = 'block'
        })
    }
});
