// use express
let express = require('express');

// create instance of express
let app = express();
app.use(express.static(__dirname));

app.use(function (request, result, next) {
    result.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

// use http with instance of express
let http = require('http').createServer(app);

// create socket instance with http
let io = require("socket.io")(http);

// use mysql
let mysql = require("mysql");

// create connection
let connection = mysql.createConnection({
    host: "localhost",
    user: "user",
    password: "root",
    database: "web_chat"
});

connection.connect(function (error, result) {
    // show error,  if any
});

// var users = [];
// add listener for new connection
io.on("connection", function (socket) {
    // this is socket for each user
    // server should listen from each client via its socket
    // set nickname of user
    socket.on("user_connected", function (userName) {
        console.log("User connected", socket.id);
        socket.nickname = userName;
        console.log("Client Name is", userName);
        // save name in array
        // users[userName] = socket.id;

        // socket ID will be used to send message individual person

        // notify all connected clients
        io.emit("user_connected", userName)
    });

    // server should listen from each client via its socket
    socket.on("new_message", function (data) {
        console.log("Client says", data);

        // save message in database
        let query = "insert into messages (message) values ('" + data + "')";
        connection.query(query, function (error, result) {
            console.log('error', error);
            // server will send message on all connected client
            io.emit("new_message", {
                id: result.insertId,
                message: data
            });
        });
    });

    // attach listener to receive message for delete

    socket.on("delete_message", function (messageID) {
        // delete from database
        connection.query("delete from messages where id = " + messageID, function (error, result) {
            console.log('error', error);

            // send event to all users
            io.emit("delete_message", messageID);
        });
    });
});

// route to handle requests
app.get("/", function (request, response) {
    response.send("Hello World")
});

// create API to get messages from table
app.get("/get_messages", function (request, response) {
    connection.query("select * from messages", function (error, messages) {
        response.end(JSON.stringify(messages));
    });
});


// start the server
let port = 3000;
http.listen(port, () => {
    console.log('server is running on port', port);
});
