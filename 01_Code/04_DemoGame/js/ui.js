var UI = function (logoImg)
{
    this.mainCanvas = document.createElement('canvas');
    this.mainCtx = this.mainCanvas.getContext('2d');
    
    this.topBarCanvas = document.createElement('canvas');
    this.topBarCtx = this.topBarCanvas.getContext('2d');
    
    this.profileCanvas = document.createElement('canvas');
    this.profileCtx = this.profileCanvas.getContext('2d');
    
    this.countCanvas = document.createElement('canvas');
    this.countCtx = this.countCanvas.getContext('2d');

    this.menuOpenAmount = 0;
    this.menuTimeout = null;
    this.inRound = false;
    this.timeLeft = 0;
    this.lobbyTimeLeft = 0;
    this.score = 0;
    this.image = logoImg;
    
    this.frame = 0;
}

UI.prototype.resize = function(x, y)
{
    this.mainCanvas.width = x;
    this.mainCanvas.height = y;
    this.topBarCanvas.width = x;
    this.topBarCanvas.height = y * 0.12;
    this.countCanvas.width = y * 0.6;
    this.countCanvas.height = y * 0.6;
    this.profileCanvas.width = x * 0.3;
    this.profileCanvas.height = y * 0.25;
    
    this.fontSize = Math.floor(this.topBarCanvas.height * 0.4);
}

UI.prototype.getRender = function(cvs)
{
    this.frame++;
    
    this.drawTopBar(cvs);
    
    if(!this.inRound)
    {
        this.drawRoundCountdown(cvs);
    }

    //compile
    this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    this.mainCtx.drawImage(this.topBarCanvas, 0, 0);
    if(!this.inRound)
        this.mainCtx.drawImage(this.countCanvas, this.mainCanvas.width * 0.1, this.mainCanvas.height * 0.2);
    
    if(this.menuOpenAmount > 0)
    {
        for(var i = 0; i < RS.remoteStations.length; ++i)
        {
            this.drawProfile(cvs, 
                             this.mainCanvas.width - (this.menuOpenAmount * this.mainCanvas.width * 0.33), 
                             this.mainCanvas.height * 0.15 + this.mainCanvas.height * 0.28 * i,
                             RS.remoteStations[i]);
            this.mainCtx.drawImage(this.profileCanvas,
                                   this.mainCanvas.width - (this.menuOpenAmount * this.mainCanvas.width * 0.33), 
                                   this.mainCanvas.height * 0.15 + this.mainCanvas.height * 0.28 * i);
        }
    }

    return this.mainCanvas;
}

UI.prototype.drawTopBar = function(cvs)
{
    this.topBarCtx.save();
    this.topBarCtx.clearRect(0, 0, this.topBarCanvas.width, this.topBarCanvas.height);
    //draw whats there
    this.topBarCtx.drawImage(cvs, 0, 0, this.topBarCanvas.width, this.topBarCanvas.height, 0, 0, this.topBarCanvas.width, this.topBarCanvas.height);

    //blur it
    this.blurCanvas(this.topBarCtx);

    //some white
    this.topBarCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
    this.topBarCtx.fillRect(0, 0, this.topBarCanvas.width, this.topBarCanvas.height);

    ctx.fontSize = Math.floor(this.fontSize * 0.4);
    
    //draw text
    //UI
    this.topBarCtx.fillStyle = "#FFF";
    ctx.fontSize = Math.floor(this.fontSize * 0.4);
    this.topBarCtx.font = ctx.fontSize + "px Futura, sans-serif";
    this.topBarCtx.textAlign = 'left';
    
    
    //score title
    ctx.fontSize = Math.floor(this.fontSize * 0.45);
    this.topBarCtx.fillText("SCORE", this.topBarCanvas.width*0.02, this.topBarCanvas.height * 0.20 + this.fontSize * 0.5);

    //sizing of score numbers
    ctx.fontSize = Math.floor(this.fontSize * 0.85);
    this.topBarCtx.font = ctx.fontSize + "px Futura, sans-serif";

    //score numbers
    this.topBarCtx.fillText("" + this.score, this.topBarCanvas.width*0.02, this.topBarCanvas.height * 0.6 + ctx.fontSize * 0.4);
    
    if(this.inRound)
    {
        //timer
        //sizing of time title
        ctx.fontSize = Math.floor(this.fontSize * 0.45);
        this.topBarCtx.font = ctx.fontSize + "px Futura, sans-serif";
        this.topBarCtx.textAlign = 'center';
        
            this.topBarCtx.fillText("TIME", this.topBarCanvas.width*0.5, this.topBarCanvas.height * 0.20 + this.fontSize * 0.5);
        
        //sizing of time title
        ctx.fontSize = Math.floor(this.fontSize * 0.85);
        this.topBarCtx.font = ctx.fontSize + "px Futura, sans-serif";
        this.topBarCtx.textAlign = 'center';
        
        //timer numbers
        this.topBarCtx.fillText(
            padNumber( Math.floor(this.timeLeft / 60000), 2) + ":" + 
            padNumber( Math.floor((this.timeLeft % 60000) / 1000), 2), 
            this.topBarCanvas.width * 0.5, this.topBarCanvas.height * 0.6 + this.fontSize * 0.4);
    }
    //menu icon
    ctx.fontSize = Math.floor(this.fontSize * 0.7);
    this.topBarCtx.font = ctx.fontSize + "px Futura, sans-serif";
    this.topBarCtx.textAlign = 'right';
    this.topBarCtx.fillText("__", this.topBarCanvas.width * 0.98, this.topBarCanvas.height * 0.3 + this.fontSize * 0.15);
    this.topBarCtx.fillText("__", this.topBarCanvas.width * 0.98, this.topBarCanvas.height * 0.4 + this.fontSize * 0.16);
    this.topBarCtx.fillText("__", this.topBarCanvas.width * 0.98, this.topBarCanvas.height * 0.5 + this.fontSize * 0.17);
    this.topBarCtx.restore();
}

