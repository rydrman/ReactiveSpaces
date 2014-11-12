$( document ).ready(function() {


$(".linkNav").click(function(event) {
		event.preventDefault();
		var link = "#"+$(this).attr("href");
		//alert(link);
		$('html,body').delay(100).animate({scrollTop: $(link).offset().top}, 1500);
 		
	});
	});