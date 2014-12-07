//////////////////////////////////////////////////////
////             Initial Declaration              ////
//////////////////////////////////////////////////////

window.RS = window.ReactiveSpaces = {version: 0.1};

//////////////////////////////////////////////////////
////           Constants and Variables            ////
//////////////////////////////////////////////////////

//region

//constants and settings etc
RS.BASEURL = "ws://localhost";
RS.LOCALPORT = 8081;
RS.MESSAGE_DELAY = 100;
RS.SUPORTED_PLAYERS = 2;
RS.MOVEMENT_BLENDING = true;

//app info
RS.appInfo = {
    name: "Default App Name",
    version: 0,
    maxPeers: 4
}

//connection vars
RS.socketSupported = false;
RS.socket = null;
RS.connected = false;
//RS.userClosed = false;
RS.lastMessage = new Date().getTime();

//to keep station profiles
RS.station = null;
RS.remoteStations = [];

//to keep skeletons
RS.players = [];
RS.remotePlayers = [];
RS.lastBlendUpdate = new Date().getTime();

//to store event listeners
RS.listeners = [];

//for error reporting
//gets over written when messenger is included
RS.messenger = {display:function(t,m,s,ms){
    console.log( "RS: " + m + " -> " +s);
}};
Message = {};
Message.type = {
    "MESSAGE" : 0,
    "WARNING" : 1,
    "ERROR" : 2
}

//endregion

//////////////////////////////////////////////////////
////                 Setup Logic                  ////
//////////////////////////////////////////////////////

//region

//check for web socket
if(window.MozWebSocket) window.WebSocket = window.MozWebSocket;
if(window.WebkitWebSocket) window.WebSocket = window.WebkitWebSocket;

if(window.WebSocket)
    RS.socketSupported = true;

//endregion

//////////////////////////////////////////////////////
////                  Functions                   ////
//////////////////////////////////////////////////////

//region

RS.Connect = function( appName, appVersion, features, port )
{
    if(!RS.socketSupported)
    {
        RS.messenger.display(Message.type.ERROR, "Web Sockets are not supported by your browser.", "Please upgrade to a newer web browser.");
    }
    
    //check for connection
    if(RS.connected)
    {
        RS.Disconnect();
    }
    
    //set params if defined
    if(typeof(appName) != 'undefined') RS.appInfo.name = appName;
    if(typeof(appVersion) != 'undefined') RS.appInfo.version = appVersion;
    if(typeof(features) != 'undefined') RS.appInfo.features = features;
    if(typeof(RS.appInfo.features) == 'number') RS.appInfo.features = [features];
    if(typeof(port) != 'undefined') RS.LOCALPORT = port;

    //set/reset
    RS.players = [];
    for(var i = 0; i < RS.SUPORTED_PLAYERS; ++i)
    {
        RS.players[i] = new RS.Skeleton();
        RS.players[i].playerNumber = i;
    }
    RS.remotePlayers = [];
    
    RS.station = new RS.StationProfile();
    RS.remoteStations = [];
    
    //check for support
    if(!RS.socketSupported)
    {
        RS.messenger.display(Message.type.ERROR, "Web Sockets not supported.", "Please upgrade to a compatible browser");
        return false;
    }
    
    //RS.userClosed = false;
    RS.OpenSocket();
    
    //unload event
    var f = window.onbeforeunload;
    window.onbeforeunload = function()
    {
        if(typeof(f) == 'funciton') f();
        RS.Disconnect();
    }
    
    return true;
} 

RS.OpenSocket = function()
{
    if(RS.connected || RS.socket != null)
        return;
    
    try{
        RS.socket = new WebSocket(RS.BASEURL + ":" + RS.LOCALPORT + "/ReactiveSpaces");
    }
    catch(e)
    {
        RS.messenger.display(Message.type.ERROR, "Web Socket Error: Is the desktop app running?", "Check Developper console for more information (F12)");
    }
    
    RS.socket.onopen = RS.SocketOpened;
    RS.socket.onclose = RS.SocketClosed;
    RS.socket.onmessage = RS.MessageRecieved;
    RS.socket.onerror = RS.SocketError;
}

