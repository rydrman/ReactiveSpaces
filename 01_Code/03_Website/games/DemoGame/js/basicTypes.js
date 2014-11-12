var Vector = function (x, y){
    
    this.x = (typeof(x) == 'undefined') ? 0 : x;
    this.y = (typeof(y) == 'undefined') ? 0 : y; 
}

Vector.prototype.set = function( pos )
{
    this.x = pos.x;
    this.y = pos.y;
}

Vector.prototype.add = function( vector )
{
    if( !(vector instanceof Vector)) return; 
    this.x += vector.x;
    this.y += vector.y;
}

Vector.prototype.multScalar = function( value )
{
    this.x *= value;
    this.y += value;
}

Vector.prototype.getMultScalar = function( value )
{
    return new Vector(this.x * value, this.y * value);
}