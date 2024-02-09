/* For index.html */

// TODO: If a user clicks to create a chat, create an auth key for them
// and save it. Redirect the user to /chat/<chat_id>
function createChat() {

}

/* For chat.html */

// TODO: Fetch the list of existing chat messages.
// POST to the API when the user posts a new message.
// Automatically poll for new messages on a regular interval.
/* For room.html */

// Function to fetch messages from the API
function fetchMessages() {
  fetch(`/api/messages/${ROOM_ID}`, {
    headers: {
      'API-Key': WATCH_PARTY_API_KEY
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    return response.json();
  })
  .then(messages => {
    // Process retrieved messages and update UI
    updateMessagesUI(messages);
  })
  .catch(error => {
    console.error('Error fetching messages:', error);
  });
}

// Function to update the UI with fetched messages
function updateMessagesUI(messages) {
  const messagesContainer = document.querySelector('.messages');
  messagesContainer.innerHTML = ''; // Clear existing messages
  messages.forEach(message => {
    const messageElement = document.createElement('message');
    messageElement.innerHTML = `
      <author>${message.author}</author>
      <content>${message.content}</content>
    `;
    messagesContainer.appendChild(messageElement);
  });
}

// Function to start message polling
function startMessagePolling() {
  fetchMessages(); // Fetch messages immediately when page loads
  setInterval(fetchMessages, 1000); // Poll every 1 second for new messages
}

/* For room.html */

// Function to toggle room name edit UI
function toggleRoomNameEdit() {
  const displayHeader = document.querySelector('.display');
  const editHeader = document.querySelector('.edit');

  displayHeader.classList.toggle('hide');
  editHeader.classList.toggle('hide');
}

// Function to save the edited room name
function saveRoomName() {
  const newRoomName = document.getElementById('newRoomName').value;

  // Send request to update room name
  updateRoomName(newRoomName);
}


// Function to update the room name
function updateRoomName(newName) {
  fetch('/api/room/name', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': WATCH_PARTY_API_KEY
    },
    body: JSON.stringify({ room_id: ROOM_ID, new_name: newName })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update room name');
    }
    console.log('Room name updated successfully');
    // Update room name in UI
    const roomNameElement = document.querySelector('.roomName');
    roomNameElement.textContent = newName;
  })
  .catch(error => {
    console.error('Error updating room name:', error);
  });
}

/* For profile.html */

// Function to update the username
function updateUsername(newUsername) {
  fetch('/api/user/name', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': WATCH_PARTY_API_KEY
    },
    body: JSON.stringify({ user_id: WATCH_PARTY_USER_ID, new_name: newUsername })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update username');
    }
    console.log('Username updated successfully');
  })
  .catch(error => {
    console.error('Error updating username:', error);
  });
}

// Function to update the password
function updatePassword(newPassword) {
  fetch('/api/user/password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': WATCH_PARTY_API_KEY
    },
    body: JSON.stringify({ user_id: WATCH_PARTY_USER_ID, new_password: newPassword })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update password');
    }
    console.log('Password updated successfully');
  })
  .catch(error => {
    console.error('Error updating password:', error);
  });
}
