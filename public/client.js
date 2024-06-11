$(document).ready(function () {
  /*global io*/
  let socket = io();

  socket.on('user', (data) => {
    $('#num-users').text(data.currentUsers + ' users online');
    let message = data.username + (data.connected ? ' has ' : ' has left ') + 'the chat.';
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    let messageToSend = $('#m').val();
    // Send the message to the server here?
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});