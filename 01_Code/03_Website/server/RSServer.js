var net = require('net');
var ClientManager = require('./modules/RSClientManager.js');
var Client = require('./modules/RSClient.js');

var manager = new ClientManager();
var server = net.createServer();

server.listen(8080);
console.log("server listening on port " + server.address().port);

server.on('connection', function(socket){
    
    manager.addClient( socket );
    
});

server.on('close', function(socket){
    
    console.log("All Connections Closed");
    
});


