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

    // Ensure all of the images have loaded before doing anything else
    var numImages = 3;
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

    // Set image source
    this.background.src = "images/bg.png";
    this.spaceship.src = "images/ship.png";
    this.bullet.src = "images/bullet.png"
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

    // Define abstract function to be used in child objects
    this.draw = function() {};
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
              // bullet
            bullet.prototype.context = this.mainContext;
            bullet.prototype.canvasWidth = this.mainCanvas.width;
            bullet.prototype.canvasHeight = this.mainCanvas.height;

			// Initialize the background object
			this.newBackground = new background();
            this.newBackground.init(0,0); // Set draw point to 0,0

            // Intialize the ship
            this.newShip = new ship();

            // Set starting position for the ship
            var shipStartX = this.shipCanvas.width/2 - images.spaceship.width;
            var shipStartY = this.shipCanvas.height/4*3 + images.spaceship.height*2;
            this.newShip.init(shipStartX, shipStartY, images.spaceship.width, images.spaceship.height);
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
    requestAnimFrame( animate );
    newGame.newBackground.draw();
    newGame.newShip.move();
    newGame.newShip.bulletPool.animate();
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
    this.init = function() {
		for (var i = 0; i < size; i++) {
			// Initalize the bullet object
			var newBullet = new bullet();
			newBullet.init(0,0, images.bullet.width,
			            images.bullet.height);
			bulletPool[i] = newBullet;
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
function bullet() {
    this.alive = false;

    // Set bullet values
    this.spawn = function(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.alive = true;
    }

    // Draw the bullet
    this.draw = function() {
        this.context.clearRect(this.x, this.y, this.width, this.height);
        this.y -= this.speed;

        if (this.y <= 0 - this.height) {
            return true;
        }
        else {
            this.context.drawImage(images.bullet, this.x, this.y);
        }
    };

    // Reset bullet values
    this.clear = function() {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.alive = false;
    };
}
// Add as a child of drawable
bullet.prototype = new drawable();

// Create ship object
function ship() {
    this.speed = 3;
    this.bulletPool = new pool(30);
    this.bulletPool.init();
    var fireRate = 15;
    var counter = 0;

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

            // Redraw the ship after the update
            this.draw();
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