var graph = new Graph();

var a = graph.newNode({label: 'a'});
var b = graph.newNode({label: 'b'});
var c = graph.newNode({label: 'c'});
var d = graph.newNode({label: 'd'});
var e = graph.newNode({label: 'e'});
var f = graph.newNode({label: 'f'});

graph.newEdge(a, b);
graph.newEdge(a, c);
graph.newEdge(b, d);
graph.newEdge(c, d);
graph.newEdge(d, e);
graph.newEdge(e, f);
// graph.newEdge(a, f);

$(function () {
	$('canvas').springyFlow({
		graph: graph,
		layout: Layout.Flowchart,
		text: {
			backgroundColor: "white",
			fontSize: 20,

		}
	});
});