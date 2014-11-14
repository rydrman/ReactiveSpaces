var Game = function()
{
    //scoring
    this.ui = new UI();
    this.ui.resize(canvas.width, 50);
    
    //images
    this.mainDotImg = document.getElementById("mainDotImage");
    this.largeDotImg = document.getElementById("largeDotImage");
    this.remoteDotImg = document.getElementById("remoteDotImage");
    this.scoreDotImg = document.getElementById("scoreDotImage");
    this.handEmptyImg = document.getElementById("handEmptyImage");
    this.handFullImg = document.getElementById("handFullImage");
    this.handCollectImg = document.getElementById("handCollectImage");
    
    this.mainDots = [];
    this.largeDots = [];
    this.scoreDots = [];
    this.hands = [];
    this.scoreCounters = [];
    this.lastScoreCounterID = 0;
    
    //TIME
    this.initialTime = new Date().getTime();
    this.lastFrame = this.initialTime;
    this.lastMainDot = this.initialTime;
    this.lastScoreDot = this.initialTime;
    
    //main dots 
    this.maxMainDots = 10;
    this.mainDotInterval = 1000;
    
    //score dots
    this.maxScoreDots = 10;
    this.scoreDotInterval = 1000;
    this.scoreDotRad = 10;
    
    //remote dots
    this.remoteDots = [];
    
    //debug mouse as hand
    this.hands.push( new Hand(this.handEmptyImg, this.handFullImg, this.handCollectImg) );
    this.canvasMiddle = new Vector(canvas.width * 0.5, canvas.height * 0.5);
    
    //connect to rective saces
    RS.Connect("RS Demo Game", 1.0);
    RS.addEventListener(RS.Events.message, function(station, message){game.onDotRecieved.call(game, station, message)});
}

Game.prototype.onDotRecieved = function( station, dot )
{
    var remoteDot = new Dot(Dot.types.REMOTE, 50, this.remoteDotImg);
    remoteDot.lifespan = 10000;
    remoteDot.position = new Vector(dot.position.x, dot.position.y);
    remoteDot.timeCreated = new Date().getTime();
    remoteDot.speed.set(new Vector(20 + Math.random() * 20, 20 + Math.random() * 20));
    if (Math.random() > 0.5) remoteDot.speed.x *= -1;
    if (Math.random() > 0.5) remoteDot.speed.y *= -1;
    TweenLite.from( remoteDot, 0.5, {radius: 0, ease:Linear.EaseIn});
    this.remoteDots.push( remoteDot );
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
        dot.position.set(this.getOffScreenStartPos(10));
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
    var largeDot, collDot;
    for(var i in this.largeDots)
    {
        largeDot = this.largeDots[i];
        
        largeDot.update(deltaTime);
        
        //check to see if it's time to die
        if(!largeDot.dying && now - largeDot.timeCreated > largeDot.lifeSpan)
        {
            //animate it out
            largeDot.dying = true;
            TweenLite.to(largeDot, 2, {alpha: 0, radius:0, ease:Linear.EaseIn, onComplete:this.removeLargeDot, onCompleteParams:[largeDot], onCompleteScope:this});
        }

        //collide with other large dots
        for(var j = parseInt(i)+1; j < this.largeDots.length; ++j)
        {
            collDot = this.largeDots[j];
            if(largeDot.checkCollision( collDot.position, collDot.radius ))
            {
                //get vector
                largeDot.bounce(collDot.position);
                collDot.bounce(largeDot.position);
            }
        }
    }
    
    //SCORE DOT
    
    //creating score dots
    if(this.scoreDots.length < this.maxScoreDots && now-this.lastScoreDot > this.scoreDotInterval)
    {
        var dot = new Dot(Dot.types.SCORE, this.scoreDotRad, this.scoreDotImg);
        dot.position.set(this.getOffScreenStartPos(this.scoreDotRad));
        dot.speed.set( new Vector( 25 + Math.random() * 25, 25 + Math.random() * 25 ) );
        this.scoreDots.push( dot );
        this.lastScoreDot = now;
    }
    
    //updating score dots 
    for (var i in this.scoreDots)
    {
        if (this.scoreDots[i].collected) continue;
        this.scoreDots[i].update(deltaTime);

        for (var j in this.largeDots)
        {
            var collision = this.largeDots[j].checkCollision(this.scoreDots[i].position, this.scoreDotRad);
            if (collision)
            {
                this.scoreDots[i].collected = true;
                TweenLite.to(this.scoreDots[i].position, 0.5, {
                    x: this.largeDots[j].position.x,
                    y: this.largeDots[j].position.y,
                    ease: Linear.EaseIn
                });
                TweenLite.to(this.scoreDots[i], 0.5, {
                    alpha: 0,
                    radius: 0,
                    ease: Linear.EaseNone,
                    onComplete: this.removeScoreDot,
                    onCompleteParams: [this.scoreDots[i]],
                    onCompleteScope: this
                });
                break;
            }
        }
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
                dot.speed.set(new Vector(20 + Math.random() * 20, 20 + Math.random() * 20));
                if (Math.random() > 0.5) dot.speed.x *= -1;
                if (Math.random() > 0.5) dot.speed.y *= -1;
                dot.position = new Vector(dot.position.x, dot.position.y);
            }
            TweenLite.from(dot, 1, {radius: 0, ease: Linear.EaseOut, onComplete: callback });
            TweenLite.to(this.hands[i], 1, {value: 0, ease: Linear.EaseOut, onComplete: callback });
            this.largeDots.push( dot );
            
            //also ad this dot to the remote people
            RS.Send( {position: dot.position} );
        }
         
    }
    
    //REMOTE DOT
    for(var i in this.remoteDots)
    {
        var remoteDot = this.remoteDots[i];
        remoteDot.update(deltaTime);
        
        //remove
        if(!remoteDot.dying && now - remoteDot.timeCreated > remoteDot.lifeSpan)
        {
            //animate it out
            remoteDot.dying = true;
            TweenLite.to(remoteDot, 2, {alpha: 0, radius:0, ease:Linear.EaseIn, onComplete:this.removeRemoteDot, onCompleteParams:[remoteDot], onCompleteScope:this});
        }
    }

}

