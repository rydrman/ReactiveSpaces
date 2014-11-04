var SocketMessage = require('./RSSocketMessage.js');

var Client = module.exports = function(socket)
{
    this.id = -1;
    this.ready = false;
    this.locked = false;
    this.sendTimeout = 1000;
    
    this.session = null;
    
    this.stationProfile = {
        name: "unset",
        location: "unset",
        id: -1
    };
    this.appInfo = null;
    
    this.socket = socket;
    this.socket.setEncoding('utf8');
    this.messagePiece = null;
    
    //events
    this.onClose = null;
    this.onProfileUpdated = null;
    this.onAppConnected = null;
    this.onAppDisconnected = null;
    this.onCustomData = null;
    
    var self = this;
    socket.on('end', function(){self.onDisconnect.call(self)});
    socket.on('error', function(e){self.onError.call(self, e)});
    socket.on('data', function(data){self.onData.call(self, data)});
    
    //var message = new SocketMessage( SocketMessage.Types.MESSAGE, "hi" );
    
    //socket.write(JSON.stringify(message));
};

Client.prototype.profileRecieved = function( id )
{
    if(this.ready)
    {
        console.log("Client " + this.id + " profile updated: " + this.stationProfile.name + " , " + this.stationProfile.location);
        if(this.onProfileUpdated != null)
        {
            this.onProfileUpdated(this);
        }
        return;
    }

    console.log("Client profile " + this.id +" recieved: " + this.stationProfile.name + " , " + this.stationProfile.location);
    this.stationProfile.id = this.id;

    //send to client
    var message = new SocketMessage(SocketMessage.types.STATION_PROFILE, this.stationProfile);
    var string = message.getJSON();

    this.socket.write(string + "\0");

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
    
    this.trySend(string);
}

Client.prototype.updatePeer = function( profile )
{
    var message = new SocketMessage(SocketMessage.types.PEER_UPDATE, profile);
    var string = message.getJSON();

    this.trySend(string);
}

Client.prototype.removePeer = function( profile )
{
    var message = new SocketMessage(SocketMessage.types.PEER_DISCONNECT, profile);
    var string = message.getJSON();

    this.trySend(string);
}

Client.prototype.sendCustomData = function( message )
{
    var string = message.getJSON();
    this.trySend(string);
}

Client.prototype.sendKinectData = function( message )
{
    
    var string = message.getJSON();
    this.trySend(string);
}

Client.prototype.appDisconected = function()
{
    if(this.appInfo != null)
        console.log("Client app disconnected " + this.stationProfile.name + "(" + this.id + ")");
    if(null != this.onAppDisconnected)
        this.onAppDisconnected(this);
    this.appInfo = null;
}

Client.prototype.onDisconnect = function()
{
    this.appDisconected();
    if(this.onClose != null)
        this.onClose(this);
}

Client.prototype.onData = function(json)
{
    if(this.messagePiece != null)
    {
        json = this.messagePiece + json;
        //console.log("end piece concat");
    }
    this.messagePiece = null;
    
    var messages = json.split('\0');
    for(var i in messages)
    {
        if(messages[i] == "") continue;
        
        var message = new SocketMessage();
        var success = message.SetFromIncoming( messages[i] );

        if(!success)
        {

            this.messagePiece = messages[i];
            //console.log("piece stored"); 
            
            continue;
        }
        
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
                
            case SocketMessage.types.CUSTOM:
                //add my id and re-encode
                var newData = {
                    id: this.id,
                    userData: message.data
                }
                message.data = JSON.stringify(newData);
                if(this.onCustomData != null)
                    this.onCustomData(this, message);
                continue;
                
            case SocketMessage.types.KINECT:
                if(this.onKinectData != null)
                    this.onKinectData(this, message);
                continue;
                
            default:
                console.log("Message recieved of unknown type: " + message.type);
                continue;
        }
        console.log("\n< " + message.type + " ------------------------------>\n");
    }
    
}

Client.prototype.trySend = function(string)
{
    if(this.locked)
    {
        var start = new Date().getMilliseconds;
        while(this.locked)
        {
            if(Date().getMilliseconds - start > this.sendTimeout)
            {
                console.log("message send timeout");
                return;
            }
        }
    }
    
    this.locked = true;
    try{
        this.socket.write(string + "\0");
    }
    catch(e)
    {
        console.log("send exceptionCaugt: " + e.message);
        this.onDisconnect();
        if(this.socket.close)
            this.socket.close();
    }
    this.locked = false;
}

Client.prototype.onError = function(e)
{
    console.log("Exception caught ->" + e);
    console.log("Attempt to close connection...");
    //socket exception.. break it off
    if(typeof(this.socket.end) == 'function')
    {
        this.socket.end();
        console.log("success");
    }
    else
    {
        console.log("failed. Removing entry...");
        this.onDisconnect();
    }
}
