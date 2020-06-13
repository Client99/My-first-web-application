$(document).ready(function() {
    $('#gallery').gallery();
});


var _body = document.body || document.documentElement,
    _style = _body.style,
    _transition,
    _transform;



$.fn.gallery = function(method) {

    function rebuildOverlay(target, imageLinks) {
        var $this = $(target),
            options = $this.data('gallery')['options'],
            $overlay = $('<div class="gallery-overlay"/>'),
            $imageBox = $('<div class="gallery-imagebox" />'),
            $image = $('<img class="gallery-image"/>'),
            $imageLoading = $('<div class="gallery-loading"></>'),
            $captionBox = $('<div class="gallery-captionbox"><div class="gallery-control gallery-control-previous">&laquo;</div><div class="gallery-text"><div class="gallery-title"/><div class="gallery-index"/></div><div class="gallery-control gallery-control-next">&raquo;</div></div>'),
            $thumbList = $('<ul></ul>'),
            $thumbBox = $('<div class="gallery-thumbbox"/>'),
            $thumbItem,
            $imageLink;

        $.each(imageLinks, function(index, imageLink) {

            $imageLink = $(imageLink);
            $thumbItem = $(imageLink).find('img');

            // creates listbox thumbs
            $thumbItem = $('<li></li>')
                .append(
                    $('<a />').prop({
                        href: $imageLink.prop('href')
                    })

                    .append(
                        $('<img/>').prop({
                            src: $thumbItem.prop('src'),
                            title: $thumbItem.prop('title'),
                            id: $thumbItem.prop('id')
                        })
                    )

                )
                .append(
                    $('<div><div/>').prop({
                        id: $thumbItem.prop('title'),
                        title: $thumbItem.prop('title')
                    }).text($thumbItem.prop('title'))
                );

            $thumbList.append($thumbItem);
        });

        $overlay.append($imageBox.append($image).append($imageLoading))
            .append($captionBox)
            .append($thumbBox.append($thumbList));


        $overlay.on('click.gallery', function(event) {
            $this.gallery('close');
        });

        $overlay.on('click.gallery', '.gallery-control-previous', function(event) {
            $this.gallery('previous');
            return false;
        });

        $overlay.on('click.gallery', '.gallery-control-next', function(event) {
            $this.gallery('next');
            return false;
        });


        var scrollHover = 0;

        $thumbBox.mousemove(function(event) {


        }).mouseleave(function(event) {
            scrollStop($thumbList);
            scrollHover = -1;
        });


        $overlay.find('.gallery-thumbbox li').on('click.gallery', function(event) {
            var imageLink = $(this).find('a:first')[0];
            $this.gallery('open', imageLink);
            event.preventDefault();
            event.stopPropagation();

        }).hover(function() {
            $(this).addClass('gallery-thumbbox-hover');
        }, function() {
            $(this).removeClass('gallery-thumbbox-hover');
        });


        // remove any old overlays
        $this.find('.gallery-overlay').remove();
        $this.append($overlay.hide());

        return $overlay;



    }

    function matrixToArray(matrix) {
        var marray = matrix.substr(7, matrix.length - 8).split(',');
        return marray;
    }




    function displayLoadedImage(targets) {

        // unwrap if target is event
        // if (targets instanceof $.Event) {
        targets = targets['data'];
        // }

        var preloadImage = targets['preloadImage'],
            $image = targets['$image'],
            $imageBox = $image.closest('.gallery-imagebox');
        $imageLoading = targets['$imageLoading'],
            maxWidth = $imageBox.width() - $image.outerWidth() + $image.width(),
            maxHeight = $imageBox.height() - $image.outerHeight() + $image.height(),
            height = 0,
            width = 0;

        if (preloadImage != $image.data('preloadImage'))
            return;

        // adjust width and height according to determined maxWidth
        width = preloadImage.width > maxWidth ? maxWidth : preloadImage.width;
        height = preloadImage.height * width / preloadImage.width;

        // if height still too big, use maxHeight scale width & height
        if (height > maxHeight) {
            height = maxHeight;
            width = preloadImage.width * height / preloadImage.height;
        }

        // load the target image
        $image.prop({
            src: preloadImage.src,
            title: preloadImage.title
        }).css({
            width: width,
            height: height
        }).removeClass('loading');

        $imageLoading.hide();
    }

    // public methods
    var methods = {

        init: function(options) {

            var defaults = {
                thumbboxTriggerWidth: 0.10,
                thumbboxSpeed: 0.5,
                imageEvent: 'click',
                elem: 'a',
                wrapAround: true
            };

            var options = $.extend(defaults, options);

            return this.each(function() {

                var $this = $(this),
                    plugindata = $this.data('gallery');

                // if plugin has not been initialized on element
                if (!plugindata) {

                    $this.data('gallery', {
                        options: options,
                        target: $this,
                    });

                    // load image data
                    $this.gallery('load', options['elem']);

                    // set to the first image
                    $this.gallery('setImage', 1);
                }

            });

        },


        setImage: function(imageLink) {
            return this.each(function() {

                var $this = $(this),
                    options = $this.data('gallery')['options'],
                    $overlay = $this.find('.gallery-overlay'),
                    $thumbBox = $this.find('.gallery-thumbbox'),
                    $captionBox = $this.find('.gallery-captionbox'),
                    $thumbList = $thumbBox.find('ul:first'),
                    linkType = $.type(imageLink),
                    $imageLink,
                    $image,
                    preloadImage,
                    $imageLoading;

                // if image is a number, we consider it the index of the target thumb
                if (linkType == 'number') {
                    imageLink = $thumbList.find('li a')[imageLink - 1];
                } else if (linkType == 'string') {
                    imageLink = $('<a/>').prop('href', imageLink)[0];
                }

                // we assume it is a link otherwise
                $imageLink = $(imageLink);
                $image = $overlay.find('.gallery-image');
                $imageLoading = $overlay.find('.gallery-loading');

                $image.addClass('loading');

                // construct new image element to work-around onLoad issues with various browsers
                preloadImage = new Image();
                var targetData = {
                    'preloadImage': preloadImage,
                    '$image': $image,
                    '$imageLoading': $imageLoading
                };

                // when image has loaded, call displayLoadedImage to update real image to preloadImage
                $(preloadImage).on('load.gallery', targetData, displayLoadedImage);
                $image.data('preloadImage', preloadImage);
                preloadImage.src = $imageLink.prop('href');


                // give the image 250ms to load before showing imageLoading (lowers flicker chance of imageLoading)
                setTimeout(function() {
                    // image still has not loaded, so we show imageLoading
                    if (!preloadImage.complete) {
                        $imageLoading.show();

                        // hide image loading if target already loaded while showing imageLoading
                        if (preloadImage.complete) {
                            displayLoadedImage(targetData);
                        }
                    }
                }, 250);

                // attempt to find link in thumbnails
                var $thumbLink = $thumbBox.find(imageLink),
                    $targetThumb;


                // could not find same link element, so we search by href
                if ($thumbLink.length == 0) {
                    var imageLinkHref = $imageLink.prop('href');
                    $thumbBox.find('a').each(function(index, elem) {
                        if ($(elem).prop('href') == imageLinkHref) {
                            $thumbLink = $(elem);
                            return false;
                        }
                    });
                }

                $targetThumb = $thumbLink.closest('li');

                // remove selected from old thumb
                $thumbBox.find('.gallery-thumbbox-selected').removeClass('gallery-thumbbox-selected');

                // add selected to new thumb
                $targetThumb.addClass('gallery-thumbbox-selected');

                var $thumbs = $thumbBox.find('li'),
                    thumbPosition = $thumbs.index($targetThumb) + 1,
                    thumbTotal = $thumbs.length;

                // SET CAPTION
                // $captionBox.find(".gallery-title").text($targetThumb.find('img').prop('title'));

                $captionBox.find(".gallery-title").text($targetThumb.find('img').prop('title'));
                // $captionBox.find(".gallery-title").text(imageLink);

                // $captionBox.find(".gallery-index").text(thumbPosition + ' of ' + thumbTotal);
                // STORY
                $captionBox.find(".gallery-index").text($targetThumb.find('img').prop('id'));

                var thumbpos = $targetThumb.position().left + $targetThumb.outerWidth(true) / 2,
                    winwidth = $(window).width();

                if ($targetThumb.offset().left < 0 || thumbpos > winwidth) {
                    // calculate new left edge of thumblist
                    var newLeft = -(winwidth / 2 - thumbpos);

                    // if edge is beyond normal scrolling bounds, bring it to within bounds
                    newLeft = Math.max(0, newLeft);
                    newLeft = Math.min($thumbList.outerWidth() - winwidth, newLeft);

                    // clear queue of effects (otherwise backlog happens when user advances quickly)
                    $thumbList.clearQueue();

                    // animate scroll to the position
                    scrollAnimate($thumbList, -newLeft, { 'duration': 1000 });
                }


            });
        },

        isOpen: function() {
            var $this = $(this[0]),
                $overlay = $this.find('.gallery-overlay');

            return $overlay.is(':visible');
        },

        open: function(imageLink) {
            return this.each(function() {
                var $this = $(this),
                    options = $this.data('gallery')['options'],
                    $overlay = $this.find('.gallery-overlay'),
                    $imageBox = $this.find('.gallery-imagebox'),
                    $captionBox = $this.find('.gallery-captionbox'),
                    $thumbBox = $this.find('.gallery-thumbbox');

                if ($overlay.is(':hidden')) {
                    $(document).on('keyup.gallery', function(e) {
                        if (e.keyCode == 13 || e.keyCode == 27) {
                            $this.gallery('close');
                        } else if (e.keyCode == 37) {
                            $this.gallery('previous');
                        } else if (e.keyCode == 39) {
                            $this.gallery('next');
                        }
                    });

                    // remove scrollbar from window
                    $('body').css({ overflow: 'hidden' });

                    // resize imagebox to fill void not filled by captionBox and thumbBox
                    $imageBox.css({ height: $overlay.height() - $captionBox.outerHeight() - $thumbBox.outerHeight() - parseInt($imageBox.css('margin-bottom'), 10) - parseInt($imageBox.css('margin-top'), 10) });

                }

                $overlay.fadeIn(1700, function() {
                    if (imageLink) {
                        $this.gallery('setImage', imageLink);
                    }
                });
            });
        },

        close: function() {
            return this.each(function() {
                $(this).find('.gallery-overlay').hide();
                $(document).off('keyup.gallery');

                // restore window scrollbar, etc
                $("body").css({ overflow: 'inherit' });
            });
        },

        next: function() {
            return this.each(function() {
                var $this = $(this),
                    options = $this.data('gallery')['options'],
                    $thumbBox = $this.find('.gallery-thumbbox');

                var $selectedItem = $thumbBox.find('.gallery-thumbbox-selected'),
                    // set next thumb
                    $nextItem = $selectedItem.next();

                // if last thumb is reached, set next thumb as first one
                if ($nextItem.length == 0) {
                    if (!options['wrapAround']) {
                        return;
                    }
                    $nextItem = $thumbBox.find('li:first');
                }

                $this.gallery('setImage', $nextItem.find('a'));
            });
        },

        previous: function() {
            return this.each(function() {
                var $this = $(this),
                    options = $this.data('gallery')['options'],
                    $thumbBox = $this.find('.gallery-thumbbox');

                // set selected by finding 
                var $selectedItem = $thumbBox.find('.gallery-thumbbox-selected'),
                    // set prev thumb    
                    $prevItem = $selectedItem.prev();
                // if first thumb is reached, set previous thumb as last one
                if ($prevItem.length == 0) {
                    if (!options['wrapAround']) {
                        return;
                    }
                    $prevItem = $thumbBox.find('li:last');
                }

                $this.gallery('setImage', $prevItem.find('a'));
            });

        },


        load: function(elem) {
            return this.each(function() {
                var $this = $(this),
                    options = $this.data('gallery')['options'];
                if (elem === undefined) {
                    elem = options['elem'];
                }

                rebuildOverlay(this, $this.find(elem).toArray());

                $(document).on(options['imageEvent'] + '.gallery', elem, function(e) {
                    $this.gallery('open', this);
                    e.stopPropagation();
                    e.preventDefault();

                });

            });

        }

    };



    if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
        return methods.init.apply(this, arguments);
    };


};


// $('#debug').text("debug")