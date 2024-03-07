// Function to add API key to fetch requests
function addApiKeyToFetch(apiKey) {
  const originalFetch = window.fetch;

  window.fetch = function(resource, init) {
    init = init || {};
    init.headers = init.headers || {};
    init.headers['X-API-Key'] = apiKey;
    
    return originalFetch(resource, init);
  }
}

// Function to initialize room page
document.addEventListener('DOMContentLoaded', function() {
  const messagesElement = document.querySelector('.messages');

  if (typeof WATCH_PARTY_API_KEY === 'undefined') {
    console.error('WATCH_PARTY_API_KEY is undefined.');
    return;
  }

  const apiKey = WATCH_PARTY_API_KEY;
  addApiKeyToFetch(apiKey);

  if (!messagesElement) {
    console.error('No element with class "messages" found');
    return;
  }

  const roomId = messagesElement.getAttribute('data-room-id');

  if (!roomId) {
    console.error('Room ID is undefined');
    return;
  }

  clearChatHistory();
  startMessagePolling(roomId);
  postMessage(roomId);
  initializeProfilePage();
});

// Function to initialize profile page functionality
function initializeProfilePage() {
  const updateUsernameButton = document.querySelector('.updateUsername');
  const updatePasswordButton = document.querySelector('.updatePassword');

  if (updateUsernameButton) {
    updateUsernameButton.addEventListener('click', async () => {
      try {
        await updateUser('/api/user/name', '.usernameInput', 'username');
      } catch (error) {
        console.error('Error updating username:', error);
      }
    });
  }

  if (updatePasswordButton) {
    updatePasswordButton.addEventListener('click', async () => {
      try {
        await updateUser('/api/user/password', '.passwordInput', 'password');
      } catch (error) {
        console.error('Error updating password:', error);
      }
    });
  }
}

// Function to update user information (username or password)
async function updateUser(apiEndpoint, inputSelector, fieldName) {
  const inputField = document.querySelector(inputSelector);
  const newValue = inputField.value;
  const userId = WATCH_PARTY_USER_ID;

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId, [fieldName]: newValue })
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${fieldName}`);
    }

    console.log(`${fieldName} updated successfully`);
    document.getElementById(`${fieldName}UpdateSuccessMessage`).style.display = 'block';
  } catch (error) {
    throw new Error(`Error updating ${fieldName}: ${error.message}`);
  }
}

// Function to start polling for new messages
function startMessagePolling(roomId) {
  setInterval(function() {
    displayRoomMessages(roomId);
  }, 100); // Poll every 100 ms
}

// Function to display messages for a specific room
function displayRoomMessages(roomId) {
  if (!roomId) {
    console.error('Room ID is undefined');
    return;
  }

  fetch(`/api/room/${roomId}/messages`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch room messages');
      }
      return response.json();
    })
    .then(messages => {
      const chatHistory = document.querySelector('.messages');
      chatHistory.innerHTML = '';

      messages.forEach(message => {
        const messageElement = document.createElement('message');
        messageElement.innerHTML = `
          <author>${message.user_id}</author>
          <content>${message.body}</content>
        `;
        chatHistory.appendChild(messageElement);
      });
    })
    .catch(error => console.error('Error fetching room messages:', error));
}

// Update Room Name
document.addEventListener('DOMContentLoaded', function() {
  const editLink = document.querySelector('.roomData .display a');
  const editSection = document.querySelector('.roomData .edit');
  const roomNameInput = document.querySelector('.roomData .edit input');

  if (!editLink || !editSection) return;

  editLink.addEventListener('click', function (event) {
    event.preventDefault();

    editSection.classList.remove('hide');
    this.closest('h3').classList.add('hide');

    roomNameInput.value = document.querySelector('.roomData .roomName').textContent;
  });

  editSection.querySelector('a').addEventListener('click', function (event) {
    event.preventDefault();

    const roomId = document.querySelector('.roomData').getAttribute('data-room-id');
    const newRoomName = roomNameInput.value;
    fetch(`/api/room/name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({room_name: newRoomName, room_id: roomId})
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update room name');
      }
      return response.json();
    })
    .then(data => {
      document.querySelector('.roomData .roomName').textContent = newRoomName;
      editSection.classList.add('hide');
      editLink.closest('h3').classList.remove('hide');
    })
    .catch(error => {
      console.error('Error updating room name:', error);
    });
  });
});


// Function to post a message to a room
function postMessage(roomId) {
  const form = document.querySelector('.comment_box form');

  form.addEventListener('submit', function(event) {
    event.preventDefault();

    const message = form.querySelector('textarea[name="comment"]').value;
    const userId = document.querySelector('.comment_box').getAttribute('user-id');

    fetch(`/api/room/${roomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, user_id: userId })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to post message');
      }
      return response.json();
    })
    .then(data => {
      console.log('Message posted successfully:', data);
    })
    .catch(error => {
      console.error('Error posting message:', error);
    });
  });
}

// Function to clear chat history
function clearChatHistory() {
  const chatHistory = document.querySelector('.messages');
  chatHistory.innerHTML = '';
}
