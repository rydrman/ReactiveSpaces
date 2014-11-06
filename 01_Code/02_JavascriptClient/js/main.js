var canvas,
    ctx;

var lastUpdate;

var ball;
var balls = [];

function onLoad()
{
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');
    window.requestAnimationFrame(update);
    
    lastUpdate = new Date();
    
    ball = {x: Math.random() * canvas.width, y: Math.random() * canvas.height,
           speedX: 50, speedY: 50};
    
    //listeners for everything
    RS.addEventListener(RS.Events.localkinect, onSkeletonUpdated);
    RS.addEventListener(RS.Events.remotekinect, onRemoteSkeletonUpdated);
    //custom
    RS.addEventListener(RS.Events.message, onMessageRecieved);
    //station / session
    RS.addEventListener(RS.Events.stationlocal, onLocalProfile);
    RS.addEventListener(RS.Events.stationconnect, onRemoteConnect);
    RS.addEventListener(RS.Events.stationupdate, onRemoteProfile);
    RS.addEventListener(RS.Events.stationdisconnect, onRemoteDisconnect);
    //players
    RS.addEventListener(RS.Events.localplayerenter, localEnter);
    RS.addEventListener(RS.Events.localplayerexit, localExit);
    RS.addEventListener(RS.Events.remoteplayerenter, remoteEnter);
    RS.addEventListener(RS.Events.remoteplayerexit, remoteExit);
    
    RS.ActivateMessenger();
    
    RS.Connect("My App", 1.0);
}

function onLocalProfile(profile)
{
    console.log('local profile recieved');
    console.log(profile);
}

function onRemoteConnect(profile)
{
    console.log('remote profile connected');
    console.log(profile);
}

function onRemoteProfile(profile)
{
    console.log('remote profile recieved');
    console.log(profile);
}

function onRemoteDisconnect(profile)
{
    console.log('remote profile disconnected');
    console.log(profile);
}

function localEnter(profile, skeleton)
{
    console.log("local entered");
}
function localExit(profile, skeleton)
{
    console.log("local exited");
}

function remoteEnter(profile, skeleton)
{
    console.log("remote entered");
}
function remoteExit(profile, skeleton)
{
    console.log("remote exited");
}

function onSkeletonUpdated(skeleton)
{
}

function onRemoteSkeletonUpdated(player, skeleton)
{
}

function onMessageRecieved(player, data)
{
    player.ball = data;
    //console.log("custom message from: " + peer.name);
}

function update()
{
    window.requestAnimationFrame(update);
    
    var deltaTimeMS = new Date().getTime() - lastUpdate.getTime();
    var deltaTimeS = deltaTimeMS * 0.001;
    lastUpdate = new Date();
    
    // update code here //
    
    ball.x += ball.speedX * deltaTimeS;
    ball.y += ball.speedY * deltaTimeS;
    
    if(ball.x > canvas.width) ball.speedX = -Math.abs(ball.speedX);
    if(ball.x < 0) ball.speedX = Math.abs(ball.speedX);
    if(ball.y > canvas.height) ball.speedY = -Math.abs(ball.speedY);
    if(ball.y < 0) ball.speedY = Math.abs(ball.speedY);
    
    RS.Send(ball);
    
    //////////////////////
    
    render();
}

function render()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // render code here //
    
    //write connections
    ctx.fillStyle = "#FFF";
    ctx.font = "20px sans-serif";
    var y = 30;
    for(var i in RS.remotePlayers)
    {
        ctx.fillText(RS.remotePlayers[i].name + " -> " + RS.remotePlayers[i].location + " -> " + RS.remotePlayers[i].id,
                     10, y);
        y += 30;
    }
    
    //draw remote balls
    for(var i in RS.remotePlayers)
    {
        ctx.fillStyle = "#c94d02";
        if(RS.remotePlayers[i].ball)
        {
            ctx.beginPath();
            ctx.arc(RS.remotePlayers[i].ball.x,
                    RS.remotePlayers[i].ball.y,
                    20, 0, Math.PI*2, false);
            ctx.fill();
        }
    }
    
    //draw local ball
    ctx.fillStyle = "#3cd0ff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 20, 0, Math.PI*2, false);
    ctx.fill();
    
    //draw local skeleton
    for(var i in RS.players)
    {
        if(RS.players[i].userPresent)
            RS.DrawSkeleton(ctx, RS.players[i]);
    }
    
    for(var i in RS.remotePlayers)
    {
        for(var j in RS.remotePlayers[i].players)
        {
            if(RS.remotePlayers[i].players[j].userPresent)
                RS.DrawSkeleton(ctx, RS.remotePlayers[i].players[j], "#7bccff");
        }
    }
    
    //////////////////////
}