var largeDot = function(){
    
    this.img = document.getElementById("largeDotImage");
    this.position = new Vector(100,100);
}

largeDot.prototype.render = function(){
    
    ctx.drawImage(this.img, this.position.X, this.position.Y);
}

largeDot.prototype.update = function(){
    this.move();
}

largeDot.prototype.move = function(){
    
}

largeDot.collectScore = function(){

}