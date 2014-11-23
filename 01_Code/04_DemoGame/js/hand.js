var Hand = function(imgEmpty, imgFull, imgCollect)
{
    this.joint = null;
    this.position = new Vector();
    this.rad = 0.05;
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
        this.position.x = this.joint.positionSmoothed.x;
        this.position.y = this.joint.positionSmoothed.y;
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

Hand.prototype.render = function( cntx, pointAt )
{
    cntx.save();
    
    cntx.translate(this.position.x * cntx.canvas.width, this.position.y * cntx.canvas.width);
    
    //rotate towards center
    var a = Math.atan2( pointAt.y - this.position.y, pointAt.x - this.position.x );
    cntx.rotate(a);
    
    cntx.translate(-this.rad * cntx.canvas.width, -this.rad* cntx.canvas.width);
    
    //draw empty
    cntx.drawImage(this.imgEmpty, 0, 0, this.rad * 2 * cntx.canvas.width, this.rad * 2 * cntx.canvas.width);
    
    var perc = this.value / this.maxValue;

    if (!this.emptying)
    {
        var filledHeight = this.rad * 2 * cntx.canvas.width * perc;

        cntx.drawImage(this.imgFull, 0, 0, 
                       this.imgEmpty.width * perc, this.imgEmpty.height, 
                       0, 0, filledHeight, this.rad * 2 * cntx.canvas.width
                      );
        if (this.collectAlpha > 0)
        {
            cntx.globalAlpha = this.collectAlpha;
            cntx.drawImage(this.imgCollect, 
                           0, 0, this.imgCollect.width * perc, this.imgCollect.height, 
                           0, 0, filledHeight, this.rad * 2 * cntx.canvas.w
                         );
        }
    }
    else
    {
        cntx.globalAlpha = perc;
        cntx.drawImage(this.imgFull, 0, 0, this.rad*2 * cntx.canvas.width, this.rad * 2 * cntx.canvas.width);
    }
    
        
    cntx.restore();
}