RS.Disconnect = function()
{
    if(null != RS.socket)
        RS.socket.close();
    RS.connected = false;
    //RS.userClosed = true;
}

RS.SocketError = function(err)
{
    RS.messenger.display(Message.type.ERROR, "Web Socket Error: Is the desktop app running?", "Check Developper console for more information (F12)");
    console.log(err);
    RS.connected = false;
    //try reconnecting
    //RS.OpenSocket();
}

RS.SocketOpened = function()
{
    var msg = {
        type : RS.MessageTypes.APP_INFO,
        data : JSON.stringify(RS.appInfo)
    };
    
    RS.connected = true;
    
    RS.socket.send(JSON.stringify(msg) + "\0");
    
    console.log("REACTIVE SPACES: connected to " + RS.socket.url);
    
    if(RS.MOVEMENT_BLENDING)
        window.requestAnimationFrame(RS.BlendUpdate);
    
    RS.fireEvent(RS.Events.connect);
}

RS.BlendUpdate = function()
{
    if(RS.connected)
        window.requestAnimationFrame(RS.BlendUpdate);
    
    var now = new Date().getTime();
    var deltaTimeS = (now - RS.lastBlendUpdate) * 0.001;
    RS.lastBlendUpdate = now;
    
    for(var i in RS.players)
        RS.players[i].BlendUpdate( deltaTimeS );
    for(var i in RS.remotePlayers)
        RS.remotePlayers[i].BlendUpdate( deltaTimeS );
}

RS.SocketClosed = function()
{
    RS.socket = null;
    if(RS.connected)
    {
        RS.connected = false;
        console.log("REACTIVE SPACES: disconnected from desktop app.");
        RS.fireEvent(RS.Events.disconnect);
    }
    
    //if(!RS.userClosed)
    //    RS.OpenSocket();
}

RS.MessageRecieved = function(e)
{
    var messages = e.data.split('\0');
    
    for(var i in messages)
    {
        if(messages[i] == "") continue;
        
        var message;
        try{
            message = JSON.parse(messages[i]);
        }
        catch(e){
            continue;
        }
        
        try{
            message.data = JSON.parse(message.data);
        }
        catch(e)
        {
            RS.messenger.display(Message.type.ERROR, "Cannot parse incoming message data");
        }
        
        switch(message.type)
        {
            //// FEATURES ////
            case RS.MessageTypes.FEATURE_MISSING:
                RS.fireEvent(RS.Events.featuremissing, message.data);
                break;
                
            //// LOCAL DATA ////
            case RS.MessageTypes.STATION_PROFILE:
                RS.station.Update( message.data );
                RS.fireEvent(RS.Events.stationlocal, RS.station);
                break;
                
            //// PEER DATA ////
                
            case RS.MessageTypes.PEER_CONNECT:
                var newStation = new RS.StationProfile();
                newStation.Update(message.data);
                RS.remoteStations.push(newStation);
                RS.fireEvent(RS.Events.stationconnect, newStation);
                break;
            case RS.MessageTypes.PEER_UPDATE:
                for(var i in RS.remoteStations)
                {
                    if(RS.remoteStations[i].id == message.data.id)
                    {
                        RS.remoteStations[i].Update( data.name );
                    }
                    RS.fireEvent(RS.Events.stationupdate, RS.remoteStations[i]);
                    break;
                }
                break;
            case RS.MessageTypes.PEER_DISCONNECT:
                for(var i in RS.remoteStations)
                {
                    if(RS.remoteStations[i].id == message.data.id)
                    {
                        var station = RS.remoteStations[i];
                        RS.remoteStations.splice(i, 1);
                        RS.fireEvent(RS.Events.stationdisconnect, station);
                        break;
                    }
                }
                break;
                 
            //// CUSTOM MESSAGES ////
                
            case RS.MessageTypes.CUSTOM:
                //one more level of abstraction...
                message.data = JSON.parse(message.data);
                var sender = null;
                for(var i in RS.remoteStations)
                {
                    if(RS.remoteStations[i].id == message.data.id)
                        sender = RS.remoteStations[i];
                }
                if(sender != null)
                    RS.fireEvent(RS.Events.message, sender, message.data.userData);
                break;
                
            //// KINECT DATA ////
                
            case RS.MessageTypes.LOCAL_PLAYER_ENTER:
                var result = RS.SkeletonRecieved(message.data);
                RS.fireEvent(RS.Events.localplayerenter, result.profile, result.skeleton);
                break;
            case RS.MessageTypes.REMOTE_PLAYER_ENTER:
                var result = RS.RemoteSkeletonRecieved(message.data);
                if(null == result) return;
                RS.remotePlayers.push(result.skeleton);
                RS.fireEvent(RS.Events.remoteplayerenter, result.profile, result.skeleton);
                break;
                
            case RS.MessageTypes.KINECT:
                var updated = RS.SkeletonRecieved(message.data);
                RS.fireEvent(RS.Events.localkinect, updated);
                break;
            case RS.MessageTypes.REMOTE_KINECT:
                RS.RemoteSkeletonRecieved(message.data);
                RS.fireEvent(RS.Events.remotekinect, updated);
                break;
                
            case RS.MessageTypes.LOCAL_PLAYER_EXIT:
                var result = RS.SkeletonRecieved(message.data);
                RS.fireEvent(RS.Events.localplayerexit, result.profile, result.skeleton);
                break;
            case RS.MessageTypes.REMOTE_PLAYER_EXIT:
                var result = RS.RemoteSkeletonRecieved(message.data);
                if(null == result) return;
                for(var i = RS.remotePlayers.length -1; i >= 0; --i)
                {
                    if(RS.remotePlayers[i].stationID == result.skeleton.stationID
                       && RS.remotePlayers[i].playerNumber == result.skeleton.playerNumber)
                    {
                        RS.remotePlayers.splice(i, 1);
                    }
                }
                RS.fireEvent(RS.Events.remoteplayerexit, result.profile, result.skeleton);
                break;
            
                
            default:
                RS.messenger.display(Message.type.WARNING, "Unkown Message Type Recieved -> " + message.type);
        }
    }
}

