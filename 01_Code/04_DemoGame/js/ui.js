var UI = function ()
{
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.score = 0;
}

UI.prototype.resize = function(x, y)
{
    this.canvas.width = x;
    this.canvas.height = y;
}

UI.prototype.getRender = function(canvas)
{
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //draw whats there
    this.ctx.drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
    //blur it
    boxBlurCanvasRGB(this.ctx, 0, 0, this.canvas.width, this.canvas.height, 5, 1);
    //some white
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    //draw text
    //UI 
    this.ctx.fillStyle = "#FFF";
    this.ctx.font = "20px sans-serif";
    this.ctx.fillText("Score: " + this.score, 20, this.canvas.height * 0.5 + 8);

    return this.canvas;
}