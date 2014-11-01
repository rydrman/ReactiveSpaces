var MainDot = function(){

    this.position = new Vector(Math.random()*canvas.width, Math.random()*canvas.height );
}

MainDot.prototype.render = function(){
    var img = document.getElementById("mainDotImage");
    ctx.drawImage(img, this.position.X, this.position.Y);
}

MainDot.prototype.update = function(){

    
    
}


