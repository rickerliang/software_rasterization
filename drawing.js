// drawXXX draw on html canvas
// rasterizeXXX rasterize on virtual canvas

// virtual canvas pixel size
const step = 10;

function drawPixel(x, y, color) {
  var canvas = document.getElementById('canvas');
  var x_coor = x * step;
  var y_coor = y * step;
  var ctx = canvas.getContext('2d');
  if (color == null)
    ctx.fillStyle = 'rgb(255, 0, 0)';
  else
    ctx.fillStyle = color;
  ctx.fillRect(x_coor, y_coor, 1, 1);
}

function drawPixelVirtualCanvas(x, y, color) {
  var canvas = document.getElementById('canvas');
  var x_coor = parseInt(x) * step;
  var y_coor = parseInt(y) * step;
  var ctx = canvas.getContext('2d');
  if (color == null)
    ctx.fillStyle = 'rgb(255, 0, 0)';
  else
    ctx.fillStyle = color;
  ctx.fillRect(x_coor, y_coor, step, step);
}

function Edge(x1, y1, x2, y2) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;

  if (this.y1 >= this.y2) {
    this.x2 = x1
    this.y2 = y1
    this.x1 = x2
    this.y1 = y2
  }

  // build edge function according vetices order
  this.deltaX = x2 - x1;
  this.deltaY = y2 - y1;

  this.fx = function(x, y) {
    return (x - x1) * this.deltaY - (y - y1) * this.deltaX;
  }

  this.draw = function() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgb(0, 200, 0)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x1 * step, this.y1 * step);
    ctx.lineTo(this.x2 * step, this.y2 * step);
    ctx.closePath();
    ctx.stroke();
  }
}

function Span(x1, x2) {
  this.x1 = parseInt(x1);
  this.x2 = parseInt(x2);
  if (this.x1 >= this.x2) {
    this.x1 = parseInt(x2);
    this.x2 = parseInt(x1);
  }
}

function rasterizeSpan(span, y) {
  var xdiff = parseInt(span.x2 - span.x1)
  if (xdiff == 0)
    return;

  var factor = 0.0;
  var factorStep = 1.0 / xdiff;

  for (var x = span.x1; x < span.x2; x++) {
    drawPixelVirtualCanvas(x, y);
    factor += factorStep;
  }
}

function rasterizeSpansBetweenEdges(edge1, edge2) {
  var e1ydiff = parseFloat(edge1.y2 - edge1.y1);
  if (e1ydiff == 0.0)
    return;

  var e2ydiff = parseFloat(edge2.y2 - edge2.y1);
  if (e2ydiff == 0.0)
    return;

  var e1xdiff = parseFloat(edge1.x2 - edge1.x1);
  var e2xdiff = parseFloat(edge2.x2 - edge2.x1);

  var factor1 = parseFloat(edge2.y1 - edge1.y1) / e1ydiff;
  var factorStep1 = 1.0 / e1ydiff;
  var factor2 = 0.0;
  var factorStep2 = 1.0 / e2ydiff;

  for (var y = edge2.y1; y < edge2.y2; y++) {
    // create and draw span
    var span = new Span(edge1.x1 + parseInt(e1xdiff * factor1),
      edge2.x1 + parseInt(e2xdiff * factor2));
    rasterizeSpan(span, y);

    // increase factors
    factor1 += factorStep1;
    factor2 += factorStep2;
  }
}

