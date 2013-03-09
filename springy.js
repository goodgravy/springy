/**
 * Springy v1.1.0
 *
 * Copyright (c) 2010 Dennis Hotson
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

var GRAPH_SIZE = 10.0;

var Graph = function() {
	this.nodeSet = {};
	this.nodes = [];
	this.edges = [];
	this.adjacency = {};

	this.nextNodeId = 0;
	this.nextEdgeId = 0;
	this.eventListeners = [];
};

var Node = function(id, data) {
	this.id = id;
	this.data = (data !== undefined) ? data : {};

// Data fields used by ForceDirected layout algorithm in this file:
//   	this.data.mass 
// Data fields automatically populated by FlowChart algorithm:
// 		this.data.distance
// Data used by default renderer in springyui.js
//   	this.data.label
};

var Edge = function(id, source, target, data) {
	this.id = id;
		/** @type {Node} */
	this.source = source;
	this.target = target;
	this.data = (data !== undefined) ? data : {};

// Edge data field used by layout alorithm
//   	this.data.length
//   	this.data.type
};

Graph.prototype.addNode = function(node) {
	if (!(node.id in this.nodeSet)) {
		this.nodes.push(node);
	}

	this.nodeSet[node.id] = node;

	this.notify();
	return node;
};

Graph.prototype.addNodes = function() {
		// accepts variable number of arguments, where each argument
		// is a string that becomes both node identifier and label
		for (var i = 0; i < arguments.length; i++) {
				var name = arguments[i];
				var node = new Node(name, data = {label:name});
				this.addNode(node);
		}
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

	this.notify();
	return edge;
};

