var Parent = function (food, drink) {
	this.food = food;
	this.drink = drink;
};

Parent.prototype.getDinner = function () {
	return [this.food, this.drink];
};

var Child = function (food, drink, tv) {
	this.tv = tv;
	this.constructor(food, drink);
};
Child.prototype = new Parent;

Child.prototype.getDinner = function () {
	console.info(this.prototype.getDinner());
	return [this.food, this.drink, this.tv];
};

var p = new Parent("caviar", "whiskey");
var c = new Child("pizza", "pop", "A-Team");
console.info(p.getDinner());
console.info(c.getDinner());