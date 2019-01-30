// Initialize game and start it
var newGame = new game();

function init() {
    if(newGame.init()){
        newGame.start();
    }
}

// Define keycodes for movement
KEY_CODES = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
}

// Create array to hole KEY_CODES
KEY_STATUS = {};
for (code in KEY_CODES) {
    KEY_STATUS[ KEY_CODES[ code ] ] = false;
}

// Check when a key is being pressed
document.onkeydown = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = true; // That button was pressed
    }
}

// Release key
document.onkeyup = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = false; // That button was released
    }
}

// Define object for images to be loaded
var images = new function() {
    // Define images
    this.background = new Image();
    this.spaceship = new Image();
    this.bullet = new Image();
    this.enemy = new Image();
    this.enemyBullet = new Image();

    // Ensure all of the images have loaded before doing anything else
    var numImages = 5;
    var numLoaded = 0;

    // If you wanted a progress bar, this is where you could do it
    function imageLoaded() {
        numLoaded++;
        if (numLoaded === numImages) {
            window.init();
        }
    }
    this.background.onload = function() {
        imageLoaded();
    }
    this.spaceship.onload = function() {
        imageLoaded();
    }
    this.bullet.onload = function() {
        imageLoaded();
    }
    this.enemy.onload = function() {
        imageLoaded();
    }
    this.enemyBullet.onload = function() {
        imageLoaded();
    }

    // Set image source
    this.background.src = "images/bg.png";
    this.spaceship.src = "images/ship.png";
    this.bullet.src = "images/bullet.png";
    this.enemy.src = "images/enemy.png";
    this.enemyBullet.src = "images/bullet_enemy.png";
}

// Create drawable object
function drawable() {
    this.init = function(x, y, width, height) {
        // Default variables
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    this.collidableWith = "";
    this.isColliding = false;
    this.type = "";

    // Define abstract function to be used in child objects
    this.draw = function() {};
    this.isCollidableWith = function(object) {
        return (this.collidableWith === object.type);
    }
}

// Create background
function background() {
    this.speed = 1;

    this.draw = function() {
        this.y += this.speed;
        this.context.drawImage(images.background, this.x, this.y);

        this.context.drawImage(images.background, this.x, this.y - this.canvasHeight);

        // If this image scorlled off the screen, reset
        if (this.y >= this.canvasHeight){
            this.y = 0;
        }
    };
}
// Set background to be a child of drawable
background.prototype = new drawable();

// Quad Tree for reducing collision checks, separates screen into smaller screens
function quadTree(boundBox, lvl){
    var maxObjects = 10;
    this.bounds = boundBox || {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
    var objects = [];
    this.nodes = [];
    var levels = lvl || 0;
    var maxLevels = 5;

    // Clear all nodes of objects
    this.clear = function() {
        objects = [];
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }
        this.nodes = [];
    };

    // Get all objects in the quad tree
    this.getAllObjects = function(returnedObjects) {
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].getAllObjects(returnedObjects);
        }
        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }
        return returnedObjects;
    }

    // Get all objects in the quad tree
    this.findObjects = function(returnedObjects, obj) {
        if (typeof obj === "undefined") {
            console.log("UNDEFINED OBJECT");
            return;
        }
        var index = this.getIndex(obj);
        if (index != -1 && this.nodes.length) {
            this.nodes[index].findObjects(returnedObjects, obj);
        }
        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }
        return returnedObjects;
    };

    // Insert the object into yhe quad tree.
      // If the objects exceed the maxObjects, we create a new sub quad tree
    this.insert = function(obj) {
        if (typeof obj === "undefined") {
            return;
        }
        if (obj instanceof Array) {
            for (var i = 0, len = obj.length; i < len; i++) {
                this.insert(obj[i]);
            }
            return;
        }
        if (this.nodes.length) {
            var index = this.getIndex(obj);
            // Only add object to a subnode if it can fit completely within it
            if (index != -1) {
                this.nodes[index].insert(obj);
                return;
            }
        }
        objects.push(obj);
        // Prevent infinite splitting
        if (objects.length > maxObjects && levels < maxLevels) {
            if (this.nodes[0] == null) {
                this.split();
            }
            var i = 0;
            while (i < objects.length) {
                var index = this.getIndex(objects[i]);
                if (index != -1) {
                    this.nodes[index].insert((objects.splice(i, 1))[0]);
                }
                else {
                    i++;
                }
            }
        }
    };

    // Determine which node the object belongs to.
    this.getIndex = function(obj) {
        var index = -1;
        var verticalMidpoint = this.bounds.x+ this.bounds.width / 2;
        var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
        // Object can fit completely within the top quadrant
        var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
        // Object can fit completely within the bottom quadrant
        var bottomQuadrant = (obj.y > horizontalMidpoint);
        // Object can fit completely within the left quadrant
        if (obj.x < verticalMidpoint && obj.x + obj.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            }
            else if (bottomQuadrant) {
                index = 2;
            }
        }
        // Object can fit completely within the right quadrant
        else if (obj.x > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            }
            else if (bottomQuadrant) {
                index = 3;
            }
        }
        return index;
    };

    // Splits the nodes into te 4 subnodes
    this.split = function() {
        var subWidth = (this.bounds.width / 2) || 0;
        var subHeight = (this.bounds.height / 2) || 0;

        this.nodes[0] = new quadTree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y,
            width: subWidth,
            height: subHeight
        }, levels+1);
        this.nodes[1] = new quadTree({
            x: this.bounds.x,
            y: this.bounds.y,
            width: subWidth,
            height: subHeight
        }, levels+1);
        this.nodes[2] = new quadTree({
            x: this.bounds.x,
            y: this.bounds.y + subHeight,
            width: subWidth,
            height: subHeight
        }, levels+1);
        this.nodes[3] = new quadTree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y + subHeight,
            width: subWidth,
            height: subHeight
        }, levels+1);
    };
}

