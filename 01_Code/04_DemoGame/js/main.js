var canvas,
    ctx;

var game;

function onLoad()
{
    canvas = document.getElementById("canvas");
    addEventListener('mousedown', onMouseClick);
    addEventListener('mousemove', onMouseMove);
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    game = new Game();
    window.onresize = onResize;
    onResize();
    
    //do this last
    window.requestAnimationFrame(update);
    
}

function update()
{
    window.requestAnimationFrame(update);
    
    // update code here //
    game.update();
    //////////////////////

   // getMousePosition(Event);
    render();
}

function render()
{
    // render code here //
    game.render();
    //////////////////////
}

function onMouseClick(e) {
    
    if(!e) event = window.Event;
    
    var mousePos = getMousePos(e);
    
    game.onMouseClick(mousePos);
    
}

function onMouseMove(e)
{
    if(!game) return;
    
    if(!e) e = window.Event;
    
    var mousePos = getMousePos(e);
    
    game.onMouseMove(mousePos);
}

function getMousePos(e)
{
    return new Vector(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
}

function onResize(e)
{
    if(!e) e = window.Event;
    
    var oldW = document.getElementById("canvas").offsetWidth,
        oldH = document.getElementById("canvas").offsetHeight;
    
    var floaterWidth = document.getElementById("canvas-floater").offsetWidth,
        floaterHeight = document.getElementById("canvas-floater").offsetHeight;
    
    //find best fit for 16:9
    var fitW = floaterWidth / 16,
        fitH = floaterHeight / 9;
    
    var w, h, l, t;
    if(fitW > fitH)
    {
        //we have bars on the right and left   
        h = floaterHeight;
        w = 16 * fitH;
        l = Math.floor(0.5 * (floaterWidth - 16 * fitH));
        t = 0;
    }
    else
    {
        //bars on the top and bottom
        h = 9 * fitW;
        w = floaterWidth;
        l = 0;
        t = Math.floor(0.5 * (floaterHeight - 9 * fitW));
    }
    
    canvas.width = w;
    canvas.height = h;
    canvas.style.height =  ( h + "px" );
    canvas.style.width =  ( w + "px" );
    canvas.style.left =  ( l + "px" );
    canvas.style.top =  ( t + "px" );
    
    if(game)
        game.onResize(oldW, oldH, w, h);
    
}