function Triangle(x1, y1, x2, y2, x3, y3) {
  this.vetices = [
    { x: x1, y: y1 },
    { x: x2, y: y2 },
    { x: x3, y: y3 }
  ];
  this.edges = [
    new Edge(x1, y1, x2, y2),
    new Edge(x2, y2, x3, y3),
    new Edge(x3, y3, x1, y1)
  ];

  this.rasterizeScanLine = function() {
    var maxLength = 0;
    var longEdge = 0;

    for (var i = 0; i < 3; i++) {
      var length = this.edges[i].y2 - this.edges[i].y1;
      if (length > maxLength) {
        maxLength = length;
        longEdge = i;
      }
    }

    var shortEdge1 = (longEdge + 1) % 3;
    var shortEdge2 = (longEdge + 2) % 3;

    rasterizeSpansBetweenEdges(this.edges[longEdge], this.edges[shortEdge1]);
    rasterizeSpansBetweenEdges(this.edges[longEdge], this.edges[shortEdge2]);

    // draw edge on js canvas
    for (var i = 0; i < 3; i++) {
      this.edges[i].draw();
    }
  }

  this.AABB = function() {
    var aa = { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER };
    var bb = { x: 0, y: 0 };
    for (var i = 0; i < 3; i++) {
      if (this.vetices[i].x < aa.x) {
        aa.x = this.vetices[i].x;
      }
      if (this.vetices[i].y < aa.y) {
        aa.y = this.vetices[i].y;
      }
      if (this.vetices[i].x > bb.x) {
        bb.x = this.vetices[i].x;
      }
      if (this.vetices[i].y > bb.y) {
        bb.y = this.vetices[i].y;
      }
    }
    aa.x = Math.floor(aa.x);
    aa.y = Math.floor(aa.y);
    bb.x = Math.ceil(bb.x);
    bb.y = Math.ceil(bb.y);
    return { AA: aa, BB: bb };
  }

  this.drawAABBVirtualCanvas = function() {
    var aabb = this.AABB();
    for (var i = aabb.AA.x; i < aabb.BB.x; i++) {
      for (var j = aabb.AA.y; j < aabb.BB.y; j++) {
        drawPixelVirtualCanvas(i, j, 'rgb(200, 200, 255)');
      }
    }
  }

  this.rasterizeHalfPlane = function(superSample) {
    var ssaa = 0
    var drawFunction = null;
    if (superSample == 4) {
      // ssaa 4x
      ssaa = 4;
      var subPixelAlphaStep = 1 / ssaa;
      var samplePattern = [
        { x: 0.6, y: 0.2 },
        { x: 0.8, y: 0.6 },
        { x: 0.4, y: 0.8 },
        { x: 0.2, y: 0.4 }
      ];
      drawFunction = function(edges, x, y) {
        var alpha = 0;
        for (var i = 0; i < 4; ++i) {
          if ((edges[0].fx(x + samplePattern[i].x, y + samplePattern[i].y) <= 0) &&
            (edges[1].fx(x + samplePattern[i].x, y + samplePattern[i].y) <= 0) &&
            (edges[2].fx(x + samplePattern[i].x, y + samplePattern[i].y) <= 0)) {
            alpha = alpha + subPixelAlphaStep;
          }
          drawPixel(x + samplePattern[i].x, y + samplePattern[i].y, 'rgb(0, 0, 255)');

        }
        if (alpha != 0) {
          drawPixelVirtualCanvas(x, y, `rgba(255, 0, 0, ${alpha})`);
        }
      }
    } else if (superSample == 8) {
      // ssaa 8x
      ssaa = 8;
      var subPixelAlphaStep = 1 / ssaa;
      var samplePattern = [
        { x: 0.2, y: 0.2 },
        { x: 0.5, y: 0.1 },
        { x: 0.9, y: 0.3 },
        { x: 0.4, y: 0.4 },
        { x: 0.6, y: 0.6 },
        { x: 0.1, y: 0.7 },
        { x: 0.3, y: 0.9 },
        { x: 0.8, y: 0.8 }
      ];
      drawFunction = function(edges, x, y) {
        var alpha = 0;
        for (var i = 0; i < 8; ++i) {
          if ((edges[0].fx(x + samplePattern[i].x, y + samplePattern[i].y) <= 0) &&
            (edges[1].fx(x + samplePattern[i].x, y + samplePattern[i].y) <= 0) &&
            (edges[2].fx(x + samplePattern[i].x, y + samplePattern[i].y) <= 0)) {
            alpha = alpha + subPixelAlphaStep;
          }
          drawPixel(x + samplePattern[i].x, y + samplePattern[i].y, 'rgb(0, 0, 255)');
        }
        if (alpha != 0) {
          drawPixelVirtualCanvas(x, y, `rgba(255, 0, 0, ${alpha})`);
        }
      }
    } else if (superSample == 16) {
      // ssaa 16x
      ssaa = 16;
      var subPixelAlphaStep = 1 / ssaa;
      var hStep = Math.sqrt(ssaa);
      var vStep = Math.sqrt(ssaa);
      drawFunction = function(edges, x, y) {
        var alpha = 0;
        for (var i = subPixelAlphaStep; i <= hStep * subPixelAlphaStep; i += subPixelAlphaStep) {
          for (var j = subPixelAlphaStep; j <= vStep * subPixelAlphaStep; j += subPixelAlphaStep) {
            if ((edges[0].fx(x + i, y + j) <= 0) &&
              (edges[1].fx(x + i, y + j) <= 0) &&
              (edges[2].fx(x + i, y + j) <= 0)) {
              alpha = alpha + subPixelAlphaStep;
            }
          }
        }
        drawPixelVirtualCanvas(x, y, `rgba(255, 0, 0, ${alpha})`);
      }
    } else
    if (superSample != null) {
      // ssaa 2x
      ssaa = 2;
      var subPixelAlphaStep = 1 / ssaa;
      drawFunction = function(edges, x, y) {
        var alpha = 0;
        if ((edges[0].fx(x + 0.5, y + 0.5) <= 0) &&
          (edges[1].fx(x + 0.5, y + 0.5) <= 0) &&
          (edges[2].fx(x + 0.5, y + 0.5) <= 0)) {
          alpha += subPixelAlphaStep;
        }
        if ((edges[0].fx(x, y) <= 0) &&
          (edges[1].fx(x, y) <= 0) &&
          (edges[2].fx(x, y) <= 0)) {
          alpha += subPixelAlphaStep;
        }
        drawPixelVirtualCanvas(x, y, `rgba(255, 0, 0, ${alpha})`);
      }
    } else {
      // no ssaa, only one sample point at pixel center position
      ssaa = 0;
      drawFunction = function(edges, x, y) {
        if ((edges[0].fx(x + 0.5, y + 0.5) <= 0) &&
          (edges[1].fx(x + 0.5, y + 0.5) <= 0) &&
          (edges[2].fx(x + 0.5, y + 0.5) <= 0)) {
          drawPixelVirtualCanvas(x, y);
        }
        drawPixel(x + 0.5, y + 0.5, 'rgb(0, 0, 255)');
      }
    }
    var aabb = this.AABB();
    for (var i = aabb.AA.x; i < aabb.BB.x; ++i) {
      for (var j = aabb.AA.y; j < aabb.BB.y; ++j) {
        drawFunction(this.edges, i, j);
      }
    }
    // draw edge on js canvas
    for (var i = 0; i < 3; i++) {
      this.edges[i].draw();
    }
  }
}

