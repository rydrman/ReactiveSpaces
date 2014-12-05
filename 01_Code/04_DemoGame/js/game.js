var Game = function()
{
    
    this.useMouse = true;
    
    //for drawing 
    this.bufferCanvas = document.createElement('canvas');
    this.bufferCtx = this.bufferCanvas.getContext('2d');
    
    //scoring
    this.ui = new UI();
    
    
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
    this.roundStart = new Date().getTime();
    this.lobbyStart = new Date().getTime();
    this.roundLength = 60000;
    this.lobbyLength = 15000;
    this.inRound = false;
    this.lastFrame = this.initialTime;
    this.lastMainDot = this.initialTime;
    this.lastScoreDot = this.initialTime;
    this.framerate = 30;
    
    //main dots 
    this.maxMainDots = 10;
    this.mainDotInterval = 1000;
    
    //score dots
    this.maxScoreDots = 10;
    this.scoreDotInterval = 1000;
    this.scoreDotRad = 0.02;
    this.ScoreDotsRotation = 0;
    
    this.largeRad = 50;
    
    //remote dots
    this.remoteDots = [];
    
    this.canvasMiddle = new Vector(0.5, 0.5 * ( 9/16 ));
    
    //setup mouse hand
    this.useMouse = true;
    var mouseHand = new Hand(this.handEmptyImg, this.handFullImg, this.handCollectImg);
    mouseHand.joint = 'mouse';
    this.hands.push( mouseHand );
    
    RS.addEventListener(RS.Events.message, function(station, message){game.onMsgRecieved.call(game, station, message)});
    RS.addEventListener(RS.Events.localplayerenter, function(station, skeleton){game.onPlayerEnter.call(game, station, skeleton)});
    RS.addEventListener(RS.Events.localplayerexit, function(station, skeleton){game.onPlayerExit.call(game, station, skeleton)});
    RS.addEventListener(RS.Events.stationlocal, function(station){game.onStationLocal.call(game, station)});
    RS.addEventListener(RS.Events.stationconnect, function(station){game.onStationRemote.call(game, station)});
    
    this.tryConnect();
    this.startRound();
}

Game.prototype.startRound = function()
{
    this.roundStart = new Date().getTime();
    this.inRound = true;
    this.mainDots = [];
    this.scoreDots = [];
    this.remoteDots = [];
    this.largeDots = [];
    this.ui.score = 0;
    this.roundStart = new Date().getTime();
    this.inRound = true;
    this.ui.inRound = true;
    for(var i in this.hands)
        this.hands[i].value = 0;
    
    this.ui.closeMenu();
}

Game.prototype.endRound = function()
{
    this.ui.openMenu();
    this.lobbyStart = new Date().getTime();
    this.inRound = false;
    this.ui.inRound = false;
    for(var i in this.hands)
        this.hands[i].value = 0;
}

Game.prototype.tryConnect = function()
{
    //connect to rective spaces
    RS.Connect("RS Demo Game", 1.1);
}
       
Game.prototype.onStationLocal = function(station)
{
    //mouse as hand if no kinect
    if(station.features.indexOf(RS.Features.Kinect) == -1)
    {
        //keep using mouse
        return;
    }
    else
    {
        //stop using mouse and reset hands
        this.useMouse = false;
        this.hands = [];
    }
}

Game.prototype.onStationRemote = function(station)
{
    station.score = 0;
    //broadcast my current score
    RS.Send( {score: this.ui.score} );
}

Game.prototype.onPlayerEnter = function(station, skeleton)
{
    var handL = new Hand(this.handEmptyImg, this.handFullImg, this.handCollectImg);
    handL.joint = skeleton.joints[RS.JointTypes.HAND_LEFT];
    
    var handR = new Hand(this.handEmptyImg, this.handFullImg, this.handCollectImg);
    handR.joint = skeleton.joints[RS.JointTypes.HAND_RIGHT];
    
    this.hands.push(handL);
    this.hands.push(handR);
}

Game.prototype.onPlayerExit = function(station, skeleton)
{
}

