var canvas,
    ctx;

var game;

function onLoad()
{
    canvas = document.getElementById("canvas");
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
    
    render();
}

function render()
{
    // render code here //
    game.render();
    //////////////////////
}