// Detect collisions between objects within the same subnode
function detectCollision() {
    var objects = [];
    newGame.quadTree.getAllObjects(objects);

    for (var x = 0, len = objects.length; x < len; x++) {
        newGame.quadTree.findObjects(obj = [], objects[x]);

        for (var y = 0, length = obj.length; y < length; y++) {
            // Detect collision algorithm
            if (objects[x].collidableWith === obj[y].type &&
                (objects[x].x < obj[y].x + obj[y].width &&
                objects[x].x + objects[x].width > obj[y].x &&
                objects[x].y < obj[y].y + obj[y].height &&
                objects[x].y + objects[x].height > obj[y].y)) {
                    objects[x].isColliding = true;
                    obj[y].isColliding = true;
                }
        }
    }
}

// Create the game
function game() {
    this.init = function() {
        // FInd canvases
        this.bgCanvas = document.getElementById('background');
        this.shipCanvas = document.getElementById('ship');
        this.mainCanvas = document.getElementById('main');

        if (this.bgCanvas.getContext) {
            this.bgContext = this.bgCanvas.getContext('2d');
            this.shipContext = this.shipCanvas.getContext('2d');
            this.mainContext = this.mainCanvas.getContext('2d');

            // Initialize objects to contain their context and canvas information
              // Background
			background.prototype.context = this.bgContext;
			background.prototype.canvasWidth = this.bgCanvas.width;
            background.prototype.canvasHeight = this.bgCanvas.height;
              // Ship
            ship.prototype.context = this.shipContext;
            ship.prototype.canvasWidth = this.shipCanvas.width;
            ship.prototype.canvasHeight = this.shipCanvas.height;
              // Bullet
            bullet.prototype.context = this.mainContext;
            bullet.prototype.canvasWidth = this.mainCanvas.width;
            bullet.prototype.canvasHeight = this.mainCanvas.height;
              // Enemy
            enemy.prototype.context = this.mainContext;
            enemy.prototype.canvasWidth = this.mainCanvas.width;
            enemy.prototype.canvasHeight = this.mainCanvas.height;

			// Initialize the background object
			this.newBackground = new background();
            this.newBackground.init(0,0); // Set draw point to 0,0

            // Intialize the ship
            this.newShip = new ship();
            // Set starting position for the ship
            var shipStartX = this.shipCanvas.width/2 - images.spaceship.width;
            var shipStartY = this.shipCanvas.height/4*3 + images.spaceship.height*2;
            this.newShip.init(shipStartX, shipStartY, images.spaceship.width, images.spaceship.height);
            
            // Initialize the pool of enemies
            this.enemyPool = new pool(30);
            this.enemyPool.init("enemy");
            var height = images.enemy.height;
            var width = images.enemy.width;
            var x = 100;
            var y = -height;
            var spacer = y * 1.5;
            // Loop and populate
            for (var i = 1; i <= 18; i++) {
                this.enemyPool.get(x, y, 2);
                x += width + 25;
                // Go to next row when we have reached max for the current row
                if (i % 6 == 0) {
                    x = 100;
                    y += spacer;
                }
            }
            this.enemyBulletPool = new pool(50);
            this.enemyBulletPool.init("enemyBullet");

            // start the quad tree
            this.quadTree = new quadTree({
                x: 0,
                y: 0,
                width: this.mainCanvas.width,
                height: this.mainCanvas.height
            });

            return true;
		} else {
			return false;
		}
    };
    // Start the animation loop
    this.start = function() {
        this.newShip.draw();
        animate();
    };
}