Game.prototype.render = function()
{
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    //LARGE DOT
    //rendering large dots
    for(var i=0; i <this.largeDots.length; i++)
    {
       this.largeDots[i].render();
    }

    //SCORE DOT
    for (var i = 0; i < this.scoreDots.length; i++) 
    {
        this.scoreDots[i].render();
    }
    
    //MAIN DOT
    //rendering main dots
    for(var i=0; i <this.mainDots.length; i++)
    {
       this.mainDots[i].render();
    }
    
    //REMOTE DOT
    for(var i in this.remoteDots)
    {
        this.remoteDots[i].render();
    }
    
    //HANDS
    for(var i in this.hands)
    {
        this.hands[i].render( this.canvasMiddle );
    }
    
    
    
    //score counters
    ctx.font = "24px sans-serif";
    ctx.textAlign = 'center';
    for (var i in this.scoreCounters)
    {
        ctx.save();
        ctx.fillStyle = "#FFF";
        ctx.globalAlpha = this.scoreCounters[i].alpha;
        ctx.translate(this.scoreCounters[i].position.x, this.scoreCounters[i].position.y);
        ctx.fillText("+" + this.scoreCounters[i].value, 0, 0);
        ctx.restore();
    }
    
    //UI
    var uiImage = this.ui.getRender(canvas);
    ctx.drawImage(uiImage, 0, 0);
}

Game.prototype.removeLargeDot = function( largeDot )
{
    for (var i in this.largeDots)
    {
        if (this.largeDots[i].id == largeDot.id)
        {
            this.largeDots.splice(i, 1);
            return;
        }
    }
}

Game.prototype.removeRemoteDot = function( remoteDot )
{
    for (var i in this.remoteDots)
    {
        if (this.remoteDots[i].id == remoteDot.id)
        {
            this.remoteDots.splice(i, 1);
            return;
        }
    }
}

Game.prototype.removeScoreDot = function( scoreDot )
{
    for (var i in this.scoreDots)
    {
        if (this.scoreDots[i].id == scoreDot.id)
        {
            this.scoreDots.splice(i, 1);
            this.ui.score++;
            
            var position = new Vector();
            position.set(scoreDot.position);
            var counter = {
                id: this.lastScoreCounterID++,
                value: 1,
                position: position,
                alpha:1
            }
            TweenLite.to(counter, 1.5, { alpha: 0, ease: Linear.EaseOut, onComplete: this.removeScoreCounter, onCompleteParams: [counter], onCompleteScope: this });
            TweenLite.to(counter.position, 1.5, { y: counter.position.y - 30, ease: Linear.EaseOut});
            this.scoreCounters.push(counter);


            return;
        }
    }
}

Game.prototype.removeScoreCounter = function (scoreCounter)
{
    for (var i in this.scoreCounters)
    {
        if (this.scoreCounters[i].id == scoreCounter.id)
        {
            this.scoreCounters.splice(i, 1);
            return;
        }
    }
}

Game.prototype.getOffScreenStartPos = function( rad )
{
    var randX = ( Math.random() < 0.5 ) ? true : false; 
    
    var x = ( randX ) ? Math.random() * canvas.width : ( (Math.random() < 0.5 ) ? -rad : canvas.width + rad);
    var y = ( !randX ) ? Math.random() * canvas.height : ( (Math.random() < 0.5 ) ? -rad : canvas.height + rad);
    
    return new Vector(x , y);
}

Game.prototype.onMouseClick = function( mousePos ) 
{      
    
}

Game.prototype.onMouseMove = function( mousePos )
{
    //debug one hand
    this.hands[0].position.set( mousePos );
}