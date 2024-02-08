/* For index.html */

// TODO: If a user clicks to create a chat, create an auth key for them
// and save it. Redirect the user to /chat/<chat_id>
function createChat() {

}

/* For chat.html */

// TODO: Fetch the list of existing chat messages.
// POST to the API when the user posts a new message.
// Automatically poll for new messages on a regular interval.
function postMessage(roomId, message) {
  fetch(`/api/messages/${roomId}`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}` // assuming apiKey is defined somewhere
      },
      body: JSON.stringify({ message: message })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to post message');
      }
      // Message posted successfully
  })
  .catch(error => {
      console.error('Error posting message:', error);
  });
}

// Function to fetch messages from the server
function getMessages(roomId) {
  fetch(`/api/messages/${roomId}`, {
      headers: {
          'Authorization': `Bearer ${apiKey}` // assuming apiKey is defined somewhere
      }
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to fetch messages');
      }
      return response.json();
  })
  .then(data => {
      // Handle received messages
      const messages = data.messages;
      // Your logic to display messages in the chat UI
  })
  .catch(error => {
      console.error('Error fetching messages:', error);
  });
}

function startMessagePolling(roomId) {
  setInterval(() => {
      getMessages(roomId);
  }, 100);
}

// When a chat room page first loads, clear any sample messages out of the chat history but keep the chat history.
document.addEventListener('DOMContentLoaded', () => {
  const sampleMessages = document.querySelectorAll('.sample-message');

  sampleMessages.forEach(sampleMessage => {
      sampleMessage.remove();
  });
});