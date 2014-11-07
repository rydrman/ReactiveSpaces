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
    this.lastFrame = this.initialTime;
    this.lastMainDot = this.initialTime;
    this.lastScoreDot = this.initialTime;
    
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
    var now = new Date().getTime();
    this.ellapsedTime = now - this.initialTime;
    var deltaTime = (now - this.lastFrame) * 0.001; 
    this.lastFrame = now;
    
    //MAIN DOT
    //adding main dots
    if(this.mainDots.length < this.maxMainDots && now-this.lastMainDot > this.mainDotInterval)
    {
        var dot = new Dot(Dot.types.MAIN, 10, this.mainDotImg);
        dot.speed.set( new Vector( 50 + Math.random() * 50, 50 + Math.random() * 50 ) );
        this.mainDots.push( dot );
        this.lastMainDot = now;
    }    
    
    //updating main dots
    for(var i = this.mainDots.length - 1; i >= 0; i--)
    {
        this.mainDots[i].update(deltaTime);
        for(var j in this.hands)
        {
            if(this.hands[j].emptying) continue;
            var collision = this.mainDots[i].checkCollision(this.hands[0].position, this.hands[0].rad);
            if(collision)
            {
                this.hands[j].targetValue += 25;
                TweenLite.fromTo(this.hands[j], 1, {collectAlpha:1.0}, {collectAlpha: 0.0, value:this.hands[j].targetValue, ease:Linear.EaseOut});
                this.mainDots.splice(i, 1);
                break;
            }
        }
    }   

    //LARGE DOT
    
    //updating large dots
    var largeDot;
    for(var i=0; i < this.largeDots.length; i++)
    {
        largeDot = this.largeDots[i];
        
        largeDot.update(deltaTime);
        
        //check to see if it's time to die
        if(now - largeDot.timeCreated > largeDot.lifeSpan)
        {
            //animate it out
            TweenLite.to(largeDot, 2, {alpha: 0, radius:0, ease:Linear.EaseIn, onComplete:this.removeLargeDot, onCompleteParams:[largeDot], onCompleteScope:this});
        }

        for(var j=this.scoreDots.length-1; j>=0; j--)
        {
            var collision = largeDot.checkCollision(this.scoreDots[j].position);
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
    if(this.scoreDots.length < this.maxScoreDots && now-this.lastScoreDot > this.scoreDotInterval)
    {
        var dot = new Dot(Dot.types.SCORE, 10, this.scoreDotImg);
        dot.speed.set( new Vector( 25 + Math.random() * 25, 25 + Math.random() * 25 ) );
        this.scoreDots.push( dot );
        this.lastScoreDot = now;
    }
    
    //updating score dots 
    for(var i in this.scoreDots){
       this.scoreDots[i].update(deltaTime);
    }
    
    //HANDS
    for(var i in this.hands)
    {
        
        var newLargeDot = this.hands[i].update(deltaTime);
        if(newLargeDot)
        {
            var dot = new Dot(Dot.types.LARGE, 50, this.largeDotImg);
            dot.position = this.hands[i].position;
            dot.lifeSpan = 10000;
            dot.timeCreated = now;
            var callback = function(){
                dot.speed.set( new Vector( 20 + Math.random() * 20, 20 + Math.random() * 20 ) );
                dot.position = new Vector(dot.position.x, dot.position.y);
            }
            TweenLite.from(dot, 1, {radius: 0, ease: Linear.EaseOut, onComplete: callback });
            TweenLite.to(this.hands[i], 1, {value: 0, ease: Linear.EaseOut, onComplete: callback });
            this.largeDots.push( dot );
        }
         
    }

}

Game.prototype.render = function()
{
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    //SCORE DOT
     for(var i=0; i <this.scoreDots.length; i++){
       this.scoreDots[i].render();
    }
    
    //LARGE DOT
    //rendering large dots
    for(var i=0; i <this.largeDots.length; i++){
       this.largeDots[i].render();
    }
    
    //MAIN DOT
    //rendering main dots
    for(var i=0; i <this.mainDots.length; i++){
       this.mainDots[i].render();
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

Game.prototype.removeLargeDot = function( largeDot )
{
    var index = this.largeDots.indexOf(largeDot);
    
    if(index != -1)
        this.largeDots.splice(index, 1);
}

Game.prototype.onMouseClick = function( mousePos ) 
{      
    
}

Game.prototype.onMouseMove = function( mousePos )
{
    //debug one hand
    this.hands[0].position.set( mousePos );
}