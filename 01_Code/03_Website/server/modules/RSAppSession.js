

var AppSession = module.exports = function(id, appInfo)
{
    this.id = id;
    this.appInfo = appInfo;
    this.peers = [];
}

AppSession.prototype.addPeer = function( client )
{    
    for(var i in this.peers)
    {
        this.peers[i].addPeer( client.stationProfile );
        client.addPeer( this.peers[i].stationProfile );
    }
    client.session = this;
    this.peers.push(client);
    if(this.peers.length == this.appInfo.maxPeers)
            return true;
    return false;
}

AppSession.prototype.updatePeer = function( client )
{
    var index = -1;
    for(var i in this.peers)
    {
        if(this.peers[i].id == client.id)
            index = i;
    }
    
    if(index == -1)
    {
        console.log("!! peer cannot be updated, not found in this session");
        return false;
    }
    
    for(var i in this.peers)
    {
        this.peers[i].updatePeer( client.stationProfile );
    }
    return true;
}

AppSession.prototype.removePeer = function( client )
{
    var index = -1;
    for(var i in this.peers)
    {
        if(this.peers[i].id == client.id)
            index = i;
    }
    
    if(index == -1)
    {
        console.log("!! peer cannot be removed, not found in this session");
        return false;
    }
    
    for(var i in this.peers)
    {
        this.peers[i].removePeer( client.stationProfile );
    }
    this.peers.splice(i, 1);
    return true;
}