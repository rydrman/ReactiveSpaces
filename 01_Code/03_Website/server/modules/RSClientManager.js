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
    var newClient = new Client( socket, this.nextID++ );
    
    //set callbacks
    var self = this;
    newClient.onClose = function(client){
        self.removeClient.call(self, client);
    };
    newClient.onProfileUpdated = function(client){
        self.clientProfileUpdated.call(self, client);
    };
    newClient.onAppConnected = function(client){
        self.matchClient.call(self, client);
    };
    newClient.onAppDisconnected = function(client){
        self.unmatchClient.call(self, client);
    };
    newClient.passData = function(client, message){
        self.passData.call(self, client, message);
    }
    this.clients.push( newClient );
    
    console.log("Client Connected " + newClient.socket.remoteAddress + ":" + newClient.socket.remotePort);
}

ClientManager.prototype.clientProfileUpdated = function(client)
{
    if(client.session != null)
        client.session.updatePeer(client);
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
            
            console.log("Client matched to session " + session.id + " -> " + session.peers.length);
            
            //it's full
            if(result == true)
            {
                console.log("Session " + session.id + " full" + " -> " + session.peers.length);
                this.openSessions.splice(i, 1);
            }
            return;
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
    var session = client.session;
    if(session != null)
    {
        var success = session.removePeer(client);
        client.session = null;
        
        if(success)
            console.log("Client " + client.stationProfile.name + "(" + client.id + ") removed from session " + session.id + " -> " + session.peers.length);
        
        if(session.peers.length == 0)
        {
            //close session
            session = null;
            var index = this.openSessions.indexOf(session);
            if(index != -1)
                this.openSessions.splice(index, 1);
        }
        else
        {
            //open if back up 
            var index = this.openSessions.indexOf(session);
            if(index == -1)
                this.openSessions.push(session);
        }
    }
    else
        console.log("No client session to Unmatch");

}
                            
ClientManager.prototype.removeClient = function( client )
{
    var index = -1;
    for(var i in this.clients)
    {
        if(this.clients[i].id == client.id)
        {
            index = i;
            break;
        }
    }
    if(index != -1)
    {
        this.clients.splice(index, 1);
        console.log("Client Disconnected " + client.stationProfile.name + " , " + client.stationProfile.location);
    }
    else
    {
        console.log("Error: Cannot remove client... not found");
        var out = "";
        out += client.id;
        out += "[ ";
        for(var i in this.clients)
        {
            if(i != 0)
                out += ", ";
            out += this.clients[i].id;
        }
        console.log(out + " ]");
        //this.closeAll();
        //process.exit();
        
    }
    
    console.log("Clients Remaining: " + this.clients.length);
    console.log("\n< ! ------------------------------>\n");
}

ClientManager.prototype.passData = function(client, message)
{
    if(client.session == null)
    {
        return;
    }
    
    var result = client.session.passData(client, message);
    if(false == result)
    {
        client.session = null;
        this.matchClient(client);
    }
    
}

ClientManager.prototype.closeAll = function()
{
    for(var i in this.clients)
    {
        this.clients[i].locked = true;
    }
    for(var i in this.clients)
    {
        try{
            this.clients[i].socket.end();
        }
        catch(e)
        {
            console.log("Issue closing client " + this.clients[i].stationProfile.name + " (" + this.clients[i].id + ") -> " + e);
        }
    }
}