Graph.prototype.addEdges = function() {
		// accepts variable number of arguments, where each argument
		// is a triple [nodeid1, nodeid2, attributes]
		for (var i = 0; i < arguments.length; i++) {
				var e = arguments[i];
				var node1 = this.nodeSet[e[0]];
				if (node1 == undefined) {
						throw new TypeError("invalid node name: " + e[0]);
				}
				var node2 = this.nodeSet[e[1]];
				if (node2 == undefined) {
						throw new TypeError("invalid node name: " + e[1]);
				}
				var attr = e[2];

				this.newEdge(node1, node2, attr);
		}
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

// find the edges from node1 to node2
Graph.prototype.getEdges = function(node1, node2) {
	if (node1.id in this.adjacency
		&& node2.id in this.adjacency[node1.id]) {
		return this.adjacency[node1.id][node2.id];
	}

	return [];
};

// return a subset of nodes which satisfy a condition
Graph.prototype.getNodesWhere = function (where) {
	return this.nodes.filter(where);
};

// return array of nodes which have edges to this target node
Graph.prototype.parentsOf = function (node) {
	var result = [];
	this.edges.forEach(function (edge) {
		if (edge.target === node && result.indexOf(edge.source) < 0) {
			result.push(edge.source);
		}
	});
	return result;
};

// return list of nodes which only have outgoing edges
Graph.prototype.getStartNodes = function () {
	var that = this;
	return this.getNodesWhere(function (node) {
		return that.parentsOf(node).length === 0;
	});
};

// remove a node and it's associated edges from the graph
Graph.prototype.removeNode = function(node) {
	if (node.id in this.nodeSet) {
		delete this.nodeSet[node.id];
	}

	for (var i = this.nodes.length - 1; i >= 0; i--) {
		if (this.nodes[i].id === node.id) {
			this.nodes.splice(i, 1);
		}
	}

	this.detachNode(node);

};

// removes edges associated with a given node
Graph.prototype.detachNode = function(node) {
	var tmpEdges = this.edges.slice();
	tmpEdges.forEach(function(e) {
		if (e.source.id === node.id || e.target.id === node.id) {
			this.removeEdge(e);
		}
	}, this);

	this.notify();
};

// remove a node and it's associated edges from the graph
Graph.prototype.removeEdge = function(edge) {
	for (var i = this.edges.length - 1; i >= 0; i--) {
		if (this.edges[i].id === edge.id) {
			this.edges.splice(i, 1);
		}
	}

	for (var x in this.adjacency) {
		for (var y in this.adjacency[x]) {
			var edges = this.adjacency[x][y];

			for (var j=edges.length - 1; j>=0; j--) {
				if (this.adjacency[x][y][j].id === edge.id) {
					this.adjacency[x][y].splice(j, 1);
				}
			}
		}
	}

	this.notify();
};

/* Merge a list of nodes and edges into the current graph. eg.
var o = {
	nodes: [
		{id: 123, data: {type: 'user', userid: 123, displayname: 'aaa'}},
		{id: 234, data: {type: 'user', userid: 234, displayname: 'bbb'}}
	],
	edges: [
		{from: 0, to: 1, type: 'submitted_design', directed: true, data: {weight: }}
	]
}
*/
Graph.prototype.merge = function(data) {
	var nodes = [];
	data.nodes.forEach(function(n) {
		nodes.push(this.addNode(new Node(n.id, n.data)));
	}, this);

	data.edges.forEach(function(e) {
		var from = nodes[e.from];
		var to = nodes[e.to];

		var id = (e.directed)
			? (id = e.type + "-" + from.id + "-" + to.id)
			: (from.id < to.id) // normalise id for non-directed edges
				? e.type + "-" + from.id + "-" + to.id
				: e.type + "-" + to.id + "-" + from.id;

		var edge = this.addEdge(new Edge(id, from, to, e.data));
		edge.data.type = e.type;
	}, this);
};

Graph.prototype.filterNodes = function(fn) {
	var tmpNodes = this.nodes.slice();
	tmpNodes.forEach(function(n) {
		if (!fn(n)) {
			this.removeNode(n);
		}
	}, this);
};

Graph.prototype.filterEdges = function(fn) {
	var tmpEdges = this.edges.slice();
	tmpEdges.forEach(function(e) {
		if (!fn(e)) {
			this.removeEdge(e);
		}
	}, this);
};


Graph.prototype.addGraphListener = function(obj) {
	this.eventListeners.push(obj);
};

Graph.prototype.notify = function() {
	this.eventListeners.forEach(function(obj){
		obj.graphChanged();
	});
};

// -----------
var Layout = {};
Layout.ForceDirected = function(graph, stiffness, repulsion, damping) {
	this.graph = graph;
	this.stiffness = stiffness; // spring stiffness constant
	this.repulsion = repulsion; // repulsion constant
	this.damping = damping; // velocity damping factor

	this.nodePoints = {}; // keep track of points associated with nodes
	this.edgeSprings = {}; // keep track of springs associated with edges
};

Layout.ForceDirected.prototype.point = function(node) {
	if (!(node.id in this.nodePoints)) {
		var mass = (node.data.mass !== undefined) ? node.data.mass : 1.0;
		var initialPositionVector = ("initialPosition" in node.data) ?
			new Vector(node.data.initialPosition.x, node.data.initialPosition.y) :
			Vector.random();
		this.nodePoints[node.id] = new Layout.ForceDirected.Point(initialPositionVector, mass);
	}

	return this.nodePoints[node.id];
};

Layout.ForceDirected.prototype.spring = function(edge) {
	if (!(edge.id in this.edgeSprings)) {
		var length = (edge.data.length !== undefined) ? edge.data.length : 1.0;

		var existingSpring = false;

		var from = this.graph.getEdges(edge.source, edge.target);
		from.forEach(function(e) {
			if (existingSpring === false && e.id in this.edgeSprings) {
				existingSpring = this.edgeSprings[e.id];
			}
		}, this);

		if (existingSpring !== false) {
			return new Layout.ForceDirected.Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0);
		}

		var to = this.graph.getEdges(edge.target, edge.source);
		from.forEach(function(e){
			if (existingSpring === false && e.id in this.edgeSprings) {
				existingSpring = this.edgeSprings[e.id];
			}
		}, this);

		if (existingSpring !== false) {
			return new Layout.ForceDirected.Spring(existingSpring.point2, existingSpring.point1, 0.0, 0.0);
		}

		this.edgeSprings[edge.id] = new Layout.ForceDirected.Spring(
			this.point(edge.source), this.point(edge.target), length, this.stiffness
		);
	}

	return this.edgeSprings[edge.id];
};

