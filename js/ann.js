$(document).ready(function() {

    window.jump_to_edit = true;
    window.lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;

    window.toggleMinParent = function(e) {
        e.stopPropagation();
        var t = $(e.target).parent();
        if ($(t).hasClass('minimize-expanded')) {
            $(t).removeClass('minimize-expanded');
        } else {
            $(t).addClass('minimize-expanded');
        }
    }


    var mobilecheck = function() {
        var check = false;
        (function(a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    var docEl = document.documentElement;
    if (docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen) {
        window.annScope.fs_btn = true;
    } else {
        window.annScope.fs_btn = false;
    }
    window.annScope.$apply();

    window.fs_btn_offset = $('.fs-btn-wrapper').outerHeight();
    if (mobilecheck()) {

        var target_img = document.querySelector('#target_image');
        var target_img_loaded = function() {
            if (!!window.jump_to_edit) {
                $(document).scrollTop($('#edit_section').offset().top - target_img.height);
                window.jump_to_edit = false;
            }
        }

        if (target_img.complete && target_img.height) {
            if (target_img.height == 0) {

            }
            target_img_loaded();
        } else {
            target_img.addEventListener('load', target_img_loaded);
            target_img.addEventListener('error', function() {
                //alert('error')
            });
        }

        $(document).on("webkitfullscreenchange mozfullscreenchange fullscreenchange", function(event) {


            var isFullScreen = document.fullScreen ||
                document.mozFullScreen ||
                document.webkitIsFullScreen;

            if (isFullScreen) {
                // window.fs_btn_offset = 32;
                window.fs_btn_offset = $('.fs-btn-wrapper').outerHeight();
                window.annScope.isfullscreen = true;
                window.annScope.$apply();
            } else {
                window.fs_btn_offset = $('.fs-btn-wrapper').outerHeight();
                window.annScope.isfullscreen = false;
                window.annScope.$apply();
            }
        });

        window.toggleFullScreen = window.annScope.toggleFullScreen = function toggleFullScreen() {
            if (!document.fullscreenElement && // alternative standard method
                !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                    console.log('webkit');
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        }
    }

    $(document).scroll(function(e) {

        e.preventDefault();
        e.stopPropagation();

        var st = window.pageYOffset || document.documentElement.scrollTop;
        if (st >= lastScrollTop) {
            var scrollDir = 'down';
        } else {
            var scrollDir = 'up';
        }

        lastScrollTop = st;

        var t = $('.dir_img_tree_wrapper');
        var prev = t.prev();
        var i = $('#target_image');


        if (scrollDir == 'down') {
            window.offset = prev.offset().top + prev.height() + (t.css('display') == 'none' ? 0 : t.height()) + 32 - $('#img_placeholder').height();
        } else {
            window.offset = prev.offset().top + prev.height() + (t.css('display') == 'none' ? 0 : t.height()) + 32;
        }

        if ($(document).scrollTop() >= offset) {
            var holdPosition = 0;
            if (i.css('position') != 'fixed') {
                holdPosition = $(document).scrollTop();
            }
            i.css('position', 'fixed');
            i.css('top', '0px');
            i.css('z-index', '10');
            // $('#img_placeholder').css('height', i.height() + window.fs_btn_offset + 'px');
            $('#img_placeholder').css('height', i.height() + 'px');
            if (holdPosition) {
                $(document).scrollTop(holdPosition);
                holdPosition = 0;
            }
        } else {
            if (i.css('position') == 'fixed') {
                i.css('position', 'relative');
                // i.css('top', '');
                i.css('z-index', '10');
                $('#img_placeholder').css('height', '0px');
            }
        }
        //console.log(scrollDir);
        lastScrollTop = $(document).scrollTop();
        // for scroll debug
        //console.log([$(document).scrollTop(), offset]);

    });

    $(document).keydown(function(e) {
        if (e.key == 'f' || e.key == 'F') {
            if (e.altKey) {
                e.preventDefault();
                $("#force_auto_copy_checkbox").click();
            } else if (e.target.tagName != 'INPUT' || e.target.getAttribute('data-no-text') !== null) {
                $('.flood_fill_burst').click();
            }
        }
        if (e.key == 'a' || e.key == 'A') {
            if (e.altKey) {
                e.preventDefault();
                $("#override_auto_copy_checkbox").click();
            }
        }

        var expandDir = function(idx) {
            $('i.collapsed.dir_' + idx + ':not(.ng-hide)').click();
        }


        if (e.target.tagName != 'INPUT' || e.target.getAttribute('data-no-text') !== null) {

            if (e.key == '+') {
                e.preventDefault();
                $('.add_new_token').click();
                $(".data-value.user-input.data_row_" + (window.annScope.ann.tokens.length - 1) + ".name-vernacular-zhtw").focus();
            } else if (e.key == '?' || e.key == '/') {
                e.preventDefault();
                if (!$('.guide-head').parent().hasClass('minimize-expanded')) {
                    $('.guide-head').click();
                }
                $(".to_search").focus();
            } else if (e.key == ':') {
                e.preventDefault();
                if (!$('.chatroom-head').parent().hasClass('minimize-expanded')) {
                    $('.chatroom-head').click();
                }
                $(".chat_room_msg").focus();
            } else if (e.key == 'd' || e.key == 'D') {
                e.preventDefault();
                $(".data-value:first").focus();
            } else if (e.key == 's' || e.key == 'S') {
                e.preventDefault();
                $("#save-tokens").click();
            }
            /*
            else if (e.key == 'm' || e.key == 'M') {
              e.preventDefault();
              $(".metadata.first").focus();
            }
            //*/
            else if (e.key == 'm' || e.key == 'M') {
                e.preventDefault();
                window.annScope.toggle_magnifier();
            } else if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                window.annScope.cell_row_offset = parseInt(e.key);
            } else if (e.key == 'i' || e.key == 'I') {
                e.preventDefault();
                if (!window.annScope.cell_row_offset) {
                    var cell_row_offset = (window.annScope.ann.tokens.length - 1);
                } else {
                    var cell_row_offset = window.annScope.cell_row_offset - 1;
                    window.annScope.cell_row_offset = null;
                }
                $(".data-value.user-input.data_row_" + cell_row_offset + ".name-vernacular-zhtw").focus();
            } else if (e.key == 'n' || e.key == 'N' || e.key == 'ArrowRight') {
                e.preventDefault();
                if (!e.target.id.match(/^opt_/)) {
                    $(".main_next_image").click();
                    expandDir(annScope.currentDirIdx);
                }
            } else if (e.key == 'p' || e.key == 'P' || e.key == 'ArrowLeft') {
                e.preventDefault();
                if (!e.target.id.match(/^opt_/)) {
                    $(".main_prev_image").click();
                    expandDir(annScope.currentDirIdx);
                }
            } else if (e.key == 'j' || e.key == 'J') {
                e.preventDefault();
                if (!$('.guide-head').parent().hasClass('minimize-expanded')) {
                    $('.guide-head').click();
                }
                $("#input_goto_image_idx").focus();
            }
            //else if (e.keyCode == 119 || e.keyCode == 87 || e.key == 'w' || e.key == 'W') {
            //  $('.ann_console').focus();
            //}
            else if (e.key == 't' || e.key == 'T') {
                $('#target_image').click();
            } else if (e.key == 'q' || e.key == 'Q') {
                $('#goto_start_of_burst').click();
            } else if (e.key == 'w' || e.key == 'W') {
                $('#goto_mid_of_burst').click();
            } else if (e.key == 'e' || e.key == 'E') {
                $('#goto_end_of_burst').click();
            } else if (e.key == 'c' || e.key == 'C') {
                $('#copy_prev').click();
            }
        } // in input tag
        else if (e.target.tagName == 'INPUT') {
            if (e.keyCode == 27) {
                $(e.target).blur();
                if (!$(e.target).val() || e.target.type.toLocaleLowerCase() == 'number') {
                    $(e.target).parents('.minimize').children('.min-head').click();
                }
            } else if (e.key == 'Enter') {
                $('.elm_search:first').click()
                e.stopPropagation();
                e.preventDefault();

            }
        }
    });

    $.event.special.swipe.scrollSupressionThreshold = 20;
    $.event.special.swipe.horizontalDistanceThreshold = 50;
    $.event.special.swipe.verticalDistanceThreshold = 10;
    $(document).delegate(document, 'swipeleft swiperight', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // console.log(e);
        // console.log('大家好，我們是左左/右右');
        window.jump_to_edit = true;
        switch (e.type) {
            case "swipeleft":
                console.log('大家好我是左左');
                $('.main_next_image').click();
                break;
            case "swiperight":
                console.log('大家好我是右右');
                $('.main_prev_image').click();
                break;
        }

    });


});