Game.prototype.onMsgRecieved = function( station, msg )
{
    if(msg.position)
    {
        var remoteDot = new Dot(Dot.types.REMOTE, 0.05, this.remoteDotImg);
        remoteDot.lifeSpan = 10000;
        remoteDot.position = new Vector(remoteDot.position.x, remoteDot.position.y);
        remoteDot.timeCreated = new Date().getTime();
        remoteDot.speed.set(new Vector(0.02 + Math.random() * 0.02, 0.02 + Math.random() * 0.02));
        if (Math.random() > 0.5) remoteDot.speed.x *= -1;
        if (Math.random() > 0.5) remoteDot.speed.y *= -1;
        TweenLite.from( remoteDot, 0.5, {radius: 0, ease:Linear.EaseIn});
        this.remoteDots.push( remoteDot );
    }
    if(msg.score)
    {
        station.score = msg.score;
    }
    if(typeof(msg.round) != 'undefined')
    {
        if(true == msg.round && !this.inRound)
        {
            this.roundLength = msg.roundLength;
            this.startRound();
        }
        else if(false == msg.round && this.inRound) 
                //&& this.roundLength - Date().getTime() - this.roundStart < 1000)
        {
            this.lobbyLength = msg.lobbyLength;
            this.endRound();
        }
            
    }
}

