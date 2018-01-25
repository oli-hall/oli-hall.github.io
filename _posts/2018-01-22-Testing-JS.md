---
layout: post
title: "Spline experiments"
date: 2018-01-22 11:02
categories: posts
comments: true

---

I've long been intrigued by procedural art and procedural generation and, having a little spare time on my hands, decided to dive in and combine a bit of experimentation with learning JavaScript a little better. Whilst it is oft-maligned, the fact it runs in every web browser does make it rather handy for making interactive tools and visualations! I recently came across the work of Anders Hoff, aka [Inconvergent](http://inconvergent.net), and spent a while reading through some of his explanations of how he generated various different images. What particularly struck me was the interactive examples he had of various techniques, running in JS in the page. If only I could replicate this...

## Splines

One that particularly caught my eye was his [work on generative splines](http://inconvergent.net/spurious-splines/), partly because it was really pretty, but also because it seemed approachable, both from an algorithmic perspective as well as from the coding side. However, even getting this basic stuff working, with an explanation of how it was done, still took several hours.

The tool of choice here is an [HTML Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial). This allows a lot of flexibility and manipulation, from drawing basic 2D lines and shapes to much more elaborate features and effects. However, for this, 2D lines are all we need, in particular, curves. For this, we'll need to dive into JS.

### Curving JavaScript

There are a bunch of different methods for drawing curves on Canvases, but for the purposes of this demo, there are two main methods: [quadraticCurveTo](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/quadraticCurveTo); and [bezierCurveTo](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo). Basically, they do more or less the same thing, but with different numbers of control points. Quadratic curves generate a curve with a single control point, and Bezier Curves with two control points. Here's a quick example of the quadratic curve:

```javascript
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

ctx.moveTo(points[0].x, points[0].y);
ctx.quadraticCurveTo(points[1].x, points[1].y, points[2].x, points[2].y);
```

However, if you want to make curves with more than two control points, the native methods aren't as much use. If you simply chain them together (i.e. use one curve over points 1-3, another from points 3 through 6), you're going to get ugly joins, as they don't take into account the points before or after them. Fortunately, StackOverFlow, as always, yields [a solution](https://stackoverflow.com/a/7058606):

```javascript
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

for (i = 1; i < points.length - 2; i ++) {
    var xc = (points[i].x + points[i + 1].x) / 2;
    var yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
}

ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
```

This interpolates the next two points when drawing each section of the curve, yielding a smooth transition between the points. Excellent!

However, how do we generate points? Well, I figured a good starting point would be to generate a number of random points, and draw a curve through them, and see what that looked like. The random points are just random integers between 0 and the max width/height of the Canvas, for simplicity. I'm guaranteeing that the points will be on the Canvas, but no more than that. A nice later addition might be to generate later points based on the previous ones, but that can wait for now. So what does that look like?

![multi-point random curve]({{ "images/multi_point_curve.png" | absolute_url }})

OK, we have a random signature generator! Nice... now to make things a bit more interesting.

### Just add... Randomness?

The next step is to add some random jitter. This involves a couple of things: animation; and adding randomness. Let's tackle the second one first. The gist of what we want is, for every time step, to move each point a small amount in a random direction. The easiest way to accomplish that is to have a `noise` variable. Then, generate a random number between `-noise` and `noise` for both `x` and `y`. Add this onto the point, and Bob's your Uncle - a small random movement! However, there's one step that this doesn't take into account: our Canvas is limited in size. Eventually, given enough time, our points will wander out of bounds, and we'll never see them again.

There's a few different ways to tackle this. You can simply bound any movement to the size of the box - if a movement would take a point outside the box, clip it so it lands on the border. However, this will sometimes lead to points getting 'stuck' at the edges. This may be desirable in some cases, but for now, let's look at other approaches. Another way would be to make the points wrap - if they go off the bottom of the Canvas, they appear at the top. This is a Pac-Man-style approach, which again can yield interesting effects. However, for the curves, this will lead to occasional large jumps, which will lead to the curve suddenly shifting rapidly. A final strategy could be to simply reverse the direction of the random movement if it clips an edge - i.e. if the movement would take the point out of the Canvas, then move the point in the opposite direction. The movement will still be small, but will mean points generally avoid the edges, which should avoid clipping issues. This is what I ended up with:

```javascript
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
```

It's not the prettiest, but it gets the job done, reversing a given axis' movement if it clips an edge.

Right, animation time! Fortunately, Canvas has a pretty good API built in for doing animations. There are a couple of different approaches. Assuming you have a `draw` method which, when called, updates the points and draws them on the Canvas, you can either manually call `window.requestAnimationFrame(draw)` at the end of `draw` (which'll basically tell JS to keep calling `draw` as fast as it can), or you can call `window.setInterval(draw, 50)`, which, when called in an initialisation step, will tell the Canvas to call `draw` every 50 milliseconds. The latter offers better control over animation speed, so let's go with that.

One handy tip for debugging curves that I found useful was to plot the control points themselves. For instance, my code currently has a debug switch wrapping the following snippet, which puts a small circle on each point:

```javascript
for(i = 0; i < points.length; i++) {
    ctx.moveTo(points[i].x - 2, points[i].y);
    ctx.arc(points[i].x, points[i].y, 4, 0, Math.PI * 2);
}
```

![curve with control points]({{ "images/control_points.png" | absolute_url }})

### Make it pretty

Whilst we've successfully made a curve that moves around, it still leaves a certain something to be desired. The final step is to actually make it into something pretty. This proves surprisingly simple: dial up the transparency of the line, and then stop clearing the screen between each animation frame. This causes the curves to layer up in a semi-random fashion, creating some quite pleasing results:

![a paintbrush-like effect]({{ "images/paintbrush.png" | absolute_url }})

The sky is the limit with this stuff. Even with this basic example, I played around with different transparencies, different amounts of noise, and got quite strikingly different results. Here's one where the noise starts at zero, and increases along the length of the curve:

![horsetail]({{ "images/horsetail.png" | absolute_url }})

### Interactive example

Here's an interactive example. It's fairly minimal at the moment - it'll continue moving around until you click, at which point it will freeze. Another click will reset it to start again. For future experiments, I'd like to add a few more in progress demos and a bit more interactivity, but this'll do for now. The full code used to generate the images is on [GitHub](https://github.com/oli-hall/splined) - I'll tidy this repository up as I add new examples and experiments.

{% include splines.html %}
