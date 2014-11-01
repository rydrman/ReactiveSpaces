var Game = function(){
    
    this.mainDots = [];
    this.initialTime = new Date();
}

Game.prototype.update = function(){

    this.newTime = new Date();
    this.ellapsedTime = this.newTime.getTime() - this.initialTime.getTime();
    
    
    if(this.mainDots.length < 20){
        if(this.ellapsedTime > 1000){
            this.mainDots.push(new MainDot() );
            console.log(this.mainDots.length+", "+ this.ellapsedTime);
        }
        
    }
    
    for(var i=0; i < this.mainDots.length; i++){
       this.mainDots[i].update();
    }

}

Game.prototype.render = function(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    
    for(var i=0; i <this.mainDots.length; i++){
       this.mainDots[i].render();
    }
}