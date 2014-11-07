var canvas,
    ctx;

var game;

function onLoad()
{
    canvas = document.getElementById("canvas");
    canvas.onclick = onMouseClick;
    canvas.onmousemove = onMouseMove;
    ctx = canvas.getContext('2d');
    window.requestAnimationFrame(update);
    game = new Game();
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
    if(!e) e = window.Event;
    
    var mousePos = getMousePos(e);
    
    game.onMouseMove(mousePos);
}

function getMousePos(e)
{
    return new Vector(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
}