Game.prototype.update = function()
{

    if(!RS.connected)
        this.tryConnect();
    
    //getting framerate
    var now = new Date().getTime();
    this.ellapsedTime = now - this.initialTime;
    var deltaTime = (now - this.lastFrame) * 0.001; 
    this.lastFrame = now;
    if(deltaTime != 0)
        this.framerate = 0.1 * (1 / deltaTime) + 0.9 * this.framerate;
    
    //get time left
    if(this.inRound)
    {
        var ellapsedRound = now - this.roundStart;
        var timeLeft = this.roundLength - ellapsedRound; 
        this.ui.timeLeft = timeLeft;
        if(timeLeft <= 0)
        {
            RS.Send({round: false, lobbyLength: this.lobbyLength});
            this.endRound();
        }
    }
    else
    {
        var ellapsedLobby = now - this.lobbyStart;
        var timeLeft = this.lobbyLength - ellapsedLobby; 
        this.ui.lobbyTimeLeft = timeLeft;
        if(timeLeft <= 0)
        {
            RS.Send({round: true, roundLength:this.roundLength});
            this.startRound();
        }
    }
        
    
    
    //MAIN DOT
    //adding main dots
    if(this.mainDots.length < this.maxMainDots && now-this.lastMainDot > this.mainDotInterval)
    {
        var dot = new Dot(Dot.types.MAIN, 0.02, this.mainDotImg);
        dot.position.set(this.getOffScreenStartPos(0.02));
        dot.speed.set( new Vector( 0.15 + Math.random() * 0.15, 0.15 + Math.random() * 0.15 ) );
        dot.friction = 0.99;
        dot.minSpeed = 0.05;
        dot.maxSpeed = 0.5;
        this.mainDots.push( dot );
        this.lastMainDot = now;
    }    

    //updating main dots
    for(var i = this.mainDots.length - 1; i >= 0; i--)
    {
        this.mainDots[i].update(deltaTime);

        //pushed by joints
        var joint, 
            delta = new RS.Vector3(),
            deltaSpeed = new RS.Vector3(),
            canvasPos = new RS.Vector3(),
            perc, distSqd;
        for(var j in RS.remotePlayers)
        {
            if(!RS.remotePlayers[j].userPresent) continue;
            for(var k in RS.remotePlayers[j].joints)
            {
                joint = RS.remotePlayers[j].joints[k];
                canvasPos.x =  RS.remotePlayers[j].joints[k].positionSmoothed.x * this.bufferCanvas.width;
                canvasPos.y =  RS.remotePlayers[j].joints[k].positionSmoothed.y * this.bufferCanvas.height;

                delta.SetFromVector( this.mainDots[i].position );
                delta.SubVector( canvasPos );
                delta.z = 0;

                distSqd = delta.LengthSqd();
                perc =  1 - (distSqd / (50 * 50));
                if(perc > 0)
                {
                    //push dot
                    deltaSpeed.SetFromVector( joint.velocity );
                    deltaSpeed.SubVector( this.mainDots[i].speed );
                    deltaSpeed.MultiplyScalar( perc );
                    this.mainDots[i].acceleration.add( deltaSpeed );
                }
            }
        }

        //collide with hands
        if(!this.inRound) continue;
        
        for(var j in this.hands)
        {
            if(this.hands[j].emptying) continue;
            var collision = this.mainDots[i].checkCollision(this.hands[j].position, this.hands[j].rad);
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
        dot.speed.set( new Vector( 0.07 + Math.random() * 0.07, 0.07 + Math.random() * 0.07 ) );
        dot.angularSpeed = Math.PI + Math.random() * Math.PI;
        this.scoreDots.push( dot );
        this.lastScoreDot = now;
    }

    //updating score dots 
    for (var i in this.scoreDots)
    {
        if (this.scoreDots[i].collected) continue;
        this.scoreDots[i].update(deltaTime);
        
        if(!this.inRound) continue;
        
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
                    onCompleteParams: [this.scoreDots[i], true],
                    onCompleteScope: this
                });
                break;
            }
        }
        for (var j in this.remoteDots)
        {
            var collision = this.remoteDots[j].checkCollision(this.scoreDots[i].position, this.scoreDotRad);
            if (collision)
            {
                this.scoreDots[i].collected = true;
                TweenLite.to(this.scoreDots[i].position, 0.5, {
                    x: this.remoteDots[j].position.x,
                    y: this.remoteDots[j].position.y,
                    ease: Linear.EaseIn
                });
                TweenLite.to(this.scoreDots[i], 0.5, {
                    alpha: 0,
                    radius: 0,
                    ease: Linear.EaseNone,
                    onComplete: this.removeScoreDot,
                    onCompleteParams: [this.scoreDots[i], false],
                    onCompleteScope: this
                });
                break;
            }
        }
    }

    //HANDS
    for(var i = this.hands.length - 1; i >= 0; i--)
    {
        //check for removed
        if(this.hands[i].joint != 'mouse')
        {
            
            if(this.hands[i].joint == null || !this.hands[i].joint.skeleton.userPresent)
            {
                this.hands.splice(i, 1);
                continue;
            }
        }
        //check for menu
        if(this.hands[i].position.x > 0.95 && this.hands[i].position.y < 0.1)
            this.ui.openMenu(true);
        
        var newLargeDot = this.hands[i].update(deltaTime);
        if(newLargeDot)
        {
            var dot = new Dot(Dot.types.LARGE, 0.05, this.largeDotImg);
            dot.position = this.hands[i].position;
            dot.lifeSpan = 10000;
            dot.timeCreated = now;
            var callback = function(){
                dot.speed.set(new Vector(0.05 + Math.random() * 0.05, 0.05 + Math.random() * 0.05));
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

            //TODO collide with large dots
            //TODO suck in score dots
        }
    }

}

