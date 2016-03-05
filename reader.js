$(window).on('load', function() {
    // global for debugging
    $graph = function(sel) {
        return $(sel, graph.contentDocument);
    };
    var $window = $(window);

    var targetNodeMapping = {};
    lookupNodeElement = function(target) {
        if (targetNodeMapping.hasOwnProperty(target)) {
            return targetNodeMapping[target];
        }
        console.error("invalid target lookup:", target);
        return null;
    }

    nodeInfo = {};
    var isIdentValid = function(ident) {
        return nodeInfo.hasOwnProperty(ident);
    }
    lookupNode = function(ident) {
        if (isIdentValid(ident)) {
            return nodeInfo[ident];
        }
        console.error("invalid id lookup:", ident);
        return null;
    }

    lookupNodeElementById = function(ident) {
        return $graph(".node#" + ident)[0];
    }

    $.get("resources/tbontb.json", function(data) {
        nodeInfo = data;
    });

    var navigateTo = function(page) {
        window.open(page, "reader");
    };

    var currentNode = null;

    var showNode = function(node) {
        node = $graph(node);
        currentNode = node.attr("id");
        window.location.hash = currentNode;
        var where = node.offset();
        var size = node[0].getBBox();
        // BBox does not incorporate svg scaling, so need an extra divide by 2
        // need to use half window width, since right half is covered
        // use height/4 so node is a little higher
        $window.scrollLeft(where.left + size.width/2/2 - $window.width()/2/2);
        $window.scrollTop(where.top + size.height/2/2 - $window.height()/4);
        $graph(".current").removeClass("current");
        node.addClass("current");
    }

    var setupNodes = function() {
        $graph(".node").each(function(_, node) {
            var link = $graph(node).find("a").first();
            var target = link.attr("xlink:href");
            targetNodeMapping[target] = node;
            link.click(function(evt) {
                showNode(node);
                navigateTo(target);
                return false;
            });
        });
    };

    var readerLinkHandler = function(evt) {
        var target = $(this).attr("href");
        // TODO: ugly hard-coded way to resolve the relative link
        showNode(lookupNodeElement("tbontb/" + target));
        return true;
    }

    var addImplicitLink = function() {
        implicit = lookupNode(currentNode).implicit;
        if (implicit != null) {
            nextChapter = lookupNode(implicit).url;
            var choiceDiv = $('<div class="center choice"></div>');
            var link = $('<a href="' + nextChapter + '">&#187; next page... &#171;</a>').appendTo(choiceDiv);
            link.click(readerLinkHandler);
            $("#reader").contents().find("body").append(choiceDiv);
        }
    }

    var setupReader = function() {
        $("#reader").on("load", function() {
            $rdr = $("#reader").contents();
            // snoop on links to keep track of navigation
            $rdr.find("a").each(function(_, link) {
                $(link).click(readerLinkHandler);
            });

            addImplicitLink();
        });
    };

    var setupSvg = function(cb) {
        // Add stylesheet to SVG
        var svg = graph.contentDocument;
        var link = svg.createElementNS("http://www.w3.org/1999/xhtml", "link");
        link.setAttribute("href", "../svg.css");
        link.setAttribute("rel", "stylesheet");
        svg.rootElement.appendChild(link);
        link.onload = function() {
            cb();
        };

        // Scale graph
        var xforms = svg.getElementById("viewport").transform.baseVal;
        for (var i = 0; i < xforms.length; i++) {
            var xform = xforms[i];
            if (xform.type == SVGTransform.SVG_TRANSFORM_SCALE) {
                xform.setScale(0.5, 0.5);
            }
        }
    };

    var hashNodeIdent = function() {
        var nodeName = window.location.hash.substring(1);
        if (isIdentValid(nodeName)) {
            return nodeName;
        }
        return null;
    }

    // terribly confusing function
    var showAndNavigateTo = function(ident) {
        showNode(lookupNodeElementById(ident));
        navigateTo("resources/tbontb/" + lookupNode(ident).url);
    }

    setupSvg(function() {
        setupNodes();
        setupReader();
        setTimeout(function() {
            var nodeName = hashNodeIdent();
            if (nodeName) {
                showAndNavigateTo(nodeName);
            } else {
                showNode("#start");
            }
            addImplicitLink();
        }, 0);
    });

    $(window).on('hashchange', function() {
        var nodeName = hashNodeIdent();
        if (nodeName) {
            showAndNavigateTo(nodeName);
        }
    });

});
