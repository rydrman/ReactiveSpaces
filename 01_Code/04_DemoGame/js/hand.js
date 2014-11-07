var Hand = function()
{
    this.position = new Vector();
    this.rad = 50;
    this.value = 0;
    this.maxValue = 100;
}

Hand.prototype.update = function(deltaTime)
{
    if(this.value >= this.maxValue)
    {
        this.value = 0;
        return true;
    }
    return false;
}

Hand.prototype.render = function()
{
    ctx.fillStyle = "#1fc2e6";
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.rad, 0, Math.PI * 2, false);
    ctx.fill();
}