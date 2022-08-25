const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require('cors');
const {assignTable, getTables, 
  assignQuestion, testComplete,
  removeUserFromTable,// not sure where to use , may be in table.js only
  createUser} = require('./table');

const port = process.env.PORT || 4001;
const index = require("./routes/index");
//https://www.tutorialspoint.com/socket.io/socket.io_chat_application.htm
users = [];
// tables = [];

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
  // interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on('start_test', (username) => {
    console.log("start test command received");
    if(!username){
      //if user name is not sent, generate username,  send usetSet event also 
      //socket.emit('userSet', username);
      // socket.emit('userSet', {username: data, table });
      // generate user  , send only event 
      var user = createUser(users);
      username = user.username;
    }
    // will send question, answer to you soon
    var table = assignQuestion(username);
    
    // socket.emit("start_test_response", qobj);
    if(table) {
      io.to(table.id).emit('start_test_response', table)
    } else{
      console.log("ERROR **  table not found for username: " , username);
    }
    // var n1 = Math.round(Math.random() * 10);
    // var n2 = Math.round(Math.random() * 10) ;
    // var operator = '+';
    // var question  = n1 + " " + operator + " "+ n2 +" ?";
    // var answer = '';
    // switch(operator){
    //   case '+': answer = n1+ n2;break;
    //   default: answer= n1+n2; break;
    // }
    // const response = {
    //   q: question,
    //   a: answer
    // }

    // var username = 'u' + users.length;
    // users.push({username: username, })

    // socket.emit('userSet', {username: data});
    // Emitting a new message. Will be consumed by the client
    // console.log("start test response: ", response);
    // socket.emit("start_test_response", response);
    // socket.emit("FromAPI", "start respon will sennt soon");
  })

  socket.on('test_complete', (data) =>{
    console.log("inside test_complete event callback data:",data);

    //socket.emit('test_complete', {ua, q, username:name});
    //socket.emit('test_complete', {timeout:true, q, username:name});
    var ua = 'ua' in data ? data.ua : '';
    var timeout = 'timeout' in data ? data.timeout: false;
    var q = data.q;
    var username = data.username;

    testComplete(io, socket, username, q, ua, timeout);
  });

  socket.on('setUsername', function(data){
    console.log("inside setUsername");
    var username = data;
    console.log("users:",users);
    console.log("data:", data);
    var i = users.indexOf(data);
    console.log("i:", i);
    if(users.indexOf(data) <0){
       users.push({username});
       
       console.log("emit userset");
       var table = assignTable(username);
       socket.join(table.id);
       socket.emit('userSet', {username: data, table });
      //  socket.broadcast('member_updated',table);
      //displays a joined room message to all other room users except that particular user
      // change event body, or event name, handle recieve side
      // socket.broadcast.to(table.id).emit("member_updated", table);
      io.to(table.id).emit('member_updated', table);
    } else {
       console.log("emit user exists");
       console.log("users in exists: ", users);
       socket.emit('userExists', data + ' username is taken! Try some other username.');
   }
 });

  socket.on('leave_table', (data)=>{
    console.log('leave_table event server callback data:',data);
    var username = data.username;
    removeUserFromTable(username);
    // TODO intimate other table members
    var table = getTable(username);
    if(table){ // if table exist
      io.to(table.id).emit('leave_table_response', {message:"left table", username})
    }
    // TODO handle at front end  leave_table_reesponse
    // socket.emit('leave_table_response', {message:"left table", username});
  });
//  const leaveTable = () =>{
//   console.log("inside leave table");
//   socket.emit('leave_table', {username:name});
// }

// const leaveAndJoinNewTable = () =>{
//   socket.emit('leave_and_join_new_table', {username: name});
// }

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

const getApiAndEmit = socket => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};

server.listen(port, () => console.log(`Listening on port ${port}`));