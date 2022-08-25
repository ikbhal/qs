const e = require("express");
var randomWords = require('random-words');
var tables = [];

function getTables() {
    return tables;
}

// when will remove from table -> on loss, or win or time out  todo
function removeUserFromTable(username){
    console.log("inside removeUserFromTable username:", username);
    if(!tables || tables.length === 0) {
        console.warn("no tables to remove");
        return;
    }

    for(var i =0;i<tables.length;i++){
        var t = tables[i];
        if(!t || !('members' in t)){
            continue;
        } 
        var mi = t.members.findIndex(m => m.username === username);
        if(mi !=-1){ //delete member entry from table
            t.members.splice(mi,1);
        }
        // delete table if zero members 
        if( !t || !('members' in t) || t.members.length ==0){
            tables.splice(i,1);
            i--;// note we are deleting current element thats why, length will reduce
        } 
    }
}
function assignTable( username){
    if(tables.length ==0){
      var tableName = 't' + (tables.length+1);
      var table = {id: tableName, members:[{username}]};
      tables.push(table);
      return table;
    }
    var tindex = tables.findIndex( t => t.members.length <3);

    // why not assign same table if existing table
    if(tindex !=-1){// found table
      var table = tables[tindex];
      table.members.push({username});
      return table;
    }else{// create table
      var tableName = 't' + (tables.length+1);
      var table = {id: tableName, members:[{username}]};
      tables.push(table);
      return table;
    }
}

function assignQuestion(username){
    // check if username exist in any table - assumption take it for now
    // find the table assigned to username  - find 
    var table =  getTable(username);
    if(table == null){
        console.log("username :" , username ," does not exist in tables");
        // why not assign table 
        table = assignTable(username);
        // return null;
    }
    var qobj =null;
    // create question for table if not assigned 
    if(! ('question'  in table)){
        qobj = createQuestion();
        table.question = qobj;
    }else{
        qobj = table.question;
    }
    // return question 
    return table;
}

function createQuestion() {
    var n1 = Math.round(Math.random() * 10);
    var n2 = Math.round(Math.random() * 10) ;
    var operator = '+';
    var question  = n1 + " " + operator + " "+ n2 +" ?";
    var answer = '';
    switch(operator){
      case '+': answer = n1+ n2;break;
      default: answer= n1+n2; break;
    }
    const qobj = {
      q: question,
      a: answer
    }

    return qobj;
}
//testComplete(username, q, ua, timeout);
//testComplete(socket, username, q, ua, timeout);
function testComplete(io, socket, username, q, ua, timeout){
    console.log("inside test complete server helper function ",
        " username: ", username, 
        ", q: ", q ,
        ", ua:", ua,
        ", timeout: ", timeout);

    var table = getTable(username);
    if(!table){
        console.error("table not found for username: ", username);
        return;
    }
    var question = table.question;
    if(question){
        if(question.a == ua){
            //correct

            // check if winner is set  or not 
            if('winner' in table){
                // lost test by slow submit 
                socket.emit('test_status', {status: 'lose', 'message': 'right but slow'})
            }else{
                // not set  ->  update clients, all in table
                io.to(table.id).emit('test_status', {status: 'win', 'message': 'won', username});
                const timestamp = Date.now();
                table.winner = {username, timestamp };
            }

        }else{
            //wrong 
            socket.emit('test_status', {status: 'lose', 'message': 'wrong answer'})
        }
    }
}

function getTable(username){
    console.log("inside get table for username: ", username);
    var table = tables.find(t => {
        if (t == null | ! ('members' in t)){
            return false;
        }
        var mi = t.members.findIndex(m =>m.username == username)
        if(mi !=-1)
            return true;
        else 
            return false;
    });

    return table;
}

// no table assign, only user creation , append to users
function createUser(users){
    console.log("inside createuser  in users:", users);

    var username = generateUserName();
    var user  = {username};
    users.push(user);

    return user;
}

function generateUserName(){
    console.log("inside generateUsername");
    var username = randomWords({ exactly: 5, join: '-' });
    return username;
}
module.exports = {assignTable, assignQuestion,
    testComplete, removeUserFromTable, 
    getTable,
    getTables, createUser};