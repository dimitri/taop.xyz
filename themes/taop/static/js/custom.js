$(function() {


    // Data background cover
            $('*[data-cover]').each(function(){
                var coverTarget = $(this).attr('data-cover');
                var coverimage = $(this).find(coverTarget).attr('src');
                $(this).css('background-image','url('+ coverimage +')');
            });




    // Data slide
            $('*[data-slide]').on('click', function(){
                var slideTarget = $(this).attr('data-slide');
                $('html, body').animate({
                    scrollTop: $(slideTarget).offset().top
                }, 1000);
                return false;
            });




    // Welcome slider
            $(window).on('resize load', function () {
                if ($(window).width() < 768) {
                    $('.welcome_slider > ul').bxSlider({
                        mode: 'fade',
                        auto: true,
                        stopAutoOnClick: true
                    });
                } else {
                    $('.welcome_slider > ul').bxSlider({
                        mode: 'fade',
                        auto: true,
                        stopAutoOnClick: true,
                        touchEnabled: false
                    });
                }
            });




    // Popup
            $('.team_list > li figure figcaption > a').on('click', function(){
                $(this).parent().parent().addClass('active');
                return false;
            })
            $('.team_list > li .popup .close').on('click', function(){
                $(this).parent().parent().removeClass('active');
            })




    // Quote slider
            $('.quote_slider .wrapper > ul').bxSlider({
                mode: 'fade',
                pager: false
            });
            
            // Book social proof quote carousel
            if ($('.book_social_proof .quote_slider').length) {
                var $slider = $('.book_social_proof .quote_slider');
                var $quotes = $slider.find('ul li');
                var $dots = $slider.find('.quote-dots');
                var currentQuote = 0;
                var quoteCount = $quotes.length;
                var autoInterval;
                
                // Create dots
                for (var i = 0; i < quoteCount; i++) {
                    $dots.append('<span class="quote-dot" data-index="' + i + '"></span>');
                }
                var $dotElements = $slider.find('.quote-dot');
                
                function showQuote(index) {
                    $quotes.removeClass('active');
                    $dotElements.removeClass('active');
                    $quotes.eq(index).addClass('active');
                    $dotElements.eq(index).addClass('active');
                    currentQuote = index;
                }
                
                // Next/Prev click handlers
                $slider.find('.quote-prev').on('click', function() {
                    var prev = (currentQuote - 1 + quoteCount) % quoteCount;
                    showQuote(prev);
                    resetAuto();
                });
                
                $slider.find('.quote-next').on('click', function() {
                    var next = (currentQuote + 1) % quoteCount;
                    showQuote(next);
                    resetAuto();
                });
                
                // Dot click handlers
                $slider.find('.quote-dot').on('click', function() {
                    var index = $(this).data('index');
                    showQuote(index);
                    resetAuto();
                });
                
                function resetAuto() {
                    clearInterval(autoInterval);
                    autoInterval = setInterval(function() {
                        var next = (currentQuote + 1) % quoteCount;
                        showQuote(next);
                    }, 5000);
                }
                
                showQuote(0);
                autoInterval = setInterval(function() {
                    var next = (currentQuote + 1) % quoteCount;
                    showQuote(next);
                }, 5000);
            }




    // FAQ
            $(".faq_block dl dt").on('click', function(){
                $(this).toggleClass('active').next('dd').slideToggle();
            });

            
            
            
    // SQL list
            $(".sql_list > ul > li").hover(function(){
                $(this).addClass('active');
            },function() {
                $(this).removeClass('active');
            });
            $(".sql_list > ul > li").on('click', function(){
                $(".sql_list > ul > li").removeClass('active');
                $(this).addClass('active');
            });

            
            
            
    // Blog top list
            $(".top_blogs ul li").hover(function(){
                $(this).addClass('active');
            },function() {
                $(this).removeClass('active');
            });
            $(".top_blogs ul li").on('click', function(){
                $(".top_blogs ul li").removeClass('active');
                $(this).addClass('active');
            });

            
            
            
    // Show/hide input value
            $('input[type="text"], input[type="password"], input[type="email"]').each(function(){
                var valtxt = $(this).attr('value');
                $(this).focus(function() { if ($(this).val() == valtxt) {$(this).val('');} });
                $(this).blur(function() { if ($(this).val() == '') {$(this).val(valtxt);} });
            });
            $("textarea").focus(function() {if (this.value === this.defaultValue) {this.value = '';}}).blur(function() {if (this.value === '') {this.value = this.defaultValue;}});


});
