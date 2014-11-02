//////////////////////////////////////////////////////
////             Initial Declaration              ////
//////////////////////////////////////////////////////

window.RS = window.ReactiveSpaces = {version: 0.1};

//////////////////////////////////////////////////////
////           Constants and Variables            ////
//////////////////////////////////////////////////////

//constants etc
RS.BASEURL = "ws://localhost";
RS.LOCALPORT = 8080;

//app info
RS.appInfo = {
    name: "Default App Name",
    version: "1.0.0.0",
    maxPeers: 4
}

//connection vars
RS.socketSupported = false;
RS.socket = null;
RS.connected = false;

//to keep skeletons
RS.player1;
RS.player2;
RS.remotePlayers = [];

//to store event listeners
RS.listeners = {
    localskeleton: [],
    remoteskeleton: [],
    messagerecieved: []
};

//for error reporting
RS.messenger = {display:function(t,m,s,ms){
    console.log( "RS: " + m + " -> " +s);
}};

//////////////////////////////////////////////////////
////                 Setup Logic                  ////
//////////////////////////////////////////////////////

//check for web socket
if(window.MozWebSocket) window.WebSocket = window.MozWebSocket;
if(window.WebkitWebSocket) window.WebSocket = window.WebkitWebSocket;

if(window.WebSocket)
    RS.socketSupported = true;

//////////////////////////////////////////////////////
////                  Functions                   ////
//////////////////////////////////////////////////////

RS.Connect = function( appName, appVersion, port )
{
    
    //check for connection
    if(RS.connected)
    {
        RS.Disconnect();
    }
    
    //set params if defined
    if(typeof(appName) != 'undefined') RS.appInfo.name = appName;
    if(typeof(appVersion) != 'undefined') RS.appInfo.version = appVersion;
    if(typeof(port) != 'undefined') RS.LOCALPORT = port;

    //set/reset
    RS.player1 = new RS.Skeleton();
    RS.player2 = new RS.Skeleton();
    RS.remotePlayers = [];
    
    //check for support
    if(!RS.socketSupported)
    {
        RS.messenger.display(Message.type.ERROR, "Web Sockets not supported.", "Please upgrade to a compatible browser");
        return false;
    }
    
    RS.socket = new WebSocket(RS.BASEURL + ":" + RS.LOCALPORT + "/ReactiveSpaces");
    
    RS.socket.onopen = RS.SocketOpened;
    RS.socket.onclose = RS.SocketClosed;
    RS.socket.onmessage = RS.MessageRecieved;
    RS.socket.onerror = RS.SocketError;
    
    return true;
} 

RS.Disconnect = function()
{
    if(null != RS.socket)
        RS.socket.close();
    RS.connected = false;
}

RS.SocketError = function(err)
{
    RS.messenger.display(Message.type.ERROR, "Web Socket Error", "See developer console (F12) for more information.");
    console.log(err);
    RS.connected = false;
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
}

RS.SocketClosed = function()
{
    console.log("REACTIVE SPACES: disconnected from " + RS.socket.url);
    RS.socket = null;
    RS.connected = false;
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
            case RS.MessageTypes.PEER_CONNECT:
                RS.remotePlayers.push(message.data);
                RS.fireEvent(RS.EventTypes.playerjoined, message.data);
                break;
            case RS.MessageTypes.PEER_UPDATE:
                for(var i in RS.remotePlayers)
                {
                    if(RS.remotePlayers[i].id == message.data.id)
                    {
                        RS.remotePlayers[i].name = message.data.name;
                        RS.remotePlayers[i].location = message.data.location;
                    }
                    RS.fireEvent(RS.EventTypes.playerupdated, RS.remotePlayers[i]);
                    break;
                }
                break;
            case RS.MessageTypes.PEER_DISCONNECT:
                for(var i in RS.remotePlayers)
                {
                    if(RS.remotePlayers[i].id == message.data.id)
                    {
                        var player = RS.remotePlayers[i];
                        RS.remotePlayers.splice(i, 1);
                        RS.fireEvent(RS.EventTypes.playerleft, player);
                        break;
                    }
                }
                break;
            case RS.MessageTypes.CUSTOM:
                var sender = null;
                for(var i in this.remotePlayers)
                {
                    if(this.remotePlayers[i].id == data.id)
                        sender = this.remotePlayers[i];
                }
                if(sender != null)
                    RS.fireEvent(RS.EventTypes.messagerecieved, sender, data.userData);
                break;
            case RS.MessageTypes.KINECT:
                RS.SkeletonRecieved(message.data);
                break;
            default:
                RS.messenger.display(Message.type.WARNING, "Unkown Message Type Recieved");
        }
    }
}

RS.SkeletonRecieved = function(skeleton)
{
    //remember updated skeleton
    var updated = null;
    
    //local skeleton updates
    if(skeleton.playerNumber == 1)
    {
        RS.player1.Update( skeleton );
        updated = RS.player1;
    }
    else if(skeleton.playerNumber == 2)
    {
        RS.player2.Update( skeleton );
        updated = RS.player2;
    }
    
    //if nothing happened we're done
    //TODO should raise warning or error
    if(null == updated) return;
    
    //dispatch event to all listeners
    for(var i in RS.listeners.localskeleton)
    {
        RS.listeners.localskeleton[i].call(window, { skeleton: updated } );
    }
}

RS.ActivateMessenger = function()
{
    RS.messenger = new Messenger();
}

