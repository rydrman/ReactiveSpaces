var Game = function(){
    
    this.mainDots = [];
    this.colMainDots = [];
    this.largeDots = [];
    
    this.initialTime = new Date();
    this.canvasPos;
    
    this.largeDotCount = 10;
}

Game.prototype.update = function(){

    //getting framerate
    this.newTime = new Date();
    this.ellapsedTime = this.newTime.getTime() - this.initialTime.getTime();
    
    //MAIN DOT
    //adding main dots
    if(this.mainDots.length < 20){
        if(this.ellapsedTime > 1000){
            this.mainDots.push(new MainDot() );
        }   
    }    
    //updating main dots
    for(var i=0; i < this.mainDots.length; i++){
       this.mainDots[i].update();
        
        if(this.mainDots[i].collected == true){
            this.colMainDots.push(this.mainDots[i]);
            this.largeDotCount+=10;
            console.log(this.largeDotCount);
        }
    }    
    //deleting main dots when collected
    for(var i=0; i < this.mainDots.length; ++i){
        for(var k=0; k<this.colMainDots.length; ++k){
            if(this.mainDots[i] == this.colMainDots[k])
                this.mainDots.pop(this.mainDots[i]);
        }
    }

    //LARGE DOT
    if(this.largeDotCount > 100){
        this.largeDots.push(new largeDot() );
    }
    //updating large dots
    for(var i=0; i < this.largeDots.length; i++){
       this.largeDots[i].update();
    }
    
    //SCORE DOT
}

Game.prototype.render = function(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    //MAIN DOT
    //rendering main dots
    for(var i=0; i <this.mainDots.length; i++){
       this.mainDots[i].render();
    }
    
    //LARGE DOT
    //rendering large dots
    for(var i=0; i <this.largeDots.length; i++){
       this.largeDots[i].render();
    }
    
    //SCORE DOT
}

Game.prototype.getMousePosition = function(Event) {
    //get mouse position    
    mousePos = new Vector(Event.clientX, Event.clientY);
    
    //convert position to canvas space
    var rect = canvas.getBoundingClientRect();
    this.canvasPos = new Vector( (mousePos.X-rect.left)/(rect.right-rect.left)*canvas.width, (mousePos.Y-rect.top)/(rect.bottom-rect.top)*canvas.width);
        
    //check for collection of dots
    for(var i=0; i < this.mainDots.length; i++){
       this.mainDots[i].collection(this.canvasPos);
    }
    
    
}