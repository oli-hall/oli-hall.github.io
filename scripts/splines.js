var numPoints = 15;
var points = new Array(numPoints);
var noise = 1;
var width = -1;
var height = -1;
var debug = false;
var running = true;

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function move(input, min, max, noise) {
    randomNoise = randomInt(-noise, noise);
    if (input + randomNoise > max || input + randomNoise < min) {
        return input - randomNoise;
    } 
    return input + randomNoise;
}

Point.prototype.addNoise = function(noise) {
    this.x = move(this.x, 0, width, noise);
    this.y = move(this.y, 0, height, noise);
};

function randomInt(min, max) {
    return min + ((max-min) * Math.random());
}

function generatePoints(x, y) {
    for (i = 0; i < points.length; i++) {
        points[i] = new Point(randomInt(0, x), randomInt(0, y))
    }
    return points;
}

function updatePoints(points) {
    for (i = 1; i < points.length - 1; i++) {
        points[i].addNoise(noise)
    }
}

function init() {
    var c = document.getElementById("myCanvas");

    c.addEventListener('click', function(e) {
        if (running) {
            running = false;
            return;
        }
        points = generatePoints(width, height);
        ctx = c.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        running = true;
    });

    height = c.height;
    width = c.width;

    points = generatePoints(width, height);

    window.setInterval(draw, 50);
}

function draw() {
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    if (!running) {
        return;
    }
    updatePoints(points)

    ctx.moveTo(points[0].x, points[0].y);

    for (i = 1; i < points.length - 2; i ++) {
        var xc = (points[i].x + points[i + 1].x) / 2;
        var yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y);


    if (debug) {
        // draw the points as circles
        for(i = 0; i < points.length; i++) {
            ctx.moveTo(points[i].x - 2, points[i].y);
            ctx.arc(points[i].x, points[i].y, 4, 0, Math.PI * 2);
        }
    }
    
    ctx.strokeStyle= 'rgba(0, 0, 0, 0.006)';
    ctx.stroke();
}