RS.SkeletonRecieved = function(skeleton)
{
    var result = {};
    result.profile = RS.station;
    result.skeleton = RS.players[skeleton.playerNumber];
    result.skeleton.Update( skeleton );
    
    return result;
}

RS.RemoteSkeletonRecieved = function(skeleton)
{
    var result = {
        profile : null,
        skeleton : null
    };
    for(var i in this.remoteStations)
    {
        if(this.remoteStations[i].id == skeleton.stationID)
        {
            result.profile = this.remoteStations[i];
            result.skeleton = result.profile.players[skeleton.playerNumber];
            if(typeof(result.skeleton) == 'undefined' || result.skeleton.userPresent == false)
            {
                result.profile.players[skeleton.playerNumber] = new RS.Skeleton();
                result.skeleton = result.profile.players[skeleton.playerNumber];
                //result.skeleton.Update( skeleton );
                //RS.remotePlayers.push(result.skeleton);
                //RS.fireEvent(RS.Events.remoteplayerenter, result.skeleton);
                //return result;
            }
            
            result.skeleton.Update( skeleton );
            return result
        }
    }
    return null;
}

RS.ActivateMessenger = function()
{
    RS.messenger = new Messenger();
}

RS.addEventListener = function(event, callback)
{
    if(typeof(RS.Events[event]) == 'undefined')
        RS.messenger.display(Message.type.WARNING, "Event type '" + event + "' not valid for Reactive Spaces", "Make sure you use the RS.Events enumerator");
    
    if(typeof(RS.listeners[event]) == 'undefined')
        RS.listeners[event] = [];
    RS.listeners[event].push(callback);
}

RS.removeEventListener = function(event, callback)
{
    //TODO
}

RS.fireEvent = function(eventType, data, data2)
{
    for(var i in RS.listeners[eventType])
    {
        RS.listeners[eventType][i](data, data2);
    }
}