// callback should accept two arguments: Node, Point
Layout.ForceDirected.prototype.eachNode = function(callback) {
	var t = this;
	this.graph.nodes.forEach(function(n){
		callback.call(t, n, t.point(n));
	});
};

// callback should accept two arguments: Edge, Spring
Layout.ForceDirected.prototype.eachEdge = function(callback) {
	var t = this;
	this.graph.edges.forEach(function(e){
		callback.call(t, e, t.spring(e));
	});
};

// callback should accept one argument: Spring
Layout.ForceDirected.prototype.eachSpring = function(callback) {
	var t = this;
	this.graph.edges.forEach(function(e){
		callback.call(t, t.spring(e));
	});
};


// Physics stuff
Layout.ForceDirected.prototype.applyCoulombsLaw = function() {
	this.eachNode(function(n1, point1) {
		this.eachNode(function(n2, point2) {
			if (point1 !== point2)
			{
				var d = point1.p.subtract(point2.p);
				var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
				var direction = d.normalise();

				// apply force to each end point
				point1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
				point2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
			}
		});
	});
};

Layout.ForceDirected.prototype.applyHookesLaw = function() {
	this.eachSpring(function(spring){
		var d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
		var displacement = spring.length - d.magnitude();
		var direction = d.normalise();

		// apply force to each end point
		spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
		spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
	});
};

Layout.ForceDirected.prototype.attractToCentre = function() {
	this.eachNode(function(node, point) {
		var direction = point.p.multiply(-1.0);
		point.applyForce(direction.multiply(this.repulsion / 50.0));
	});
};


Layout.ForceDirected.prototype.updateVelocity = function(timestep) {
	this.eachNode(function(node, point) {
		// Is this, along with updatePosition below, the only places that your
		// integration code exist?
		point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
		point.a = new Vector(0,0);
	});
};

Layout.ForceDirected.prototype.updatePosition = function(timestep) {
	this.eachNode(function(node, point) {
		// Same question as above; along with updateVelocity, is this all of
		// your integration code?
		point.p = point.p.add(point.v.multiply(timestep));
	});
};

// Calculate the total kinetic energy of the system
Layout.ForceDirected.prototype.totalEnergy = function(timestep) {
	var energy = 0.0;
	this.eachNode(function(node, point) {
		var speed = point.v.magnitude();
		energy += 0.5 * point.m * speed * speed;
	});

	return energy;
};

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }; // stolen from coffeescript, thanks jashkenas! ;-)

Layout.requestAnimationFrame = __bind(window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback, element) {
		window.setTimeout(callback, 10);
	}, window);


// start simulation
Layout.ForceDirected.prototype.start = function(render, done) {
	var t = this;

	if (this._started) return;
	this._started = true;

	Layout.requestAnimationFrame(function step() {
		t.applyCoulombsLaw();
		t.applyHookesLaw();
		t.attractToCentre();
		t.updateVelocity(0.03);
		t.updatePosition(0.03);

		if (render !== undefined) {
			render();
		}

		// stop simulation when an energy condition is met
		if (t.shouldStop(t.totalEnergy())) {
			t._started = false;
			if (done !== undefined) { done(); }
		} else {
			Layout.requestAnimationFrame(step);
		}
	});
};

Layout.ForceDirected.prototype.shouldStop = function (energy) {
	return energy < 0.01;
};