UI.prototype.drawRoundCountdown = function(cvs)
{
    //clear/fill
    this.countCtx.save();
    this.countCtx.clearRect(0, 0, this.countCanvas.width, this.countCanvas.height);
    //draw whats there
    this.countCtx.drawImage(cvs, 
                            this.mainCanvas.width * 0.1, this.mainCanvas.height * 0.2, this.countCanvas.width, this.countCanvas.height, 
                            0, 0, this.countCanvas.width, this.countCanvas.height);

    //blur it
    this.blurCanvas(this.countCtx);
    
    //some white
    this.countCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
    this.countCtx.fillRect(0, 0, this.countCanvas.width, this.countCanvas.height);

    //drawing the Reactive Spaces Logo
    this.countCtx.drawImage(this.image, this.countCanvas.width * 0.5, this.countCanvas.height * 0.1);
    
    //draw countown to next round
    this.countCtx.font = this.fontSize + "px Futura, sans-serif";
    this.countCtx.textAlign = "center";
    this.countCtx.fillStyle = "#FFF";
    this.countCtx.fillText("NEXT ROUND", this.countCanvas.width * 0.5, this.countCanvas.height * 0.3);
    
    //Adding time left
    this.countCtx.font = Math.floor(this.countCanvas.width * 0.5) + "px Futura, sans-serif";
    this.countCtx.fillText(padNumber(Math.ceil(this.lobbyTimeLeft / 1000), 2), this.countCanvas.width * 0.2, this.countCanvas.height * 0.75);
    
    //reactivespacesapi.com and slogan
    this.countCtx.font = this.fontSize * 0.45 + "px Futura, sans-serif";
    this.countCtx.textAlign = "center";
    this.countCtx.fillStyle = "#FFF";
    this.countCtx.fillText("DISTRIBUTED. KINECT. WEB APPS.", this.countCanvas.width * 0.5, this.countCanvas.height * 0.9);
    this.countCtx.fillText("REACTIVESPACESAPI.COM", this.countCanvas.width * 0.5, this.countCanvas.height * 0.95);
    
    this.countCtx.restore();
}

UI.prototype.drawProfile = function(cvs, x, y, profile)
{
    //clear/fill
    this.profileCtx.save();
    this.profileCtx.clearRect(0, 0, this.profileCanvas.width, this.profileCanvas.height);
    //draw whats there
    this.profileCtx.drawImage(cvs, 
                            x, y, this.profileCanvas.width, this.profileCanvas.height, 
                            0, 0, this.profileCanvas.width, this.profileCanvas.height);

    //blur it
    this.blurCanvas(this.profileCtx);
    
    //some white
    this.profileCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
    this.profileCtx.fillRect(0, 0, this.profileCanvas.width, this.profileCanvas.height);
    
    //values
    this.profileCtx.font = this.fontSize + "px sans-serif";
    this.profileCtx.textAlign = "left";
    this.profileCtx.fillStyle = "#FFF";
    
    this.profileCtx.fillText(profile.name, this.profileCanvas.width * 0.1, this.fontSize * 2.3);
    this.profileCtx.fillText(profile.location, this.profileCanvas.width * 0.1, this.fontSize * 3.3);
    this.profileCtx.fillText("Score: " + profile.score, this.profileCanvas.width * 0.1, this.fontSize * 4.9);
    
}

UI.prototype.blurCanvas = function( cntx )
{
    //boxBlurCanvasRGBA(cntx, 0, 0, cntx.canvas.width, cntx.canvas.height, 2, 1);
    
    cntx.globalAlpha = 0.5;
    var pa = 3;
    cntx.drawImage( cntx.canvas, pa, -pa );
    cntx.drawImage( cntx.canvas, -pa, pa );
    cntx.drawImage( cntx.canvas, pa, pa );
    cntx.drawImage( cntx.canvas, -pa, -pa );
}

UI.prototype.openMenu = function( timeout )
{
    if(this.menuTimeout != null)
            clearTimeout(this.menuTimeout);
    if(timeout)
    {
        var self = this;
        this.menuTimeout = setTimeout(function(){self.closeMenu()}, 5000);
    }
    
    TweenLite.to(this, 0.5, {menuOpenAmount: 1, ease:Linear.EaseOut});
}

UI.prototype.closeMenu = function( )
{
    if(this.menuTimeout != null)
            clearTimeout(this.menuTimeout);
    this.menuTimeout = null;
    TweenLite.to(this, 0.5, {menuOpenAmount: 0, ease:Linear.EaseIn});
}

function padNumber( number, padSize )
{
     return Array(Math.max(padSize - String(number).length + 1, 0)).join(0) + number;
}


