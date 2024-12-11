// Firebase References
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const authSection = document.getElementById('auth-section');
const chatSection = document.getElementById('chat-section');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');
const welcomeMessage = document.getElementById('welcome-message');
const specialGroupChat = document.getElementById('special-group-chat');
const specialMessages = document.getElementById('special-messages');
const specialMessageInput = document.getElementById('special-message-input');
const messageInput = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');
const roomNameInput = document.getElementById('room-name');
const accessCodeInput = document.getElementById('access-code');

// Special Group Chat Access List
const specialUsers = ['specialuser1@example.com', 'specialuser2@example.com'];

// Global Chatroom Reference
let currentRoomRef = null;

// Authentication Handlers
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    initChat();
  } catch (error) {
    authError.textContent = error.message;
  }
});

document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert('Signup successful! Please log in.');
  } catch (error) {
    authError.textContent = error.message;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await auth.signOut();
  location.reload();
});

// Realtime Listener for Authentication State
auth.onAuthStateChanged(user => {
  if (user) {
    initChat();
  }
});

// Initialize Chat UI
function initChat() {
  const user = auth.currentUser;

  authSection.style.display = 'none';
  chatSection.style.display = 'block';
  welcomeMessage.textContent = `Welcome, ${user.email}!`;

  // Check for special group chat access
  if (specialUsers.includes(user.email)) {
    specialGroupChat.style.display = 'block';
    const specialRef = database.ref('special-group-chat');
    setupMessageListener(specialRef, specialMessages);
    document.getElementById('send-special-btn').addEventListener('click', () => {
      sendMessage(specialRef, specialMessageInput.value);
      specialMessageInput.value = '';
    });
  }

  // Event listeners for chatrooms
  document.getElementById('create-room-btn').addEventListener('click', createRoom);
  document.getElementById('join-room-btn').addEventListener('click', joinRoom);
}

// Create Chatroom
function createRoom() {
  const roomName = roomNameInput.value.trim();
  const accessCode = accessCodeInput.value.trim();

  if (!roomName || !accessCode) {
    alert('Please provide both a room name and an access code.');
    return;
  }

  const roomRef = database.ref(`chatrooms/${roomName}`);
  roomRef.set({ accessCode }).then(() => {
    joinRoom(roomName, accessCode);
  }).catch(error => {
    alert(`Error creating room: ${error.message}`);
  });
}

// Join Chatroom
function joinRoom(roomName = null, accessCode = null) {
  roomName = roomName || roomNameInput.value.trim();
  accessCode = accessCode || accessCodeInput.value.trim();

  if (!roomName || !accessCode) {
    alert('Please provide both a room name and an access code.');
    return;
  }

  const roomRef = database.ref(`chatrooms/${roomName}`);
  roomRef.get().then(snapshot => {
    if (!snapshot.exists()) {
      alert('Chatroom does not exist.');
      return;
    }

    const roomData = snapshot.val();
    if (roomData.accessCode !== accessCode) {
      alert('Access code is incorrect.');
      return;
    }

    currentRoomRef = roomRef.child('messages');
    document.getElementById('chatroom').style.display = 'block';
    setupMessageListener(currentRoomRef, messagesDiv);

    document.getElementById('send-message-btn').addEventListener('click', () => {
      sendMessage(currentRoomRef, messageInput.value);
      messageInput.value = '';
    });
  }).catch(error => {
    alert(`Error joining room: ${error.message}`);
  });
}

// Send a Message
function sendMessage(ref, message) {
  if (!message.trim()) return;

  ref.push({
    user: auth.currentUser.email,
    message,
    timestamp: Date.now(),
  });
}

// Setup Listener for New Messages
function setupMessageListener(ref, messagesContainer) {
  ref.on('child_added', snapshot => {
    const data = snapshot.val();
    const messageElem = document.createElement('p');
    messageElem.textContent = `${data.user}: ${data.message}`;
    messagesContainer.appendChild(messageElem);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}