// Find the nearest point to a particular position
Layout.ForceDirected.prototype.nearest = function(pos) {
	var min = {node: null, point: null, distance: null};
	var t = this;
	this.graph.nodes.forEach(function(n){
		var point = t.point(n);
		var distance = point.p.subtract(pos).magnitude();

		if (min.distance === null || distance < min.distance) {
			min = {node: n, point: point, distance: distance};
		}
	});

	return min;
};

// returns [bottomleft, topright]
Layout.ForceDirected.prototype.getBoundingBox = function() {
	var bottomleft = new Vector(-2,-2);
	var topright = new Vector(2,2);

	this.eachNode(function(n, point) {
		if (point.p.x < bottomleft.x) {
			bottomleft.x = point.p.x;
		}
		if (point.p.y < bottomleft.y) {
			bottomleft.y = point.p.y;
		}
		if (point.p.x > topright.x) {
			topright.x = point.p.x;
		}
		if (point.p.y > topright.y) {
			topright.y = point.p.y;
		}
	});

	var padding = topright.subtract(bottomleft).multiply(0.07); // ~5% padding

	return {bottomleft: bottomleft.subtract(padding), topright: topright.add(padding)};
};


// Vector
Vector = function(x, y) {
	this.x = x;
	this.y = y;
};

Vector.random = function() {
	return new Vector(GRAPH_SIZE * (Math.random() - 0.5), GRAPH_SIZE * (Math.random() - 0.5));
};

Vector.prototype.add = function(v2) {
	return new Vector(this.x + v2.x, this.y + v2.y);
};

Vector.prototype.subtract = function(v2) {
	return new Vector(this.x - v2.x, this.y - v2.y);
};

Vector.prototype.multiply = function(n) {
	return new Vector(this.x * n, this.y * n);
};

Vector.prototype.divide = function(n) {
	return new Vector((this.x / n) || 0, (this.y / n) || 0); // Avoid divide by zero errors..
};

Vector.prototype.magnitude = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y);
};

Vector.prototype.normal = function() {
	return new Vector(-this.y, this.x);
};

Vector.prototype.normalise = function() {
	return this.divide(this.magnitude());
};

// Point
Layout.ForceDirected.Point = function(position, mass) {
	this.p = position; // position
	this.m = mass; // mass
	this.v = new Vector(0, 0); // velocity
	this.a = new Vector(0, 0); // acceleration
};

Layout.ForceDirected.Point.prototype.applyForce = function(force) {
	this.a = this.a.add(force.divide(this.m));
};

// Spring
Layout.ForceDirected.Spring = function(point1, point2, length, k) {
	this.point1 = point1;
	this.point2 = point2;
	this.length = length; // spring length at rest
	this.k = k; // spring constant (See Hooke's law) .. how stiff the spring is
};

// Layout.ForceDirected.Spring.prototype.distanceToPoint = function(point)
// {
// 	// hardcore vector arithmetic.. ohh yeah!
// 	// .. see http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment/865080#865080
// 	var n = this.point2.p.subtract(this.point1.p).normalise().normal();
// 	var ac = point.p.subtract(this.point1.p);
// 	return Math.abs(ac.x * n.x + ac.y * n.y);
// };

// ----------
// Alternative layout, something like a flowchart

Layout.Flowchart = function (graph, stiffness, repulsion, damping) {
	this.constructor(graph, stiffness, repulsion, damping);
	this.lastEnergy = 0;
	this.setInitialPositions();
};

Layout.Flowchart.prototype = new Layout.ForceDirected;

Layout.Flowchart.prototype.updatePosition = function (timestep) {
	var that = this;
	var startNodes = that.graph.getStartNodes();
	that.eachNode(function (node, point) {
		// don't move the start node
		if (startNodes.indexOf(node) < 0) {
			var movement = point.v.multiply(timestep),
				nextPoint;
			movement.x = 0; // don't move side-to-side
			nextPoint = point.p.add(movement);

			// children must be below parents
			that.graph.parentsOf(node).forEach(function (parent) {
				if (nextPoint.y - that.point(parent).p.y >= that.yStep / 2) {
					point.p = nextPoint;
				}
			});
		}
	});
};

