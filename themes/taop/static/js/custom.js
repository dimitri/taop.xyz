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
            var coloredSlides = [
                'TheArtOfPostgresCourses.png',
                'TheArtOfPostgresLab.png',
                'TheArtOfPostgresUniversity.png',
                'TheArtOfPostgresWorkshop.png'
            ];
            var headerBgColor = '#67527a';

            function updateSlideStyle($slide) {
                var imgSrc = $slide.find('img.cover').attr('src') || '';
                var isColored = coloredSlides.some(function(slide) {
                    return imgSrc.indexOf(slide) !== -1;
                });
                if (isColored) {
                    $('body .header').css('background', headerBgColor);
                    $('body.index .welcome_slider ul li').css('padding-top', '80px');
                } else {
                    $('body .header').css('background', 'transparent');
                    $('body.index .welcome_slider ul li').css('padding-top', '0');
                }
            }

            $(window).on('resize load', function () {
                var sliderConfig = {
                    mode: 'fade',
                    auto: true,
                    stopAutoOnClick: true,
                    touchEnabled: false,
                    onSliderLoad: function(currentIndex) {
                        updateSlideStyle($('.welcome_slider > ul > li').eq(currentIndex));
                    },
                    onSlideAfter: function($slide, oldIndex, newIndex) {
                        updateSlideStyle($slide);
                    }
                };
                if ($(window).width() < 768) {
                    sliderConfig.touchEnabled = true;
                }
                $('.welcome_slider > ul').bxSlider(sliderConfig);
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
