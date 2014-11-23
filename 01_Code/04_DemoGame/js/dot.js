var lastDotIndex = 0;
//base dot class and functionality
var Dot = function( type, rad, img )
{
    this.id = lastDotIndex++;
    this.type = null;
    this.img = img;
    this.alpha = 1;
    this.radius = rad;
    this.maxSpeed = 0.25;
    this.minSpeed = 0;
    this.position = new Vector();
    this.rotation = 0;
    this.angularSpeed = 0;
    this.speed = new Vector();
    this.acceleration = new Vector();
    this.friction = 1;
    this.force = new Vector();
}

Dot.prototype.scaleAll = function( scale )
{
    return;
    this.radius *= scale;
    this.maxSpeed *= scale;
    this.minSpeed *= scale;
    this.position.multScalar(scale);
    this.speed.multScalar(scale);
    this.acceleration.multScalar(scale);
    this.force.multScalar(scale);
}

Dot.prototype.render = function(cntx)
{  
    cntx.save();
    cntx.globalAlpha = this.alpha;
    cntx.translate(this.position.x * cntx.canvas.width, this.position.y * cntx.canvas.width);
    cntx.rotate(this.rotation);
    cntx.drawImage(this.img, -this.radius * cntx.canvas.width, -this.radius * cntx.canvas.width, this.radius*cntx.canvas.width*2, this.radius*cntx.canvas.width*2);
    cntx.restore();
}

Dot.prototype.update = function(deltaTime)
{ 
    this.acceleration.add( this.force );
    this.force.set( new Vector(0, 0) );
    this.speed.add(this.acceleration);
    this.speed.limit(this.maxSpeed, this.minSpeed);
    this.acceleration.set( new Vector() );
    this.speed.multScalar( this.friction );
    this.position.add(this.speed.getMultScalar(deltaTime));
    this.collideWithBorders();
    this.rotation += this.angularSpeed * deltaTime;
}

//main movement functionality
Dot.prototype.collideWithBorders = function()
{
    //LEFT
    if(this.position.x-this.radius < 0)
    {
        this.speed.x = Math.abs(this.speed.x);
        if(this.speed.x == 0) this.acceleration.x += this.maxSpeed * 0.05;
    }
    //RIGHT
    else if(this.position.x+this.radius > 1)
    {
        this.speed.x = -Math.abs(this.speed.x);
        if(this.speed.x == 0) this.acceleration.x -= this.maxSpeed * 0.05;
    }
    //TOP
    if(this.position.y-this.radius < 0)
    {
        this.speed.y = Math.abs(this.speed.y);
        if(this.speed.y == 0) this.acceleration.y += this.maxSpeed * 0.05;
    }
    //BOTTOM
    else if(this.position.y+this.radius > 9/16)
    {
        this.speed.y = -Math.abs(this.speed.y);
        if(this.speed.y == 0) this.acceleration.y -= this.maxSpeed * 0.05;
    }
}

Dot.prototype.getDistance = function( pos )
{
    return Math.sqrt( this.getDistanceSqd( pos ) );
}

Dot.prototype.getDistanceSqd = function ( pos )
{
    return ( Math.pow(this.position.x - pos.x, 2) +  Math.pow(this.position.y - pos.y, 2) ); 
}

//collection movement functionality
Dot.prototype.checkCollision = function( pos, rad )
{
    if(typeof(rad) == 'undefined') rad = 0;

    //check distance from mouse click to dot position
    var distSqd = this.getDistanceSqd( pos );

    if(distSqd < Math.pow(this.radius + rad, 2)){
                
        return true;
    }
    
    return false;
}

Dot.prototype.bounce = function(pos)
{
    var a = Math.atan2(this.position.y - pos.y, this.position.x - pos.x);
    var speed = Math.sqrt(Math.pow(this.speed.x, 2) + Math.pow(this.speed.y, 2));
    this.speed.x = Math.cos(a) * speed;
    this.speed.y = Math.sin(a) * speed;
}

Dot.types = {
    MAIN : 0,
    LARGE : 1,
    SCORE : 2,
    REMOTE : 3
}
