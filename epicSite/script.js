$(document).ready(function() {
    // initialize values
    var drag_list = $(".draglist"),
        table = $(".table"),
        isIOS = ((/iphone|ipad/gi).test(navigator.appVersion)),
        unselectable = "-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;";   

    $("body").attr("style", unselectable);

    if (isIOS) 
    {
        $("strong").html('This is <span style="color: cyan">Xiao Shi (Dean)</span>. If you want to know who I am, <span style="color: #0af">touch any one</span> of the items from the arraylist to the drop box below!');

        drag_list.bind('touchstart', function(ev) {
            var id_name = "#" + $(this).attr("id") + "Table";

            if ($(id_name).css("display") != "none") {return;}

            drag_list.removeAttr("style");
            $(this).attr("style", "background-color: #0f9");

            table.hide();
            $(id_name).show();
        });
    }
    else
    {
        // initialize
        var dropzone = $("#dropzone"),
            hr = $("hr"),
            top_button = $("#top-button"),
            left_offset = hr.position().left + hr.outerWidth(),
            isTop = true,
            transition = "transition: all 0.5s ease;-moz-transition: all 0.5s ease;-webkit-transition: all 0.5s ease;-o-transition: all 0.5s ease;";

        // the left offset will be changed when the browser is resized
        $(window).resize(function() {
            left_offset = hr.position().left + hr.outerWidth();

            top_button.css({
                left: left_offset + 10 + "px"
            });
        }) 

        .scroll(function () { 
            var height = $(document).scrollTop();

            if (height >= 90 && isTop)
            {
                isTop = false;
                top_button.css({left: left_offset + 10 + "px", display: "block", opacity: "0.5"});
            }
            else if (height < 90 && !isTop)
            {
                isTop = true;
                top_button.removeAttr("style");
            }
        });

        // function to show table when users double click any one of the list or drag one 
        // to the drop zone
        function show_table (table_id)
        {
            var id_name = "#" + table_id + "Table";
            $("html, body").animate({ scrollTop: $("hr").offset().top }, 1000, "easeInOutCubic");
            
            // do nothing if the table does have "hidden"
            if ($(id_name).css("display") != "none") {return;}
            table.slideUp("slow", "easeOutQuint");
            $(id_name).slideDown("slow", "easeOutQuint");
        }

        // Set the element as draggable.
        dropzone.attr('draggable', 'false');
        
        // color transition when mouse over
        $("span a, table a").hover(function(){
            $(this).stop().animate({color: "#f06"}, 500, "swing");
        },function(){
            $(this).stop().animate({color: "#35f"}, 500, "swing");
        });

        // the opacity will be changed when mouse is over the button
        top_button.hover(function(){
            if (!isTop)
                $(this).stop().animate({opacity: "1"}, 300, "swing");
        },function(){
            if (!isTop)
                $(this).stop().animate({opacity: "0.5"}, 300, "swing");
        })

        // the page will be scrolled to top when user clicks the button
        .click(function(){
            $('html, body').animate({scrollTop:0}, 'slow', 'easeOutCirc');
            return;
        });

        drag_list

        // add css style when mouse over any one of the lists and remove css when mouse out
        .hover(function(){
            clearTimeout($(this).data('list'));
            $(this).stop().attr("style", "background-color: #0f9;color:#eee;box-shadow: 0 0 20px rgba(255,255,255,.6), inset 0 0 20px rgba(255,255,255,1);" + transition);
        },function(){
            var element = this;
            $(this).stop().attr("style", transition)

            // Set data as list to storage the timeout action
            .data('list', setTimeout(function() {
                $(element).removeAttr("style");
            }, 500));
        })

        // Double click to show table
        .dblclick(function(){
            show_table(this.id);
        })

        // Set the element as draggable.
        .attr('draggable', 'true')

        // Handle the start of dragging to initialize.
        .bind('dragstart', function(ev) {
            var dt = ev.originalEvent.dataTransfer;
            dt.setData('text', this.id);
            return;
        });

        $('#container')

        // Decide whether the thing dragged in is welcome.
        .bind('dragover', function(ev) {
            ev.preventDefault();
            clearTimeout($(this).data('blur'));
            $(this).stop().attr("style", "border-color: #0c0;color:#f30;" + transition);
            dropzone.attr("style", "box-shadow: 0 0 128px #08c;" + transition);
            return;
        })

        // Handle the final drop...
        .bind('drop', function(ev) {
            ev.preventDefault();
            dropzone.attr("style", transition);
            $(this).attr("style", transition)

            // Set data as blur to storage the timeout action
            .data('blur', setTimeout(function() {
                dropzone.removeAttr("style");
                $(this).removeAttr("style");
            }, 500));

            var dt = ev.originalEvent.dataTransfer;
            show_table (dt.getData("text"));
            return;
        })

        // Un-highlight on drag leaving drop zone.
        .bind('dragleave', function(ev) {
            ev.preventDefault();
            dropzone.attr("style", transition);
            $(this).attr("style", transition)
            
            // Set data as blur to storage the timeout action
            .data('blur', setTimeout(function() {
                dropzone.removeAttr("style");
                $(this).removeAttr("style");
            }, 500));

            return;
        });

        $('#professor-feedback').fancybox();
    }
}); 
