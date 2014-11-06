

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
    if(message.type != SocketMessage.types.KINECT)
        this.data = (message.data == null) ? null : JSON.parse(message.data);
    else
        this.data = message.data;
    return true;
    
}

SocketMessage.prototype.getJSON = function()
{
    var msg = {type:this.type, data:this.data};
    if(this.data != null && this.type != SocketMessage.types.KINECT)
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
    KINECT: 6,
    ADD_KINECT: 7,
    REMOVE_KINECT: 8
};