// virtual canvas pixel size
const step = 10;

function drawPixel(x, y) {
  var canvas = document.getElementById('canvas');
  var x_coor = x * step;
  var y_coor = y * step;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgb(255, 0, 0)';
  ctx.fillRect(x_coor, y_coor, step, step);
}

function Edge(x1, y1, x2, y2) {
  this.x1 = parseInt(x1)
  this.y1 = parseInt(y1)
  this.x2 = parseInt(x2)
  this.y2 = parseInt(y2)

  if (this.y1 >= this.y2) {
    this.x2 = parseInt(x1)
    this.y2 = parseInt(y1)
    this.x1 = parseInt(x2)
    this.y1 = parseInt(y2)
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

function drawSpan(span, y) {
  var xdiff = parseInt(span.x2 - span.x1)
  if (xdiff == 0)
    return;

  var factor = 0.0;
  var factorStep = 1.0 / xdiff;

  for (var x = span.x1; x < span.x2; x++) {
    drawPixel(x, y);
    factor += factorStep;
  }
}

function drawSpansBetweenEdges(edge1, edge2) {
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
    drawSpan(span, y);

    // increase factors
    factor1 += factorStep1;
    factor2 += factorStep2;
  }
}

function drawTriangleScanLine(x1, y1, x2, y2, x3, y3) {
  var edges = [
    new Edge(x1, y1, x2, y2),
    new Edge(x2, y2, x3, y3),
    new Edge(x3, y3, x1, y1)
  ];

  var maxLength = 0;
  var longEdge = 0;

  for (var i = 0; i < 3; i++) {
    var length = edges[i].y2 - edges[i].y1;
    if (length > maxLength) {
      maxLength = length;
      longEdge = i;
    }
  }

  var shortEdge1 = (longEdge + 1) % 3;
  var shortEdge2 = (longEdge + 2) % 3;

  drawSpansBetweenEdges(edges[longEdge], edges[shortEdge1]);
  drawSpansBetweenEdges(edges[longEdge], edges[shortEdge2]);

  {
    // draw edge on js canvas
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgb(0, 200, 0)';
    ctx.lineWidth = 1;
    ctx.moveTo(x1 * step, y1 * step);
    ctx.beginPath();
    ctx.lineTo(x2 * step, y2 * step);
    ctx.lineTo(x3 * step, y3 * step);
    ctx.lineTo(x1 * step, y1 * step);
    ctx.closePath();
    ctx.stroke();
  }
}

function testCase(ctx) {
  // test draw a pixel on virtual canvas
  drawPixel(0, 0);
  // test draw span
  var edge1 = new Edge(100, 0, 50, 100);
  var edge2 = new Edge(100, 0, 200, 100)
  drawSpansBetweenEdges(edge1, edge2);
  // test draw triangle
  drawTriangleScanLine(10.5, 10.5, 50.4, 50.3, 30.8, 100.4);
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