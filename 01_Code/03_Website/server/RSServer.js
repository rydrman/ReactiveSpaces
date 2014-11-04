var net = require('net');
var ClientManager = require('./modules/RSClientManager.js');
var Client = require('./modules/RSClient.js');

var manager = new ClientManager();
var server = net.createServer();

try{
    server.listen(8080);
    console.log("server listening on port " + server.address().port);
}
catch(e){
    console.log("server failed to start -> " + e);
}


server.on('connection', function(socket){
    
    manager.addClient( socket );
    
});

server.on('close', function(socket){
    
    console.log("All Connections Closed");
    
});