// Animation loop
function animate() {
    // Insert objects into the quadTree
    newGame.quadTree.clear();
    newGame.quadTree.insert(newGame.newShip);
    newGame.quadTree.insert(newGame.newShip.bulletPool.getPool());
    newGame.quadTree.insert(newGame.enemyPool.getPool());
    newGame.quadTree.insert(newGame.enemyBulletPool.getPool());
    detectCollision();

    // Animate game objects
    requestAnimFrame( animate );
    newGame.newBackground.draw();
    newGame.newShip.move();
    newGame.newShip.bulletPool.animate();
    newGame.enemyPool.animate();
    newGame.enemyBulletPool.animate();
}

// Creates an animation timer
window.requestAnimFrame = (function(callback, element){
	return  function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
    }
})();

// Object Pool structure, for keeping your game running smooth
function pool(maxSize) {
    var size = maxSize;
    var bulletPool = [];

    // Populate pool array with bullets to be used
    this.init = function(object) {
        if (object == "bullet") {
            for (var i = 0; i < size; i++) {
                // Initalize the bullet object
                var newBullet = new bullet("bullet");
                newBullet.init(0,0, images.bullet.width, images.bullet.height);
                newBullet.collidableWith = "enemy";
                newBullet.type = "bullet";
                bulletPool[i] = newBullet;
            }
        }
        else if (object == "enemy") {
            for (var i = 0; i < size; i++) {
                var newEnemy = new enemy();
                newEnemy.init(0, 0, images.enemy.width, images.enemy.height);
                bulletPool[i] = newEnemy;
            }
        }
        else if (object == "enemyBullet") {
            for (var i = 0; i < size; i++) {
                var newBullet = new bullet("enemyBullet");
                newBullet.init(0, 0, images.enemyBullet.width, images.enemyBullet.height);
                newBullet.collidableWith = "ship";
                newBullet.type = "enemyBullet";
                bulletPool[i] = newBullet;
            }
        }
	};

    // Grabs last item in the list and creates it
    this.get = function(x, y, speed) {
        if(!bulletPool[size - 1].alive) {
            bulletPool[size - 1].spawn(x, y, speed);
            bulletPool.unshift(bulletPool.pop());
        }
    };

    // Use to get two bullets at once (when the player fires)
    this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
        if(!bulletPool[size - 1].alive && !bulletPool[size - 2].alive) {
            this.get(x1, y1, speed1);
            this.get(x2, y2, speed2);
        }
    };

    // Return all alive objects to be used in the quadtree
    this.getPool = function() {
        var obj = [];
        for (var i = 0; i < size; i++) {
            if(bulletPool[i].alive) {
                obj.push(bulletPool[i]);
            }
        }
        return obj;
    };

    // Draws all bullets on the screen, when a bullet leaves the screen then erase it
    this.animate = function() {
        for (var i = 0; i < size; i++) {
            if (bulletPool[i].alive) {
                if (bulletPool[i].draw()) {
                    bulletPool[i].clear();
                    bulletPool.push((bulletPool.splice(i, 1))[0]);
                }
            }
            else {
                break;
            }
        }
    };
}

