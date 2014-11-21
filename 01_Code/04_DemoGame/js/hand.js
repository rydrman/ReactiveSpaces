var Hand = function(imgEmpty, imgFull, imgCollect)
{
    this.joint = null;
    this.position = new Vector();
    this.rad = 50;
    this.value = 0;
    this.targetValue = 0;
    this.maxValue = 100;
    this.emptying = false;
    
    this.imgEmpty = imgEmpty;
    this.imgFull = imgFull;
    this.imgCollect = imgCollect;
    this.collectAlpha = 0;
}

Hand.prototype.update = function(deltaTime)
{  
    if(this.joint != null)
    {
        this.position.x = this.joint.positionSmoothed.x * canvas.width;
        this.position.y = this.joint.positionSmoothed.y * canvas.height;
    }
    if(this.emptying)
    {
        if(this.value == 0)
            this.emptying = false;
        else
            return false;
    }
           
    if(this.value >= this.maxValue)
    {
        this.targetValue = 0;
        this.emptying = true;
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

    if (!this.emptying)
    {
        var filledHeight = this.rad * 2 * perc;

        ctx.drawImage(this.imgFull, 0, 0, this.imgEmpty.width * perc, this.imgEmpty.height, 0, 0, filledHeight, this.rad * 2);
        if (this.collectAlpha > 0)
        {
            ctx.globalAlpha = this.collectAlpha;
            ctx.drawImage(this.imgCollect, 0, 0, this.imgEmpty.width * perc, this.imgCollect.height, 0, 0, filledHeight, this.rad * 2);
        }
    }
    else
    {
        ctx.globalAlpha = perc;
        ctx.drawImage(this.imgFull, 0, 0, this.rad*2, this.rad * 2);
    }
    
        
    ctx.restore();
}