RS.addEventListener = function(event, callback)
{
    if(typeof(RS.listeners[event]) == 'undefined')
        RS.messenger.display(Message.type.WARNING, "Event type not valid for Reactive Spaces", "Make sure you use the RS.EventTypes enumerator");
    
    RS.listeners[event].push(callback);
}

RS.removeEventListener = function(event, callback)
{
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
    
    var message = {
        type: RS.MessageTypes.CUSTOM,
        data: JSON.stringify(object)
    }
    
    var string = JSON.stringify(message);
    
    RS.socket.send(string + "\0");
}

//////////////////////////////////////////////////////
////                    Types                     ////
//////////////////////////////////////////////////////

//SKELETON
//Describes the Skeleton object that ReactiveSpaces
//uses to store kinect input data
RS.Skeleton = function()
{
    this.numberOfJoints = 20//TODO...RS.JointTypes.length;
    this.userPresent = false;
    this.ID = -1;
    this.playerNumber = -1;
    
    this.frameWidth = 320;
    this.frameHeight = 240;
    this.frameAspect = 320 / 240;

    this.joints = [];
    for(var i in RS.JointTypes)
    {
        this.joints.push( new RS.SkeletonJoint() );
    }
}
//SKELETON::UPDATE
//updates the joint positions and data from another skelton
//object. This is used for incoming data streams from the desktop
//skeleton: the skeleton object to copy data from
RS.Skeleton.prototype.Update = function( skeleton )
{
    if(this.joints.length != skeleton.joints.length)
        RS.messenger.display(Message.type.ERROR, "Recieved skeleton does not have the same number of joints...");
    
    this.userPresent = skeleton.userPresent;
    this.ID = skeleton.ID;
    this.playerNumber = skeleton.playerNumber;
    
    for(var i in this.joints)
    {
        this.joints[i].SetFromJoint( skeleton.joints[i] );
    }
}

//SKELETONJOINT
//describes a skeleton joint object
RS.SkeletonJoint = function()
{
    //denotes weather joint is currently being tracked or not
    this.tracked = false;
    //position of joint in meters as calculated by kinect
    this.positionMeters = new RS.Vector3();
    //position of joint relative to the kinect camera image
    //0-1 in width and height
    //0-1 in z from 0 to 5 meters in depth
    this.positionScreen = new RS.Vector3();
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

//////////////////////////////////////////////////////
////              Utility Functions               ////
//////////////////////////////////////////////////////

//DRAW SKELETON
//draws the given skeleton on the given 2d context
//context: valid 2d drawing context for an html 5 canvas
//skeleton: valid skeleton object from ReactiveSpaces
//color (optional): string canvas color identifier, default is "#FFF"
RS.DrawSkeleton = function(context, skeleton, color)
{
    var ctx = context;
    
    color = (typeof(color) == 'undefined') ? "#FFF" : color;
    
    //lines first
    ctx.strokeStyle = color;
    ctx.beginPath();
    //arms
    ctx.moveTo(skeleton.joints[RS.JointTypes.HAND_LEFT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HAND_LEFT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.WRIST_LEFT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.WRIST_LEFT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.ELBOW_LEFT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.ELBOW_LEFT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SHOULDER_LEFT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SHOULDER_LEFT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SHOULDER_CENTER].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SHOULDER_CENTER].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SHOULDER_RIGHT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SHOULDER_RIGHT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.ELBOW_RIGHT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.ELBOW_RIGHT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.WRIST_RIGHT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.WRIST_RIGHT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.HAND_RIGHT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HAND_RIGHT].positionScreen.y * ctx.canvas.height);
    //body and left leg
    ctx.moveTo(skeleton.joints[RS.JointTypes.HEAD].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HEAD].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SHOULDER_CENTER].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SHOULDER_CENTER].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.SPINE].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.SPINE].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.HIP_CENTER].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HIP_CENTER].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.HIP_LEFT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HIP_LEFT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.KNEE_LEFT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.KNEE_LEFT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.ANKLE_LEFT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.ANKLE_LEFT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.FOOT_LEFT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.FOOT_LEFT].positionScreen.y * ctx.canvas.height);
    //right leg
    ctx.moveTo(skeleton.joints[RS.JointTypes.HIP_CENTER].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HIP_CENTER].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.HIP_RIGHT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.HIP_RIGHT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.KNEE_RIGHT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.KNEE_RIGHT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.ANKLE_RIGHT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.ANKLE_RIGHT].positionScreen.y * ctx.canvas.height);
    ctx.lineTo(skeleton.joints[RS.JointTypes.FOOT_RIGHT].positionScreen.x * ctx.canvas.width, 
               skeleton.joints[RS.JointTypes.FOOT_RIGHT].positionScreen.y * ctx.canvas.height);
    ctx.stroke();

    //then joints
    ctx.fillStyle = color;
    for(var i in skeleton.joints)
    {
        ctx.beginPath();
        ctx.arc(skeleton.joints[i].positionScreen.x * ctx.canvas.width, skeleton.joints[i].positionScreen.y * ctx.canvas.height, 5, 0, Math.PI * 2, false);
        ctx.fill();
    }
}

//////////////////////////////////////////////////////
////                 Enumerators                  ////
//////////////////////////////////////////////////////

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
    PEER_CONNECT: 4,
    PEER_UPDATE: 5,
    PEER_DISCONNNECT: 6
}

//EVENT TYPES
//a simple list of event types
//dispatched by ReactiveSpaces
RS.EventTypes = {
    localskeleton: 0,
    remoteskeleton: 1,
    messagerecieved: 2,
    playerjoined: 3,
    playerupdated: 4,
    playerleft: 5
}