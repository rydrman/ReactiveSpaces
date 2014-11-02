var Client = require('./RSClient.js');
var AppSession = require('./RSAppSession');

var ClientManager = module.exports = function()
{
    this.nextID = 100000;
    this.clients = [];
    this.sessions = [];
    this.openSessions = [];
}

ClientManager.prototype.addClient = function( socket )
{
    var newClient = new Client( socket );
    
    //give it an ID
    newClient.id = this.nextID++;
    
    //set callbacks
    var self = this;
    newClient.onClose = function(client){
        self.removeClient.call(self, client);
    };
    newClient.onAppConnected = function(client){
        self.matchClient.call(self, client);
    };
    newClient.onAppDisconnected = function(client){
        self.unmatchClient.call(self, client);
    };
    this.clients.push( newClient );
    
    console.log("Client Connected " + newClient.socket.remoteAddress + ":" + newClient.socket.remotePort);
}

ClientManager.prototype.matchClient = function(client)
{
    var session;
    
    //look for a session
    for(var i in this.openSessions)
    {
        session = this.openSessions[i];
        
        if(session.appInfo.name == client.appInfo.name 
           && session.appInfo.version == client.appInfo.version)
        {
            var result = session.addPeer( client );
            
            console.log("Client matched to session " + session.id);
            
            //it's full
            if(result == true)
            {
                console.log("Session " + session.id + " full");
                this.openSessions.splice(i, 1);
                return;
            }
        }
    }
    
    //create a new session
    var session = new AppSession(this.sessions.length, client.appInfo );
    var result = session.addPeer(client);
    this.sessions.push(session);
    console.log("New Session " + session.id + " added for client " + client.stationProfile.name);
    if(!result)
    {
        console.log("Session " + session.id + " open for more peers");
        this.openSessions.push(session);
    }
    
}

ClientManager.prototype.unmatchClient = function(client)
{
    console.log("TODO: unmatch client");
}
                            
ClientManager.prototype.removeClient = function( client )
{
    this.clients.splice(this.clients.indexOf(client), 1);
    
    console.log("Client Disconnected " + client.stationProfile.name + " , " + client.stationProfile.location);
    console.log("Clients Remaining: " + this.clients.length);
}

