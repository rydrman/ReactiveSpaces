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
    
    RS.addEventListener("localskeleton", onSkeletonUpdated);
    RS.addEventListener("messagerecieved", onMessageRecieved);
    
    RS.ActivateMessenger();
    
    RS.Connect("My App", 1.0);
}

function onSkeletonUpdated(e)
{
    if(!e) e = window.event;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    RS.DrawSkeleton(ctx, e.skeleton);
}

function onMessageRecieved(peer, data)
{
    console.log("custom message from: " + peer.name);
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
    
    //draw local ball
    ctx.fillStyle = "#3cd0ff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 20, 0, Math.PI*2, false);
    ctx.fill();
    
    //////////////////////
}