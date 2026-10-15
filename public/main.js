const socket = io();

const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const welcomeMessage = document.getElementById('welcome-message');

const messageTone = new Audio('/msg.mp3');

let typingTimeout;

// Default username
nameInput.value = 'friendly-gidar';

// Hide welcome message when user starts typing
messageInput.addEventListener('input', () => {
    if (messageInput.value.trim() !== '') {
        welcomeMessage?.remove();
    }

    // Send typing feedback
    socket.emit('feedback', {
        feedback: messageInput.value.trim()
            ? `✍️ ${getUsername()} is typing...`
            : ''
    });

    // Clear previous timeout
    clearTimeout(typingTimeout);

    // Automatically clear typing indicator after inactivity
    if (messageInput.value.trim() !== '') {
        typingTimeout = setTimeout(() => {
            socket.emit('feedback', { feedback: '' });
        }, 1500);
    }
});

// Clear typing feedback when input loses focus
messageInput.addEventListener('blur', () => {
    clearTimeout(typingTimeout);
    socket.emit('feedback', { feedback: '' });
});

// Get username safely
function getUsername() {
    return nameInput.value.trim() || 'Anonymous';
}

// Submit message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

// Update total connected clients
socket.on('clients-total', (data) => {
    clientsTotal.textContent = `Total Clients: ${data}`;
});

// Send message
function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    const data = {
        name: getUsername(),
        message: message,
        dateTime: new Date().toISOString()
    };

    // Send to server
    socket.emit('message', data);

    // Display own message immediately
    addMessageToUI(true, data);

    // Clear input
    messageInput.value = '';

    // Clear typing indicator
    clearTimeout(typingTimeout);
    socket.emit('feedback', { feedback: '' });

    // Keep input focused
    messageInput.focus();
}

// Receive messages from other users
socket.on('chat-message', (data) => {
    messageTone.currentTime = 0;

    messageTone.play().catch(() => {
        // Browser may block audio until user interaction
    });

    addMessageToUI(false, data);
});

// Display message
function addMessageToUI(isOwnMessage, data) {
    clearFeedback();

    // Remove welcome message on the first actual chat message
    welcomeMessage?.remove();

    const li = document.createElement('li');

    li.classList.add(
        isOwnMessage ? 'message-right' : 'message-left'
    );

    const p = document.createElement('p');
    p.classList.add('message');

    // Safe message rendering
    p.textContent = data.message;

    const span = document.createElement('span');

    span.textContent =
        `${data.name} · ${moment(data.dateTime).fromNow()}`;

    p.appendChild(span);
    li.appendChild(p);

    messageContainer.appendChild(li);

    scrollBottom();
}

// Receive typing feedback
socket.on('feedback', (data) => {
    clearFeedback();

    if (!data.feedback) return;

    const li = document.createElement('li');
    li.classList.add('message-feedback');

    const p = document.createElement('p');
    p.classList.add('feedback');

    p.textContent = data.feedback;

    li.appendChild(p);
    messageContainer.appendChild(li);

    scrollBottom();
});

// Remove typing indicator
function clearFeedback() {
    document
        .querySelectorAll('.message-feedback')
        .forEach((element) => element.remove());
}

// Scroll to latest message
function scrollBottom() {
    messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: 'smooth'
    });
}