Layout.Flowchart.prototype.shouldStop = function (energy) {
	var that = this;
	if (Math.abs(that.lastEnergy - energy) < 0.1) {
		return true;
	} else {
		that.lastEnergy = energy;
		return false;
	}
};

Layout.Flowchart.prototype.setInitialPositions = function () {
	var that = this;
	// ------ helpers for setInitialPositions ------ //

	// set data.distance on all the nodes
	// data.distance is the shortest path length from the start node
	function recurseDistances (startNode) {
		startNode.data._visited = true;

		for (var targetId in that.graph.adjacency[startNode.id]) {
			var target = that.graph.nodeSet[targetId];
			if ('distance' in target.data) {
				target.data.distance = Math.max(target.data.distance, startNode.data.distance + 1);
			} else {
				target.data.distance = startNode.data.distance + 1;
			}
			if (!target.data._visited) {
				recurseDistances(target);
			}
		}
	};

	function hasOneChild (node) {
		function sizeOf (obj) {
			var size = 0, key;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) size++;
			}
			return size;
		}
		return 1 === sizeOf(that.graph.adjacency[node.id]);
	}

	// ------ end helpers for setInitialPositions ------ //

	var startNodes = that.graph.getStartNodes(),
		startNode,
		maxDistance = 0,
		yStep;
	if (startNodes.length !== 1) {
		throw "Flowcharts must have exactly one start node";
	}
	startNode = startNodes[0];
	startNode.data.distance = 0;
	recurseDistances(startNode);
	that.graph.nodes.forEach(function (node) {
		maxDistance = Math.max(node.data.distance, maxDistance);
	});
	yStep = GRAPH_SIZE / maxDistance;
	that.yStep = yStep; // needed in other layout code

	// nodes are initially evenly spaced down the graph by distance (Y)
	that.graph.nodes.forEach(function (node) {
		node.data.initialPosition = new Vector(0, (-GRAPH_SIZE / 2) + (yStep * node.data.distance));
	});

	// nodes are initially evenly spaced across the graph (X)
	// we group nodes together in strata, by distance
	for (var distance = 0; distance <= maxDistance; distance++) {
		var nodes = that.graph.getNodesWhere(function (node) {
				return node.data.distance === distance;
			}),
			xStep = GRAPH_SIZE / (nodes.length + 1);

		nodes.forEach(function (node, idx) {
			// we prefer straight lines down graph if possible:
			// for single-parent, only-child nodes: align horizontally with parent
			var parents = that.graph.parentsOf(node);
			if (parents.length === 1 && hasOneChild(parents[0])) {
				node.data.initialPosition.x = parents[0].data.initialPosition.x;
			} else {
				node.data.initialPosition.x = (-GRAPH_SIZE / 2) + (xStep * (idx + 1));
			}
		});
	}

	that.graph.nodes.forEach(function (node) {
		console.info('set initial: '+JSON.stringify(node.data));
	});
}

// Renderer handles the layout rendering loop
function Renderer(layout, clear, drawEdge, drawNode) {
	this.layout = layout;
	this.clear = clear;
	this.drawEdge = drawEdge;
	this.drawNode = drawNode;

	this.layout.graph.addGraphListener(this);
}

Renderer.prototype.graphChanged = function(e) {
	this.start();
};

Renderer.prototype.start = function() {
	var t = this;
	this.layout.start(function render() {
		t.clear();

		t.layout.eachEdge(function(edge, spring) {
			t.drawEdge(edge, spring.point1.p, spring.point2.p);
		});

		t.layout.eachNode(function(node, point) {
			t.drawNode(node, point.p);
		});
	});
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
