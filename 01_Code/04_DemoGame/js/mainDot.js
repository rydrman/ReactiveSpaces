var MainDot = function(){
    this.img = document.getElementById("mainDotImage");
    this.position = new Vector(Math.random()*canvas.width, Math.random()*canvas.height );
    
    this.accel = new Vector(Math.random()*10, Math.random()*7); 
    
    this.speed = new Vector();
    this.speed.X = this.accel.X;
    this.speed.Y = this.accel.Y;
    
    this.collected = false;
}

MainDot.prototype.render = function(){
    
    ctx.drawImage(this.img, this.position.X, this.position.Y);
}

MainDot.prototype.update = function(){
    
    this.move();
}

//main movement functionality
MainDot.prototype.move = function(){
    
    if(this.position.X < 0){
        this.speed.X = this.accel.X;
        this.speed.Y = (this.speed.Y <0)? this.accel.Y : -this.accel.Y;
    }
    else if(this.position.X+this.img.width > canvas.width){
        this.speed.X = -this.accel.X;
        this.speed.Y = (this.speed.Y <0)? this.accel.Y : -this.accel.Y;
    }
    if(this.position.Y < 0){
        this.speed.Y = this.accel.Y;
        this.speed.X = (this.speed.X <0)? this.accel.X : -this.accel.X;
    }
    else if(this.position.Y+this.img.height > canvas.height){
        this.speed.Y = -this.accel.Y;
        this.speed.X = (this.speed.X <0)? this.accel.X : -this.accel.X;
    }
    
    //move dot
    this.position.X += this.speed.X;
    this.position.Y += this.speed.Y;
}

//collection movement functionality
MainDot.prototype.collection = function( canvasPos ){

    //check distance from mouse click to dot position
    var dist = new Vector( this.position.X - canvasPos.X, this.position.Y - canvasPos.Y );
    
    var mag = Math.sqrt( (dist.X*dist.X) + (dist.Y*dist.Y) );
    if(mag < 100){
        this.position.X = canvasPos.X;
        this.position.Y = canvasPos.Y;
        
        this.collected = true;
    }
    
}