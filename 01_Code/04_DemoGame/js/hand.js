var Hand = function(imgEmpty, imgFull, imgCollect)
{
    this.position = new Vector();
    this.rad = 50;
    this.value = 0;
    this.maxValue = 100;
    
    this.imgEmpty = imgEmpty;
    this.imgFull = imgFull;
    this.imgCollect = imgCollect;
    this.collectAlpha = 0;
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

Hand.prototype.render = function( pointAt )
{
    ctx.save();
    
    ctx.translate(this.position.x, this.position.y);
    
    //rotate towards center
    var a = Math.atan2( pointAt.y - this.position.y, pointAt.x - this.position.x );
    ctx.rotate(a);
    
    ctx.translate(-this.rad, -this.rad);
    
    //draw empty
    ctx.drawImage(this.imgEmpty, 0, 0, this.rad * 2, this.rad * 2);
    
    var perc = this.value / this.maxValue;
    var filledHeight = this.rad * 2 * perc;
    
    ctx.drawImage(this.imgFull, 0, 0, filledHeight, this.imgEmpty.height, 0, 0, filledHeight, this.rad * 2);
    
    if(this.collectAlpha > 0)
    {
        ctx.globalAlpha = this.collectAlpha;
        ctx.drawImage(this.imgCollect, 0, 0, filledHeight, this.imgCollect.height, 0, 0, filledHeight, this.rad * 2);
    }
        
    ctx.restore();
}