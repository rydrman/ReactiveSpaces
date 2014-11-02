//TODO error logging on server 
//TODO integrate with engine/renderer
/*

MESSANGER

the messenger class is used by the engine to display custom error, warning, and messages

this file also defines the warning, error, messaging types used in our engine/game

create a new error in your script by writing:

throw new Message.Error( params );

or a warning by writing

throw new Message.Warning( params );

or a message by writing

throw new Message.Message( params );

the engine will catch these errors and display them

you can also catch the errors yourself and deal with them if necessary by using
try/catch statements

*/

var Messenger = function()
{
    this.messageStack = [];
    this.currentMessage = null;
    this.currentTimeout = null;
    
    this.browser = (typeof(ENVIRO) != 'undefined')                ? ENVIRO.browser :
                   (typeof(chrome) != 'undefined')                ? 'chrome' :
                   (typeof(document.documentMode) != 'undefined') ? 'ie' :
                   (typeof(InstallTrigger) != 'undefined')        ? 'firefox' :
                   'other';
    
    //create new div and css to display stuff
    this.displayDiv = document.createElement("div");
    var style = this.displayDiv.style;
    style.position = 'fixed';
    style.width = '100%';
    style.maxWidth = "90%";
    style.padding = "15px";
    style.backgroundColor = "rgba(0, 0, 0, 0)";
    style.top = "-" + this.displayDiv.clientHeight + 'px';
    style.left = '5%';
    style.transition = "top 0.5s";
    
    this.messageDiv = document.createElement('div');
    var style = this.messageDiv.style;
    style.width = "80%";
    style.fontFamily = "ui-font, sans-serif";
    style.fontSize = "20px"
    style.fontStyle = 'bold';
    
    this.solutionDiv = document.createElement('div');
    var style = this.solutionDiv.style;
    style.width = "80%";
    style.fontFamily = "ui-font, sans-serif";
    style.fontSize = "18px"
    style.fontStyle = 'italic';
    style.color = "#222";
    
    this.displayDiv.appendChild(this.messageDiv);
    this.displayDiv.appendChild(this.solutionDiv);
    
    var body = document.getElementsByTagName('body')[0];
    if(typeof(body) == 'undefined')
        throw new Error("Messenger cannot be created until after the page loads");
    document.getElementsByTagName('body')[0].appendChild(this.displayDiv);
}

//this function displays a new Message.Error, Message.Warning, Message.Message
//it should be used for global events and errors that should be displayed to 
//the user but not break the code.
//type: enumerator from Message.Types
//message: main message text
//solution: secondary message text
//timeMS: time to display
Messenger.prototype.display = function(type, message, solution, timeMS)
{
    
    var msg = new Message(type, message, solution, timeMS);
    
    if(typeof(url) != 'undefined')
    {
        url = url.split("/");
        url = url[url.length];
    }

    //it's our own error, display it our way
    return this.process(msg);

}

//this function proceses an incoming message
//to be called only by Messenger.display
Messenger.prototype.process = function(msg)
{
    switch(msg.type)
    {
        case Message.type.ERROR:
            console.log("ERROR " + msg.message);
            if(typeof(msg.solution) != 'undefined')
                console.log("SOLUTION: " + msg.solution);
            this.messageStack.push(msg);
            if(this.currentMessage == null)
                this.displayNextMessage();
            //debugger;
            break;
        case Message.type.WARNING:
            console.log("WARNING " + msg.message);
            if(typeof(msg.solution) != 'undefined')
                console.log("SOLUTION: " + msg.solution);
            this.messageStack.push(msg);
            if(this.currentMessage == null)
                this.displayNextMessage();
            break;
        case Message.type.MESSAGE:
            console.log("MESSAGE: " + msg.message);
            this.messageStack.push(msg);
            if(this.currentMessage == null)
                this.displayNextMessage();
            break;
        default:
            return false;
    }
    return true;
}

Messenger.prototype.displayNextMessage = function()
{
    
    if(this.messageStack.length)
    {
        var msg = this.messageStack[0];
        switch(msg.type)
        {
            case Message.type.ERROR:
                this.displayDiv.style.backgroundColor = "#db0c0c";
                break;
            case Message.type.WARNING:
                this.displayDiv.style.backgroundColor = "#eabf0d";
                break;
            case Message.type.MESSAGE:
                this.displayDiv.style.backgroundColor = "#00d8ff";
                break;
            default:
                throw new Error("unknown error type...");
        }
        //set html
        this.messageDiv.innerHTML = msg.message;
        this.solutionDiv.innerHTML = msg.solution;
        
        //animate
        this.displayDiv.style.transition = "none";
        this.displayDiv.style.top = "-" + this.displayDiv.clientHeight + 'px';
        this.displayDiv.offsetHeight;
        this.displayDiv.style.transition = "top 0.5s";
        this.displayDiv.style.top = '0px';
        
        //clear timeout
        if(this.currentTimeout != null)
            window.clearTimeout(this.currentTimeout);
        
        //create timeout
        var self = this;
        this.currentTimeout = setTimeout(function(){self.displayNextMessage.call(self)}, msg.time);
        
        //remove from stack
        this.messageStack.splice(0, 1);
        this.currentMessage = msg;
    }
    else
    {
        //move the div out of the way
        this.displayDiv.style.top = "-" + this.displayDiv.clientHeight + 'px';
        this.currentMessage = null;
        this.currentTimeout = null;
    }
}

/////////////////////////////////////
//  Message definitions and types  //
/////////////////////////////////////

var Message = function( type, message, solution, timeMS  )
{
    this.type = type;
    this.message = message;
    this.solution = solution || "";
    this.time = timeMS || 4000;
}
Message.type = {
    "MESSAGE" : 0,
    "WARNING" : 1,
    "ERROR" : 2
};