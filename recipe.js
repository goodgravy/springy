(function () {
	var recipe = {
		findStartNodes: function (graph) {
			var potentialStarts = graph.nodes.slice(0);
			for (var i=0; i<graph.edges.length; i++) {
				var destinationIndex = potentialStarts.indexOf(graph.edges[i].target);
				if (destinationIndex > -1) {
					potentialStarts.splice(destinationIndex, 1);
				}
			}
			return potentialStarts;
		},
		parentsOf: function (node) {
			// TODO dedupe if there are >1 edge between nodes
			var result = [];
			for (var i=0; i<graph.edges.length; i++) {
				if (graph.edges[i].target === node) {
					result.push(graph.edges[i].source);
				}
			}
			return result;
		},
		hasOneChild: function (graph, node) {
			function sizeOf (obj) {
				var size = 0, key;
			    for (key in obj) {
			        if (obj.hasOwnProperty(key)) size++;
			    }
			    return size;
			}
			return 1 === sizeOf(graph.adjacency[node.id]);
		},
		recurseDistances: function (startNode) {
			// todo handle cycles
			for (var targetId in graph.adjacency[startNode.id]) {
				var target = graph.nodeSet[targetId];
				if ('distance' in target.data) {
					target.data.distance = Math.max(target.data.distance, startNode.data.distance + 1);
				} else {
					target.data.distance = startNode.data.distance + 1;
				}
				this.recurseDistances(target);
			}
		},
		findForDistance: function (distance) {
			return graph.nodes.filter(function (node) {
				return node.data.distance === distance;
			});
		},
		setInitialPositions: function (graph) {
			var startNodes = this.findStartNodes(graph);
			if (startNodes.length !== 1) {
				throw "Recipe graphs must have exactly one start node";
			}
			var startNode = startNodes[0];
			startNode.data.distance = 0;
			startNode.data.isStart = true;
			this.recurseDistances(startNode);

			var maxDistance = 0;
			for (var i=0; i<graph.nodes.length; i++) {
				graph.nodes[i].data.label += " (" + graph.nodes[i].data.distance + ")";
				if (graph.nodes[i].data.distance > maxDistance) {
					maxDistance = graph.nodes[i].data.distance;
				}
			}

			var step = 10.0 / maxDistance;
			// TODO avoid two passes
			for (var i=0; i<graph.nodes.length; i++) {
				graph.nodes[i].data.initialPosition = new Vector(0, -5 + step * graph.nodes[i].data.distance);
			}

			function threeSF (number) {
				return Math.round(number * 1000) / 1000;
			}

			for (var distance=0; distance<=maxDistance; distance++) {
				var nodes = this.findForDistance(distance),
					xStep = 10.0 / (nodes.length + 1);
				for (var idx=0; idx<nodes.length; idx++) {
					nodes[idx].data.initialPosition.x = -5 + xStep * (idx + 1);
					// nodes[idx].data.label += "(" + threeSF(nodes[idx].data.initialPosition.x) + ", " + threeSF(nodes[idx].data.initialPosition.y) + ")";
				}
			}

			for (var i=0; i<graph.nodes.length; i++) {
				var parents = this.parentsOf(graph.nodes[i]);
				if (parents.length === 1 && this.hasOneChild(graph, parents[0])) {
					console.log(graph.nodes[i].data.label + " has one parent - setting to " + parents[0].data.initialPosition.x);
					graph.nodes[i].data.initialPosition.x = parents[0].data.initialPosition.x;
				}
			}
		}
	}
	window.recipe = recipe;
})();

/*
// If I want to not rely on springy...

var Graph = function() {
	this.nodeSet = {};
	this.nodes = [];
	this.edges = [];
	this.adjacency = {};

	this.nextNodeId = 0;
	this.nextEdgeId = 0;
};

var Node = function(id, data) {
	this.id = id;
	this.data = (data !== undefined) ? data : {};
};

var Edge = function(id, source, target, data) {
	this.id = id;
	this.source = source;
	this.target = target;
	this.data = (data !== undefined) ? data : {};
};

Graph.prototype.addNode = function(node) {
	if (!(node.id in this.nodeSet)) {
		this.nodes.push(node);
	}

	this.nodeSet[node.id] = node;
	return node;
};

Graph.prototype.addEdge = function(edge) {
	var exists = false;
	this.edges.forEach(function(e) {
		if (edge.id === e.id) { exists = true; }
	});

	if (!exists) {
		this.edges.push(edge);
	}

	if (!(edge.source.id in this.adjacency)) {
		this.adjacency[edge.source.id] = {};
	}
	if (!(edge.target.id in this.adjacency[edge.source.id])) {
		this.adjacency[edge.source.id][edge.target.id] = [];
	}

	exists = false;
	this.adjacency[edge.source.id][edge.target.id].forEach(function(e) {
			if (edge.id === e.id) { exists = true; }
	});

	if (!exists) {
		this.adjacency[edge.source.id][edge.target.id].push(edge);
	}

	return edge;
};

Graph.prototype.newNode = function(data) {
	var node = new Node(this.nextNodeId++, data);
	this.addNode(node);
	return node;
};

Graph.prototype.newEdge = function(source, target, data) {
	var edge = new Edge(this.nextEdgeId++, source, target, data);
	this.addEdge(edge);
	return edge;
};

// Array.forEach implementation for IE support..
//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
if ( !Array.prototype.forEach ) {
  Array.prototype.forEach = function( callback, thisArg ) {
	var T, k;
	if ( this == null ) {
	  throw new TypeError( " this is null or not defined" );
	}
	var O = Object(this);
	var len = O.length >>> 0; // Hack to convert O.length to a UInt32
	if ( {}.toString.call(callback) != "[object Function]" ) {
	  throw new TypeError( callback + " is not a function" );
	}
	if ( thisArg ) {
	  T = thisArg;
	}
	k = 0;
	while( k < len ) {
	  var kValue;
	  if ( k in O ) {
		kValue = O[ k ];
		callback.call( T, kValue, k, O );
	  }
	  k++;
	}
  };
}

*/