RS.Send = function( object )
{
    if(!RS.connected)
        return false;
    
    if(typeof(object) == 'undefined')
        RS.messenger.display(Message.type.WARNING, "Cannot sent undefined message", "Make sure you pass RS.Send a defined variable / object");
    
    var now = new Date().getMilliseconds;
    if(now - RS.lastMessage < RS.MESSAGE_DELAY)
        return;
        //RS.messenger.display(Message.type.WARNING, "Message not sent, too soon", "You are sending messages to close together");
    
    var message = {
        type: RS.MessageTypes.CUSTOM,
        data: JSON.stringify(object)
    }
    
    var string = JSON.stringify(message);
    
    RS.socket.send(string + "\0");
}

//endregion

//////////////////////////////////////////////////////
////                    Types                     ////
//////////////////////////////////////////////////////

//region

RS.StationProfile = function()
{
    this.name = "unset";
    this.location = "unset";
    this.id = -1;
    
    this.features = [];
    this.players =[];
}
RS.StationProfile.prototype.Update = function( profile )
{
    this.name = profile.name;
    this.location = profile.location;
    this.id = profile.id;
    this.features = profile.features;
}
RS.StationProfile.prototype.UpdatePlayer = function( player )
{
    //todo blending
    this.players[player.playerNumber] = player;
}

//SKELETON
//Describes the Skeleton object that ReactiveSpaces
//uses to store kinect input data
RS.Skeleton = function()
{
    this.numberOfJoints = 20//TODO...RS.JointTypes.length;
    this.userPresent = false;
    this.ID = -1;
    this.playerNumber = -1;
    this.stationID = -1;
    
    this.frameWidth = 320;
    this.frameHeight = 240;
    this.frameAspect = 320 / 240;

    this.joints = [];
    for(var i in RS.JointTypes)
    {
        this.joints.push( new RS.SkeletonJoint( this ) );
    }
}
//SKELETON::UPDATE
//updates the joint positions and data from another skelton
//object. This is used for incoming data streams from the desktop
//skeleton: the skeleton object to copy data from
RS.Skeleton.prototype.Update = function( skeleton )
{
    
    this.userPresent = skeleton.userPresent;
    this.ID = skeleton.ID;
    this.playerNumber = skeleton.playerNumber;
    this.stationID = skeleton.stationID;
    
    if(skeleton.joints == null)
    {
        for(var i in RS.JointTypes)
        {
            this.joints.push( new RS.SkeletonJoint() );
        }
        return;
    }
    
    for(var i in this.joints)
    {
        this.joints[i].SetFromJoint( skeleton.joints[i] );
    }
}

RS.Skeleton.prototype.BlendUpdate = function( deltaTimeS )
{
    if(this.joints == null) return;
    for(var i in this.joints)
        this.joints[i].BlendUpdate( deltaTimeS );
}

//SKELETONJOINT
//describes a skeleton joint object
RS.SkeletonJoint = function( skeleton )
{
    //denotes weather joint is currently being tracked or not
    this.tracked = false;
    //a reference to the parent skeleton
    this.skeleton = skeleton;
    //position of joint in meters as calculated by kinect
    this.positionMeters = new RS.Vector3();
    //position of joint relative to the kinect camera image
    //0-1 in width and height
    //0-1 in z from 0 to 5 meters in depth
    this.positionScreen = new RS.Vector3();
    //screen position but smooth transition (might be behind)
    this.positionSmoothed = new RS.Vector3();
    //velocity is joint movement from frame to frame
    //only calculated when blending is on
    this.velocity = new RS.Vector3();
}
//SKELTONJOINT::SETFROMJOINT
//copies data of the given joint into this one
//joint: valid RS.SKELETONJOINT object
RS.SkeletonJoint.prototype.SetFromJoint = function( joint )
{
    this.tracked = joint.tracked;
    if(joint instanceof RS.SkeletonJoint)
    {
        this.positionMeters.SetFromVector( joint.positionMeters );
        this.positionScreen.SetFromVector(joint.positionScreen );
    }
    else
    {
        this.positionMeters.SetFromVector( joint.position );
        this.positionScreen.SetFromVector( joint.screenPos );
    }
}

