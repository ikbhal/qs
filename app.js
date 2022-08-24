const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');

const port = process.env.PORT || 4001;
const index = require("./routes/index");
//https://www.tutorialspoint.com/socket.io/socket.io_chat_application.htm
users = [];
const app = express();
app.use(index);
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server);
let interval;

io.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on('start_test', () => {
    console.log("start test command received");
    // will send question, answer to you soon 
    const response = {
      q: '3 +2?',
      a: '20'
    }
    // Emitting a new message. Will be consumed by the client
    // socket.emit("start_test_response", response);
    socket.emit("FromAPI", "start respon will sennt soon");
  })

  socket.on('setUsername', function(data){
    console.log("inside setUsername");
    console.log("users:",users);
    console.log("data:", data);
    var i = users.indexOf(data);
    console.log("i:", i);
    if(users.indexOf(data) <0){
       users.push(data);
       console.log("emit userset");
       socket.emit('userSet', {username: data});
    } else {
       console.log("emit user exists");
       console.log("users in exists: ", users);
       socket.emit('userExists', data + ' username is taken! Try some other username.');
   }
 });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

const getApiAndEmit = socket => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);

  const qres = {
    q: '3 +2?',
    a: '20'
  }
  socket.emit("start_test_response", qres);
};

server.listen(port, () => console.log(`Listening on port ${port}`));