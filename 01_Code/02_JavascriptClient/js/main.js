var canvas,
    ctx;

function onLoad()
{
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');
    window.requestAnimationFrame(update);
    
    RS.addEventListener("localskeleton", onSkeletonUpdated);
    
    RS.Connect();
}

function onSkeletonUpdated(e)
{
    if(!e) e = window.event;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    RS.DrawSkeleton(ctx, e.skeleton);
}

function update()
{
    window.requestAnimationFrame(update);
    
    // update code here //
    
    
    //////////////////////
    
    render();
}

function render()
{
    // render code here //
    
    
    //////////////////////
}