//SKELTOINJOINT::BLENDUPDATE
//called by reactive spaces to update the smoothed screenPosition
//also updates joint velocities
RS.SkeletonJoint.prototype.BlendUpdate = function( deltaTimeS )
{
    var delta = new RS.Vector3(
        (this.positionScreen.x - this.positionSmoothed.x),
        (this.positionScreen.y - this.positionSmoothed.y),
        (this.positionScreen.z - this.positionSmoothed.z)
    );
    delta.MultiplyScalar(2.5);
    
    this.velocity.SetFromVector( delta );
    
    delta.MultiplyScalar( deltaTimeS );
    
    this.positionSmoothed.x += delta.x;
    this.positionSmoothed.y += delta.y;
    this.positionSmoothed.z += delta.z;
    
    
}

//VECTOR3
//a simple object which defines a 3d point (x, y, z)
//x (optional): inital x value, default is 0
//y (optional): inital y value, default is 0
//z (optional): inital z value, default is 0
RS.Vector3 = function( x, y, z )
{
    this.x = (typeof(x) == 'undefined') ? 0 : x;
    this.y = (typeof(y) == 'undefined') ? 0 : y;
    this.z = (typeof(z) == 'undefined') ? 0 : z;
}
//VECTOR3::SET
//sets the value of this vector (x, y, z)
//x (optional): new x value, default is 0
//y (optional): new y value, default is 0
//z (optional): new z value, default is 0
RS.Vector3.prototype.Set = function( x, y, z )
{
    this.x = (typeof(x) == 'undefined') ? 0 : x;
    this.y = (typeof(y) == 'undefined') ? 0 : y;
    this.z = (typeof(z) == 'undefined') ? 0 : z;
}
//VECTOR3::SETFROMVECTOR
//sets the value of this vector from another
//vector: object to copy from { x, y, z }
//        if x, y, or z are unset on the object, it sets 0
RS.Vector3.prototype.SetFromVector = function( vector )
{
    this.x = (typeof(vector.x) == 'undefined') ? 0 : vector.x;
    this.y = (typeof(vector.y) == 'undefined') ? 0 : vector.y;
    this.z = (typeof(vector.z) == 'undefined') ? 0 : vector.z;
}

RS.Vector3.prototype.AddVector = function( vector )
{
    this.x += vector.x;
    this.y += vector.y;
    this.z += vector.z;
}

RS.Vector3.prototype.SubVector = function( vector )
{
    this.x -= vector.x;
    this.y -= vector.y;
    this.z -= vector.z;
}

RS.Vector3.prototype.MultiplyScalar = function( scalar )
{
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
}

RS.Vector3.prototype.Normalize = function()
{
    var len = this.Length();
    this.x /= len;
    this.y /= len;
    this.z /= len;
}

RS.Vector3.prototype.Length = function()
{
    return Math.sqrt(this.LengthSqd());
}

RS.Vector3.prototype.LengthSqd = function()
{
    return (this.x * this.x) + (this.y * this.y) + (this.z * this.z)
}

//endregion

//////////////////////////////////////////////////////
////              Utility Functions               ////
//////////////////////////////////////////////////////