function testEdgeFunction(x1, y1, x2, y2) {
  var edge3 = new Edge(x1, y1, x2, y2)
  edge3.draw();
  var point1 = { x: x1 - 1, y: y1 };
  var point2 = { x: x1 + 1, y: y1 };
  var point3 = { x: x1, y: y1 };

  var testPoint = function(point) {
    var p = edge3.fx(point.x, point.y);
    if (p > 0) {
      drawPixelVirtualCanvas(point.x, point.y, 'rgb(0, 255, 0)');
    } else if (p == 0) {
      drawPixelVirtualCanvas(point.x, point.y, 'rgb(255, 0, 0)');
    } else {
      drawPixelVirtualCanvas(point.x, point.y, 'rgb(0, 0, 255)');
    }
  }

  testPoint(point1);
  testPoint(point2);
  testPoint(point3);
}

function testCase(ctx) {
  // test draw a pixel on virtual canvas
  drawPixelVirtualCanvas(0, 0);

  // test draw span
  //var edge1 = new Edge(100, 0, 50, 100);
  //var edge2 = new Edge(100, 0, 200, 100)
  //drawSpansBetweenEdges(edge1, edge2);

  // test draw triangle
  var triangle = new Triangle(10.5, 10.5, 50.4, 50.3, 30.8, 100.4);
  triangle.drawAABBVirtualCanvas();
  triangle.rasterizeScanLine();
  //rasterizeTriangleScanLine(10.5, 10.5, 50.4, 50.3, 30.8, 100.4);

  // test edge function
  testEdgeFunction(50, 70, 80, 0);
  testEdgeFunction(180, 0, 200, 70);

  // test half plane
  // clockwise order
  var triangle = new Triangle(60.5, 10.5, 100.4, 50.3, 80.8, 100.4);
  triangle.drawAABBVirtualCanvas();
  triangle.rasterizeHalfPlane();

  // test super sample
  var triangle = new Triangle(110.5, 10.5, 150.4, 50.3, 130.8, 100.4);
  triangle.drawAABBVirtualCanvas();
  triangle.rasterizeHalfPlane(8);
}

function draw() {
  var canvas = document.getElementById('canvas');
  const width = canvas.width;
  const height = canvas.height;
  const myCanvasWidth = Math.floor(width / step);
  const myCanvasHeight = Math.floor(height / step);

  {
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(240, 240, 255)';
    ctx.fillRect(0, 0, width, height);

    testCase();

    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.lineWidth = 1;
    for (var i = 0.5; i < width; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0.5);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (var j = 0.5; j < height; j += step) {
      ctx.beginPath();
      ctx.moveTo(0.5, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }
  }
}