// Create bullet object
function bullet(object) {
    this.alive = false;
    var self = object;

    // Set bullet values
    this.spawn = function(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.alive = true;
    }

    // Draw the bullet
    this.draw = function() {
        this.context.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
        this.y -= this.speed;

        if (this.isColliding) {
            return true;
        }
        else if (self === "bullet" && this.y <= 0 - this.height) {
            return true;
        }
        else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
            return true;
        }
        else {
            if (self === "bullet") {
                this.context.drawImage(images.bullet, this.x, this.y);
            }
            else if (self === "enemyBullet") {
                this.context.drawImage(images.enemyBullet, this.x, this.y);
            }
            return false;
        }
    };

    // Reset bullet values
    this.clear = function() {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alive = false;
        this.isColliding = false;
    };
}
// Add as a child of drawable
bullet.prototype = new drawable();

// Create ship object
function ship() {
    this.speed = 3;
    this.bulletPool = new pool(30);
    this.bulletPool.init("bullet");
    var fireRate = 9;
    var counter = 0;

    this.collidableWith = "enemyBullet";
    this.type = "ship";

    this.draw = function() {
        this.context.drawImage(images.spaceship, this.x, this.y);
    }

    this.move = function() {
        counter++;

        // Check for movement
        if (KEY_STATUS.left || KEY_STATUS.right || KEY_STATUS.up || KEY_STATUS.down) {
            // Ship is being moved, clear current position to draw new area
            this.context.clearRect(this.x, this.y, this.width, this.height);

            // Update position based on what key was pressed
            if (KEY_STATUS.left) {
                this.x -= this.speed;
                // Keep player in screen
                if (this.x <= 0) {
                    this.x = 0;
                }
            }
            if (KEY_STATUS.right) {
                this.x += this.speed;
                // Keep player in screen
                if (this.x >= this.canvasWidth - this.width) {
                    this.x = this.canvasWidth - this.width;
                }
            }
            if (KEY_STATUS.up) {
                this.y -= this.speed;
                // Keep player in screen
                if (this.y <= this.canvasHeight/4*3) {
                    this.y = this.canvasHeight/4*3;
                }
            }
            if (KEY_STATUS.down) {
                this.y += this.speed
                // Keep player in screen
				if (this.y >= this.canvasHeight - this.height)
					this.y = this.canvasHeight - this.height;
			}

            // Redraw the ship after the update, if not been hit
            if (!this.isColliding) {
                this.draw();
            }
        }

        // Check if firing bullets
        if (KEY_STATUS.space && counter >= fireRate) {
            this.fire();
            counter = 0;
        }
    };

    // Fire two bullets
    this.fire = function() {
        this.bulletPool.getTwo(this.x+6, this.y, 3, this.x+33, this.y, 3);
    };
}
// Add ship to drawable
ship.prototype = new drawable();

// Enemy ship object
function enemy() {
    // Initialize variables
    var percentFire = .01;
	var chance = 0;
    this.alive = false;
    
    this.collidableWith = "bullet";
    this.type = "enemy";

    // Set enemy values
    this.spawn = function(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.speedX = 0;
        this.speedY = speed;
        this.alive = true;
        this.leftEdge = this.x - 90;
        this.rightEdge = this.x + 90;
        this.bottomEdge = this.y + 140;
    };

    // Move the enemy
    this.draw = function() {
        this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
        this.x += this.speedX;
        this.y += this.speedY;

        // Move left and right when hittinf the edge
          // Starting moving down, change to left/right once reached destination
        if (this.x <= this.leftEdge) {
			this.speedX = this.speed;
		}
		else if (this.x >= this.rightEdge + this.width) {
			this.speedX = -this.speed;
		}
		else if (this.y >= this.bottomEdge) {
			this.speed = 1.5;
			this.speedY = 0;
			this.y -= 5;
			this.speedX = -this.speed;
		}

        // If not in collision
        if (!this.isColliding) {
            this.context.drawImage(images.enemy, this.x, this.y);

            // Random numbers, wait for right one to fire at player
            chance = Math.floor(Math.random()*201);
            if (chance/100 < percentFire) {
                this.fire();
            }
            return false;
        }
        else {
            return true;
        }
    };

    // Fire away!
    this.fire = function() {
        newGame.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -2.5);
    };

    // Reset enemy values
    this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.speedX = 0;
		this.speedY = 0;
        this.alive = false;
        this.isColliding = false;
	};
}
// Add to drawable parent
enemy.prototype = new drawable();