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

Vector.prototype.normalize = function( len )
{
    len = (typeof(len) == 'undefined') ? this.length() : len;
    this.x /= len;
    this.y /= len;
}

Vector.prototype.length = function( value )
{
    return Math.sqrt( this.lengthSqd() );
}

Vector.prototype.lengthSqd = function( value )
{
    return this.x * this.x + this.y * this.y;
}

Vector.prototype.limit = function( max )
{
    var len = this.length();
    if(len > max)
    {
        this.normalize( len );
        this.multScalar( max );
    }
}