var Game = function()
{
    //scoring
    this.score = 0;
    
    //images
    this.mainDotImg = document.getElementById("mainDotImage");
    this.largeDotImg = document.getElementById("largeDotImage");
    this.scoreDotImg = document.getElementById("scoreDotImage");
    this.handEmptyImg = document.getElementById("handEmptyImage");
    this.handFullImg = document.getElementById("handFullImage");
    this.handCollectImg = document.getElementById("handCollectImage");
    
    this.mainDots = [];
    this.largeDots = [];
    this.scoreDots = [];
    this.hands = [];
    
    
    //TIME
    this.initialTime = new Date().getTime();
    this.lastMainDot = new Date().getTime();
    this.lastScoreDot = new Date().getTime();
    
    //main dots 
    this.maxMainDots = 20;
    this.mainDotInterval = 1000;
    
    //score dots
    this.maxScoreDots = 20;
    this.scoreDotInterval = 1000;
    
    //debug mouse as hand
    this.hands.push( new Hand(this.handEmptyImg, this.handFullImg, this.handCollectImg) );
    this.canvasMiddle = new Vector(canvas.width * 0.5, canvas.height * 0.5);
}

Game.prototype.update = function()
{

    //getting framerate
    this.newTime = new Date().getTime();
    this.ellapsedTime = this.newTime - this.initialTime;
    
    //MAIN DOT
    //adding main dots
    if(this.mainDots.length < this.maxMainDots && this.newTime-this.lastMainDot > this.mainDotInterval)
    {
        var dot = new Dot(Dot.types.MAIN, 10, this.mainDotImg);
        dot.speed.set( new Vector( 2 + Math.random() * 2, 2 + Math.random() * 2 ) );
        this.mainDots.push( dot );
        this.lastMainDot = this.newTime;
    }    
    
    //updating main dots
    for(var i=this.mainDots.length-1; i>=0; i--)
    {
        this.mainDots[i].update();
        for(var j in this.hands)
        {
            var collision = this.mainDots[i].checkCollision(this.hands[0].position, this.hands[0].rad);
            if(collision)
            {
                this.hands[j].value += 10;
                TweenLite.fromTo(this.hands[j], 1, {collectAlpha:1.0},{collectAlpha: 0.0, ease:Linear.EaseOut});
                this.mainDots.splice(i, 1);
                break;
            }
        }
    }   

    //LARGE DOT
    
    //updating large dots
    for(var i=0; i < this.largeDots.length; i++)
    {
       this.largeDots[i].update();
        
        for(var j=this.scoreDots.length-1; j>=0; j--)
        {
            var collision = this.largeDots[i].checkCollision(this.scoreDots[j].position);
            if(collision)
            {
                this.scoreDots.splice(j, 1);
                this.score++;
                break;
            }
        }
    }
    
    //SCORE DOT
    
    //creating score dots
    if(this.scoreDots.length < this.maxScoreDots && this.newTime-this.lastScoreDot > this.scoreDotInterval)
    {
        var dot = new Dot(Dot.types.SCORE, 10, this.scoreDotImg);
        dot.speed.set( new Vector( 2 + Math.random() * 2, 2 + Math.random() * 2 ) );
        this.scoreDots.push( dot );
        this.lastScoreDot = this.newTime;
    }
    
    //updating score dots 
    for(var i in this.scoreDots){
       this.scoreDots[i].update();
    }
    
    //HANDS
    for(var i in this.hands)
    {
        var newLargeDot = this.hands[i].update();
        if(newLargeDot)
        {
           var dot = new Dot(Dot.types.LARGE, 50, this.largeDotImg);
            dot.speed.set( new Vector( 2 + Math.random() * 2, 2 + Math.random() * 2 ) );
            this.largeDots.push( dot );
        }
         
    }

}

Game.prototype.render = function()
{
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
     for(var i=0; i <this.scoreDots.length; i++){
       this.scoreDots[i].render();
    }
    
    //HANDS
    for(var i in this.hands)
    {
        this.hands[i].render( this.canvasMiddle );
    }
    
    //UI 
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText("Score: " + this.score, 10, 30);
}

Game.prototype.onMouseClick = function( mousePos ) 
{      
    
}

Game.prototype.onMouseMove = function( mousePos )
{
    //debug one hand
    this.hands[0].position.set( mousePos );
}