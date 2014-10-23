//////////////////////////////////////////////////////
////             Initial Declaration              ////
//////////////////////////////////////////////////////

window.RS = window.ReactiveSpaces = {version: 0.1};

//////////////////////////////////////////////////////
////           Constants and Variables            ////
//////////////////////////////////////////////////////

//constants etc
RS.BASEURL = "ws://localhost";
RS.DEFAULTPORT = 8080;

//connection vars
RS.socketSupported = false;
RS.socket = null;
RS.connected = false

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

RS.Connect = function( port )
{
    //ser/reset skeletons
    RS.player1 = new RS.Skeleton();
    RS.player2 = new RS.Skeleton();
    
    //set to default if not defined
    port = (typeof(port) == 'undefined') ? RS.DEFAULTPORT : port;
    
    //check for support
    if(!RS.socketSupported)
    {
        //TODO make this better
        throw new Error("Web Sockets not supported by this browser. Please upgrade.");
    }
    
    RS.socket = new WebSocket(RS.BASEURL + ":" +  port + "/ReactiveSpaces");
    
    RS.socket.onopen = RS.SocketOpened;
    RS.socket.onclose = RS.SocketClosed;
    RS.socket.onmessage = RS.MessageRecieved;
    RS.socket.onerror = RS.SocketError;
} 

RS.SocketError = function(err)
{
    console.log("REACTIVE SPACES: error, see developer console (F12) for more information");
    console.log(err);
}

RS.SocketOpened = function()
{
    var obj = {
        type : 0,
        data : "hi"
    };
    
    RS.connected = true;
    
    RS.socket.send(JSON.stringify(obj));
    console.log("REACTIVE SPACES: connected to " + RS.socket.url);
}

RS.SocketClosed = function()
{
    console.log("REACTIVE SPACES: disconnected from " + RS.socket.url);
}

RS.MessageRecieved = function(e)
{
    var message = JSON.parse(e.data);
    
    if(message.type == RS.MessageTypes.KINECT)
    {
        RS.SkeletonRecieved(message.data);
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

RS.addEventListener = function(event, callback)
{
    if(typeof(RS.listeners[event]) == 'undefined')
        throw new Error("event type not valid for Reactive Spaces");
    
    RS.listeners[event].push(callback);
}

RS.removeEventListener = function(event, callback)
{
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
        throw new Error("recieved skeleton does not have the same number of joints...");
    
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
    CUSTOM: 0,
    KINECT: 1,
    REMOTE_KINECT: 2
}

//EVENT TYPES
//a simple list of event types
//dispatched by ReactiveSpaces
RS.EventTypes = {
    localskeleton: 0,
    remoteskeleton: 1,
    messagerecieved: 2   
}