//DRAW SKELETON
//draws the given skeleton on the given 2d context 
//maps screen position to the bounds of the canvas
//context: valid 2d drawing context for an html 5 canvas
//skeleton: valid skeleton object from ReactiveSpaces
//color (optional): string canvas color identifier, default is "#FFF"
//blend (optional): sets weather of not to use the blended skeleton
//                  RS.MOVEMENT_BLEND must be set to true (default is false)
RS.DrawSkeleton = function(context, skeleton, color, blend)
{
    var ctx = context;
    var positionType = blend ? 'positionSmoothed' : 'positionScreen';
    
    color = (typeof(color) == 'undefined') ? "#FFF" : color;
    
    //lines first
    ctx.strokeStyle = color;
    ctx.beginPath();
    //arms
    ctx.moveTo(skeleton.joints[RS.JointTypes.HAND_LEFT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HAND_LEFT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.WRIST_LEFT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.WRIST_LEFT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.ELBOW_LEFT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.ELBOW_LEFT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SHOULDER_LEFT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SHOULDER_LEFT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SHOULDER_CENTER][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SHOULDER_CENTER][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SHOULDER_RIGHT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SHOULDER_RIGHT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.ELBOW_RIGHT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.ELBOW_RIGHT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.WRIST_RIGHT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.WRIST_RIGHT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.HAND_RIGHT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HAND_RIGHT][positionType].y * ctx.canvas.height);
    //body and left leg
    ctx.moveTo(skeleton.joints[RS.JointTypes.HEAD][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HEAD][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SHOULDER_CENTER][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SHOULDER_CENTER][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SPINE][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SPINE][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.HIP_CENTER][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HIP_CENTER][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.HIP_LEFT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HIP_LEFT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.KNEE_LEFT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.KNEE_LEFT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.ANKLE_LEFT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.ANKLE_LEFT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.FOOT_LEFT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.FOOT_LEFT][positionType].y * ctx.canvas.height);
    //right leg
    ctx.moveTo(skeleton.joints[RS.JointTypes.HIP_CENTER][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HIP_CENTER][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.HIP_RIGHT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HIP_RIGHT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.KNEE_RIGHT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.KNEE_RIGHT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.ANKLE_RIGHT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.ANKLE_RIGHT][positionType].y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.FOOT_RIGHT][positionType].x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.FOOT_RIGHT][positionType].y * ctx.canvas.height);
    ctx.stroke();

    //then joints
    ctx.fillStyle = color;
    for(var i in skeleton.joints)
    {
        ctx.beginPath();
        ctx.arc(skeleton.joints[i][positionType].x * ctx.canvas.width, skeleton.joints[i][positionType].y * ctx.canvas.height, 5, 0, Math.PI * 2, false);
        ctx.fill();
    }
}

//////////////////////////////////////////////////////
////                 Enumerators                  ////
//////////////////////////////////////////////////////

//FEATURE LIST
//enumerator to show what features are supported or required by an app
RS.Features = {
    Kinect : 0
}

//JOINT TYPES
//enumerator to pick joints from the skeleton object
RS.JointTypes = {
    
    HEAD : 0,
        
    //torso
    SHOULDER_CENTER : 1,
    SPINE : 2,
    HIP_CENTER : 3,

    //arms
    SHOULDER_LEFT : 4,
    SHOULDER_RIGHT : 5,
    ELBOW_LEFT : 6,
    ELBOW_RIGHT : 7,
    WRIST_LEFT : 8,
    WRIST_RIGHT : 9,
    HAND_LEFT : 10,
    HAND_RIGHT : 11,

    //legs
    HIP_LEFT : 12,
    HIP_RIGHT : 13,
    KNEE_LEFT : 14,
    KNEE_RIGHT : 15,
    ANKLE_LEFT : 16,
    ANKLE_RIGHT : 17,
    FOOT_LEFT : 18,
    FOOT_RIGHT : 19
}

//MESSAGE TYPES
//enumerator for incoming websocket messages
RS.MessageTypes = {
    APP_INFO: 0,
    CUSTOM: 1,
    KINECT: 2,
    REMOTE_KINECT: 3,
    STATION_PROFILE: 4,
    PEER_CONNECT: 5,
    PEER_UPDATE: 6,
    PEER_DISCONNECT: 7,
    LOCAL_PLAYER_ENTER: 8,
    LOCAL_PLAYER_EXIT: 9,
    REMOTE_PLAYER_ENTER: 10,
    REMOTE_PLAYER_EXIT: 11,
    FEATURE_MISSING: 12
}

//EVENT TYPES
//a simple list of event types
//dispatched by ReactiveSpaces
RS.Events = {
    //connection
    connect: 'connect',
    disconnect: 'disconnect',
    //kinect
    localkinect: 'localkinect',
    remotekinect: 'remotekinect',
    //custom
    message: 'message',
    //station / session
    featuremissing: 'featuremissing',
    stationlocal: 'stationlocal',
    stationconnect: 'stationconnect',
    stationupdate: 'stationupdate',
    stationdisconnect: 'stationdisconnect',
    //players
    localplayerenter: 'localplayerenter',
    localplayerexit: 'localplayerexit',
    remoteplayerenter: 'remoteplayerenter',
    remoteplayerexit: 'remoteplayerexit'
}