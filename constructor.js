function log (message) {
	document.getElementById('output').innerText += message + "\n";
	console.info(message);
}
function init () {
	document.getElementById('run-example').addEventListener(
		'click', function (evt) {
			example();
			return false;
		}, true
	);
}

function example () {
	var Parent = function (food, drink, home) {
		this.food = food;
		this.drink = drink;
		this._home = home;
	};

	Parent.prototype.getDinner = function () {
		// log(this);
		return "Eat " + this.food +
			", drink " + this.drink +
			" in " + this.getHome();
	};

	Parent.prototype.getHome = function () { return this._home; };

	var Child = function (food, drink, tv, home) {
		this.tv = tv;
		this.constructor(food, drink, home);
	};
	Child.prototype = new Parent();

	Child.prototype.getDinner = function () {
		return "Eat " + this.food +
			", drink " + this.drink +
			", watch " + this.tv +
			" in " + this.getHome();
	};

	var p = new Parent("caviar", "whiskey", "family home");
	var c = new Child("pizza", "pop", "the A-Team", "family home");
	log("parent: " + JSON.stringify(p.getDinner()));
	log("child: " + JSON.stringify(c.getDinner()));
}
window.onload = init;
