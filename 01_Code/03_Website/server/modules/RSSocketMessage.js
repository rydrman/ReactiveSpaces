

var SocketMessage = module.exports = function(type, data)
{
    this.type = (typeof(type) == 'undefined') ? null : type;
    this.data = (typeof(data) == 'undefined') ? null : data;
}

SocketMessage.prototype.SetFromIncoming = function(json)
{
    try{
        var message = JSON.parse(json);
    }
    catch(e)
    {
        //DEBUG
        //console.log(e.message);
        //console.log(json);
        return false;
    }
    
    this.type = message.type;
    this.data = (message.data == null) ? null : JSON.parse(message.data);
    return true;
    
}

SocketMessage.prototype.getJSON = function()
{
    var msg = {type:this.type, data:null};
    if(this.data != null)
        msg.data = JSON.stringify(this.data);
    
    return JSON.stringify(msg) + "\0";
}

SocketMessage.types = {
    APP_INFO : 0,
    STATION_PROFILE: 1,
    PEER_CONNECT: 2,
    PEER_UPDATE: 3,
    PEER_DISCONNECT: 4,
    CUSTOM: 5,
    KINECT: 6
};