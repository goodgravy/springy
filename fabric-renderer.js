/*
A Fabric.js-based renderer for Springy.js
http://fabricjs.com/
http://getspringy.com/
*/

(function () {

jQuery.fn.springyFlow = function (params) {
	var that = this;
	var graph = this.graph = params.graph || new Graph();
	var layout = params.layout || Layout.Flowchart;
	var stiffness = params.stiffness || 400.0;
	var repulsion = params.repulsion || 400.0;
	var damping = params.damping || 0.5;
	var textParams = params.text || {};

	var canvas = new fabric.Canvas(this[0]);
	var layout = this.layout = new layout(graph, stiffness, repulsion, damping);

	function toScreen (p) {
		var res = {
			x: (p.x + 5) / GRAPH_SIZE * (that[0].width * 0.9) + that[0].width * 0.05,
			y: (p.y + 5) / GRAPH_SIZE * (that[0].height * 0.9) + that[0].height * 0.05
		};
		return res;
	}

	var renderer = new Renderer(layout,
		function clear() {
			canvas.dispose();
		},
		function drawEdge(edge, p1, p2) {
			var screenP1 = toScreen(p1),
				screenP2 = toScreen(p2);
			var point1 = new fabric.Point(screenP1.x, screenP1.y);
			var point2 = new fabric.Point(screenP2.x, screenP2.y);
			var line = new fabric.Line([screenP1.x, screenP1.y, screenP2.x, screenP2.y]);
			canvas.add(line);

			var deltaX = p2.x - p1.x,
				deltaY = p1.y - p2.y, // deltaY is backwards because it increases downwards
				lineAngleRad = Math.asin(deltaX / Math.sqrt(deltaX*deltaX + deltaY*deltaY)),
				lineAngleDeg = lineAngleRad * 180 / Math.PI;

			var tri = new fabric.Triangle({
				left: line.getCenterPoint().x,
				top: line.getCenterPoint().y,
				fill: "black",
				height: that[0].width / 40,
				width: that[0].height / 40,
				angle: (180 - lineAngleDeg) % 360
			});
			window.myTri = tri;
			window.canvas = canvas;
			canvas.add(tri);
		},
		function drawNode(node, p) {
			var screenP = toScreen(p),
				params = $.extend({}, textParams, {
					left: screenP.x,
					top: screenP.y,
					textAlign: "center"
				});
				text = new fabric.Text(node.data.label, params);
			canvas.add(text);
		}
	);
	renderer.start();
}
})();