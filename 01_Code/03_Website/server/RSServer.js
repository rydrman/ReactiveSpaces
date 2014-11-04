var net = require('net');
var ClientManager = require('./modules/RSClientManager.js');
var Client = require('./modules/RSClient.js');

var manager = new ClientManager();
var server = net.createServer();

//first setup graceful
process.on( 'SIGINT', function() {
    console.log( "\nServer Shutdown\n" );
    manager.closeAll();
    process.exit( );
})

console.log("");
console.log("////////////////////////////////");
console.log("////    REACTIVE SPACES     ////");
console.log("////        SERVER          ////");
console.log("////////////////////////////////");
console.log("\nServer launching...");


try{
    server.listen(8080);
    
    console.log("Success!!");
    console.log("Server listening on port " + server.address().port + "\n");
    
    console.log("LOG START");
    console.log("vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv\n");
}
catch(e){
    console.log("Server failed to start -> " + e);
    console.log("Exiting\n");
    process.exit();
}


server.on('connection', function(socket){
    
    manager.addClient( socket );
    
});

server.on('close', function(socket){
    
    console.log("All Connections Closed");
    
});


