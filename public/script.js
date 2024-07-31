document.addEventListener("DOMContentLoaded", () => {
    var user = JSON.parse(sessionStorage.getItem('user'));
    var profilePic = document.querySelector('.profile-pic');
    profilePic.setAttribute('data-name', user.name);
    profilePic.textContent = user.name.charAt(0).toUpperCase()
    document.querySelector('.profile span').textContent = user.name;
    
    function handleSidebarClick (e) {
        e.stopPropagation();
        document.querySelector('aside').classList.toggle('active-sidebar');
        document.querySelector('.aside-container').classList.toggle('active-sidebar');
        document.querySelector('.profile-pic').classList.toggle('active-sidebar');
        document.querySelector('.profile span').classList.toggle('active-sidebar');
        document.querySelector('.close-sidebar').classList.toggle('active-sidebar');
        document.querySelector('.room-list').classList.toggle('active-sidebar');
        document.querySelector('.side-activity').classList.toggle('active-sidebar');
        document.querySelector('.create-room-btn').classList.toggle('active-sidebar');
        document.querySelector('.join-room-btn').classList.toggle('active-sidebar');
        document.querySelector('.create-room-btn span').classList.toggle('active-sidebar');
        document.querySelector('.join-room-btn span').classList.toggle('active-sidebar');
        document.querySelector('.create-room-btn i').classList.toggle('active-sidebar');
        document.querySelector('.join-room-btn i').classList.toggle('active-sidebar');
        document.querySelector('#logout').classList.toggle('active-sidebar');
    }

    document.querySelector('aside').addEventListener('click', (e) => {
        if (document.querySelector('aside').classList.contains('active-sidebar')) {
            return;
        } else {
            handleSidebarClick(e);
        }
    });

    document.querySelector('.aside-container').addEventListener('click', handleSidebarClick);
    
    document.querySelector('.close-sidebar').addEventListener('click', handleSidebarClick);

    document.querySelector('.create-room-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelector('.create-room-box').style.display = 'flex'
    })

    document.querySelector('.close-create-room-dialog').addEventListener('click', function() {
        document.querySelector('.create-room-box').style.display = 'none'
        document.querySelector('#create-room-name').value = ''
        document.querySelector('#create-room-password').value = ''
        document.querySelector('#description').value = ''
    })

    document.querySelector('.join-room-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelector('.join-room-box').style.display = 'flex'
    })

    document.querySelector('.close-join-room-dialog').addEventListener('click', function() {
        document.querySelector('.join-room-box').style.display = 'none'
        document.querySelector('#join-room-name').value = ''
        document.querySelector('#join-room-password').value = ''
    })

});

var rooms = document.querySelector('.rooms').addEventListener('click', handleRoomClick);

function handleRoomClick(event) {
    if (event.target.classList.contains('active-room')) {
        document.querySelector('.join-room-box').style.display = 'flex';
        document.querySelector('#join-room-name').value = event.target.textContent;
    }
}