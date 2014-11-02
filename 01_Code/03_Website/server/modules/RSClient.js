var SocketMessage = require('./RSSocketMessage.js');

var Client = module.exports = function(socket)
{
    this.id = -1;
    this.ready = false;
    
    this.session = null;
    
    this.stationProfile = {
        name: "unset",
        location: "unset",
        sessionID: -1
    };
    this.appInfo = null;
    
    this.socket = socket;
    this.socket.setEncoding('utf8');
    
    //events
    this.onClose = null;
    this.onAppConnected = null;
    this.onAppDisconnected = null;
    
    var self = this;
    socket.on('end', function(){self.onDisconnect.call(self)});
    socket.on('data', function(data){self.onData.call(self, data)});
    
    //var message = new SocketMessage( SocketMessage.Types.MESSAGE, "hi" );
    
    //socket.write(JSON.stringify(message));
};

Client.prototype.profileRecieved = function( id )
{
    if(this.ready)
    {
        console.log("Client profile updated: " + this.stationProfile.name + " , " + this.stationProfile.location);
        return;
    }

    console.log("Client profile recieved: " + this.stationProfile.name + " , " + this.stationProfile.location);
    this.stationProfile.sessionID = this.id;

    //send to client
    var message = new SocketMessage(SocketMessage.types.STATION_PROFILE, this.stationProfile);
    var string = message.getJSON();

    this.socket.write(string);

    this.ready = true;
}

Client.prototype.appConnected = function()
{
    console.log("Client app connected: " + this.appInfo.name + " : " + this.appInfo.version);
    console.log("Client app Max Peers: " + this.appInfo.maxPeers);
    
    if(null != this.onAppConnected)
        this.onAppConnected(this);
}

Client.prototype.addPeer = function( profile )
{
    var message = new SocketMessage(SocketMessage.types.PEER_CONNECT, profile);
    var string = message.getJSON();

    this.socket.write(string);
}

Client.prototype.updatePeer = function( profile )
{
    var message = new SocketMessage(SocketMessage.types.PEER_UPDATE, profile);
    var string = message.getJSON();

    this.socket.write(string);
}

Client.prototype.removePeer = function( profile )
{
    var message = new SocketMessage(SocketMessage.types.PEER_DISCONNECT, profile);
    var string = message.getJSON();

    this.socket.write(string);
}

Client.prototype.appDisconected = function()
{
    if(null != this.onAppDisconnected)
        this.onAppDisconnected(this);
    this.appInfo = null;
}

Client.prototype.onDisconnect = function()
{
    if(this.onClose != null)
        this.onClose(this);
}

Client.prototype.onData = function(json)
{
    var message = new SocketMessage();
    message.SetFromIncoming( json );
    
    switch(message.type)
    {    
        case SocketMessage.types.APP_INFO:
            if(message.data == null)
            {
                this.appDisconected();
                break;
            }
            this.appInfo = message.data;
            this.appConnected();
            break;
            
        case SocketMessage.types.STATION_PROFILE:
            this.stationProfile.name = message.data.name;
            this.stationProfile.location = message.data.location;
            this.profileRecieved();
            break;
            
        default:
            console.log("Message recieved of unknown type: " + message.type);
    }
}
