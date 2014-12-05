var SocketMessage = require('./RSSocketMessage.js');

var Client = module.exports = function(socket, id)
{
    this.id = id;
    this.active = true;
    this.ready = false;
    this.locked = false;
    this.sendTimeout = 1000;
    
    this.lostMessages = 0;
    
    this.session = null;
    
    this.stationProfile = {
        name: "unset",
        location: "unset",
        id: id
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
    this.passData = null;
    
    var self = this;
    socket.on('end', function(){self.onDisconnect.call(self)});
    socket.on('error', function(e){self.onError.call(self, e)});
    socket.on('data', function(data){self.onData.call(self, data)});
    
    //socket.setKeepAlive(true, 2000);
    
    this.aliveInterval = setInterval(function(){self.checkAlive.call(self)}, 5000);
    this.aliveTimeout = null;
    //var message = new SocketMessage( SocketMessage.Types.MESSAGE, "hi" );
    
    //socket.write(JSON.stringify(message));
};

Client.prototype.checkAlive = function()
{
    var msg = new SocketMessage(SocketMessage.types.KEEP_ALIVE, {});  
    this.trySend(msg.getJSON());
    
    var self = this;
    this.aliveTimeout = setTimeout(function(){self.aliveTimeoutCallback.call(self)}, 4000);
}

Client.prototype.aliveTimeoutCallback = function()
{
    console.log("Socket timed-out, disconnecting...");
    if(typeof(this.socket.end) == 'function')
    {
        this.socket.end();
        this.onDisconnect();
        //console.log("success");
    }
    else
    {
        console.log("failed. Removing entry...");
        this.onDisconnect();
    }
}

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
    var result = this.trySend(message.getJSON());

    if(!result) console.log("issue sending new station profile to client " + this.id);
    
    this.ready = true;
}

Client.prototype.appConnected = function()
{
    console.log("Client app connected: " + this.appInfo.name + " : " + this.appInfo.version);
    console.log("Client app Max Peers: " + this.appInfo.maxPeers);
    console.log("Client app features: " + this.appInfo.features.toString());
                
    //check features
    var missing = [];
    for(var i in this.appInfo.features)
    {
        if(this.stationProfile.features.indexOf(this.appInfo.features[i]) == -1)
        {
            missing.push(this.appInfo.features[i]);
        }
    }
    if(missing.length > 0)
    {
        var message = new SocketMessage();
        message.type = SocketMessage.types.FEATURE_MISSING;
        message.data = missing;
        this.trySend(message.getJSON());
        console.log("Features Missing, no session matching: " + missing.toString());
        return;
    }
    
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

Client.prototype.sendData = function( message )
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
    this.active = false;
    this.appDisconected();
    clearInterval(this.aliveInterval);
    if(this.onClose != null)
        this.onClose(this);
    console.log("client disconnect " + this.id);
}

Client.prototype.onData = function(json)
{
    if(!this.active)
        return;
    
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
            if(parseInt(i) == messages.length-1)
            {
                this.messagePiece = messages[i];
            }
            else
            {
                this.lostMessages++;
                console.log("message lost -> " + this.lostMessages); 
            }
            
            continue;
        }
        
        //console.log("message recieved -> " + message.type);
        
        switch(message.type)
        {    
            case SocketMessage.types.APP_INFO:
                if(message.data == null)
                {
                    if(this.appInfo != null)
                        this.appDisconected();
                    break;
                }
                this.appInfo = message.data;
                this.appConnected();
                break;

            case SocketMessage.types.STATION_PROFILE:
                this.stationProfile.name = message.data.name;
                this.stationProfile.location = message.data.location;
                this.stationProfile.features = message.data.features;
                this.profileRecieved();
                break;
                
            case SocketMessage.types.CUSTOM:
                //add my id and re-encode
                var newData = {
                    id: this.id,
                    userData: message.data
                }
                message.data = JSON.stringify(newData);
                //continue onto pass data
                
            case SocketMessage.types.ADD_KINECT:
            case SocketMessage.types.KINECT:
            case SocketMessage.types.REMOVE_KINECT:
                
                if(this.passData != null)
                    this.passData(this, message);
                continue;
                
            case SocketMessage.types.KEEP_ALIVE:
                if(null != this.aliveTimeout)
                {
                    clearTimeout(this.aliveTimeout);
                    this.aliveTimeout = null;
                }
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
                return false;
            }
        }
    }
    
    this.locked = true;
    try{
        this.socket.write(string + "\0");
    }
    catch(e)
    {
        console.log("send exceptionCaught: " + e.message);
        this.onDisconnect();
        if(this.socket.close)
            this.socket.close();
        this.locked = false;
        return false;
    }
    this.locked = false;
    return true;
}

Client.prototype.onError = function(e)
{
    if(!this.active)
        return;
    
    this.active = false;
    console.log("Exception caught -> " + e);
    console.log("Attempt to close connection...");
    //socket exception.. break it off
    if(typeof(this.socket.end) == 'function')
    {
        this.socket.end();
        this.onDisconnect();
        //console.log("success");
    }
    else
    {
        console.log("failed. Removing entry...");
        this.onDisconnect();
    }
}
