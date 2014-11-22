var UI = function ()
{
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.timeLeft = 0;
    this.score = 0;
}

UI.prototype.resize = function(x, y)
{
    this.canvas.width = x;
    this.canvas.height = y;
    
    this.fontSize =Math.floor(y * 0.8);
}

UI.prototype.getRender = function(cvs)
{
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //draw whats there
    //this.ctx.drawImage(cvs, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.canvas.width, this.canvas.height);
    //this.ctx.drawImage(cvs, 0, 0);
    //blur it
    //boxBlurCanvasRGB(this.ctx, 0, 0, this.canvas.width, this.canvas.height, 5, 1);
    //boxBlurCanvasRGB(ctx, 0, 0, this.canvas.width, this.canvas.height, 5, 1);
    //some white
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    //draw text
    //UI 
    this.ctx.fillStyle = "#FFF";
    this.ctx.font = this.fontSize + "px sans-serif";
    //score
    this.ctx.fillText("Score: " + this.score, this.canvas.width*0.01, this.canvas.height * 0.5 + this.fontSize * 0.35);
    //timer
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
        padNumber( Math.floor(this.timeLeft / 60000), 2) + ":" + 
        padNumber( Math.floor((this.timeLeft % 60000) / 1000), 2), 
        this.canvas.width * 0.5, this.canvas.height * 0.5 + this.fontSize * 0.35);
    //menu icon
    this.ctx.textAlign = 'right';
    this.ctx.fillText("__", this.canvas.width * 0.99, this.canvas.height * 0.5 - this.fontSize * 0.5);
    this.ctx.fillText("__", this.canvas.width * 0.99, this.canvas.height * 0.5 - this.fontSize * 0.2);
    this.ctx.fillText("__", this.canvas.width * 0.99, this.canvas.height * 0.5 + this.fontSize * 0.1);
    this.ctx.restore();
    return this.canvas;
}

function padNumber( number, padSize )
{
     return Array(Math.max(padSize - String(number).length + 1, 0)).join(0) + number;
}