Game.prototype.render = function()
{
    this.bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.bufferCtx.save();
    this.bufferCtx.fillStyle = "#151518";
    this.bufferCtx.fillRect(0, 0, this.bufferCanvas.width, this.bufferCanvas.height);

    //draw remote skeletons
    for(var i in RS.remotePlayers)
    {
        RS.DrawSkeleton(this.bufferCtx, RS.remotePlayers[i], "rgba(255, 255, 255, 0.2)", true);
    }

    //LARGE DOT
    //rendering large dots
    for(var i=0; i <this.largeDots.length; i++)
    {
       this.largeDots[i].render(this.bufferCtx);
    }

    //SCORE DOT
    for (var i = 0; i < this.scoreDots.length; i++) 
    {
        this.scoreDots[i].render(this.bufferCtx);
    }

    //MAIN DOT
    //rendering main dots
    for(var i=0; i <this.mainDots.length; i++)
    {
       this.mainDots[i].render(this.bufferCtx);
    }

    //REMOTE DOT
    for(var i in this.remoteDots)
    {
        this.remoteDots[i].render(this.bufferCtx);
    }

    //HANDS
    for(var i in this.hands)
    {
        this.hands[i].render(this.bufferCtx,  this.canvasMiddle );
    }

    //score counters
    this.bufferCtx.font = "24px sans-serif";
    this.bufferCtx.textAlign = 'center';
    for (var i in this.scoreCounters)
    {
        this.bufferCtx.save();
        this.bufferCtx.fillStyle = this.scoreCounters[i].color;
        this.bufferCtx.globalAlpha = this.scoreCounters[i].alpha;
        this.bufferCtx.translate(this.scoreCounters[i].position.x * this.bufferCanvaswidth, 
                      this.scoreCounters[i].position.y * this.bufferCanvaswidth);
        this.bufferCtx.fillText(this.scoreCounters[i].value, 0, 0);
        this.bufferCtx.restore();
    }
    
    this.bufferCtx.restore();
    
    this.uiImage = this.ui.getRender(this.bufferCanvas);
    
    //UI
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.bufferCanvas, 0, 0, this.bufferCanvas.width, this.bufferCanvas.height);
    ctx.drawImage(this.uiImage, 0, 0);
    
    //debug fps
    ctx.fillStyle = "#333";
    ctx.fillText("FPS: " + Math.floor(this.framerate), 10, canvas.height -10);
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

Game.prototype.removeScoreDot = function( scoreDot, getScore )
{
    for (var i in this.scoreDots)
    {
        if (this.scoreDots[i].id == scoreDot.id)
        {
            this.scoreDots.splice(i, 1);
            
            var position = new Vector();
                position.set(scoreDot.position);
                var counter = {
                    id: this.lastScoreCounterID++,
                    value: "+1",
                    position: position,
                    color: "#FFF",
                    alpha:1
                }
            
            if(getScore)
            {
                this.ui.score++;
                RS.Send({score: this.ui.score});
            }
            else
            {
                counter.value = "x";
                counter.color = "#ff3434";
            }

            TweenLite.to(counter, 1.5, { alpha: 0, ease: Linear.EaseOut, onComplete: this.removeScoreCounter, onCompleteParams: [counter], onCompleteScope: this });
            TweenLite.to(counter.position, 1.5, { y: counter.position.y - 0.1, ease: Linear.EaseOut});
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
    
    var x = ( randX ) ? Math.random() : ( (Math.random() < 0.5 ) ? -rad : 1 + rad);
    var y = ( !randX ) ? Math.random() : ( (Math.random() < 0.5 ) ? -rad : 1 + rad);
    
    return new Vector(x , y);
}

Game.prototype.onMouseClick = function( mousePos ) 
{      
    if(!this.useMouse) return;
}

Game.prototype.onMouseMove = function( mousePos )
{
    if(!this.useMouse) return;
    
    var percPos = new Vector( mousePos.x / this.bufferCanvas.width,
                              mousePos.y / this.bufferCanvas.width );
    
    this.hands[0].position.set( percPos );
}

Game.prototype.onResize = function(oldW, oldH, newW, newH)
{
    var ratioW = newW / oldW;
    var ratioH = newH / oldH;
    var ratio = (ratioW + ratioH) * 0.5;
    
    this.bufferCanvas.width = newW;
    this.bufferCanvas.height = newH;
    
    this.largeRad *= ratio;
    this.smallRad *= ratio;
    
    this.ui.resize(newW, newH);
    
    //LARGE DOT
    //rendering large dots
    for(var i=0; i <this.largeDots.length; i++)
    {
       this.largeDots[i].scaleAll( ratio );
    }

    //SCORE DOT
    for (var i = 0; i < this.scoreDots.length; i++) 
    {
        this.scoreDots[i].scaleAll( ratio );
    }
    
    //MAIN DOT
    //rendering main dots
    for(var i=0; i <this.mainDots.length; i++)
    {
       this.mainDots[i].scaleAll( ratio );
    }
    
    //REMOTE DOT
    for(var i in this.remoteDots)
    {
        this.remoteDots[i].scaleAll( ratio );
    }
}