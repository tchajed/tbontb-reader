window.onload = function() {
    // global for debugging
    $graph = function(sel) {
        return $(sel, graph.contentDocument);
    };
    var $window = $(window);

    var targetNodeMapping = {};
    lookupNode = function(target) {
        return targetNodeMapping[target];
    }

    var navigateTo = function(page) {
        window.open(page, "reader");
    };

    var showNode = function(node) {
        node = $graph(node);
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

    var setupReader = function() {
        $("#reader").on("load", function() {
            $rdr = $("#reader").contents();
            // snoop on links to keep track of navigation
            $rdr.find("a").each(function(_, link) {
                var target = $(link).attr("href");
                $(link).click(function(evt) {
                    // TODO: ugly hard-coded way to resolve the relative link
                    showNode(lookupNode("tbontb/" + target));
                    return true;
                });
            });
        });
    };

    var setupSvg = function(cb) {
        // Add stylesheet to SVG
        var svg = graph.contentDocument;
        var link = svg.createElementNS("http://www.w3.org/1999/xhtml", "link");
        link.setAttribute("href", "../reader/svg.css");
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

    setupSvg(function() {
        setupNodes();
        setupReader();
        setTimeout(function() {
            showNode("#start");
        }, 0);
    });
}
