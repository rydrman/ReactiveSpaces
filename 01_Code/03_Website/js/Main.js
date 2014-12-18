// JavaScript Document

$( document ).ready(function() {
 		
	$(".perc").css("margin-top",function () {
		var height = $(window).height() * 0.25;
		return height;
	});
	
	$( window ).scroll(function() {
  		var splashHeight = $("#splash").height();

  		if ( $(window).scrollTop()> splashHeight){
  			$("#topnav").css("position","fixed");
  			$("#topnav").css("margin-top","0px");
  			$("#topnav").css("padding-top","20px");
  			$("#topnav").css("background-color","rgba(255,255,255,0.95)");
  			$("#topnav a").addClass("black");
			$("#lightBack").removeClass("hide");
			$("#darkBack").addClass("hide");
			$(".navBoxButton").css("border","2px solid #000");
			
			

  		}else{
  			$("#topnav").css("position","static");
  			$("#topnav").css("margin-top","30px");
  			$("#topnav").css("padding-top","0px");
  			$("#topnav").css("background-color","rgba(255,255,255,0.0)");
  			$("#topnav a").removeClass("black");
			$(".navBoxButton").css("border","2px solid #E7E8E8");
			$("#darkBack").removeClass("hide");
			$("#lightBack").addClass("hide");
  			
  		}
	});
	
	
	
	
});

$( window ).resize(function() {
 
	
	$(".perc").css("margin-top",function () {
		var height = $(window).height() * 0.25;
		return height;
	});
	
	
});

window.onload = function () {
	$(".mover").click(function(event) {
		event.preventDefault();
		var link = "#"+$(this).attr("href");
		//alert(link);
		$('html,body').delay(100).animate({scrollTop: $(link).offset().top}, 1500);
 		
	});

}

var target_date = new Date("Dec 8, 2014 09:00:00").getTime();
var days, hours, minutes;
var countdown = document.getElementById("downloadIcon");
	
setInterval(function(){
		var current_date = new Date().getTime();
		var seconds_left = (target_date - current_date) / 1000;
		
		days_left = parseInt(seconds_left / 86400);
   		seconds_left = seconds_left % 86400;
		
		hours_left = parseInt(seconds_left / 3600);
    	seconds_left = seconds_left % 3600;
		minutes_left = parseInt(seconds_left / 60);
		seconds_left = parseInt(seconds_left % 60);
		
		$("#downloadIcon").html(days_left+"d " + hours_left+"hr " + minutes_left+"m " + seconds_left+"s");
}, 500);