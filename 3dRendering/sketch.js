let world;
let camera;
let drawnObjects = [];
let polygons = [];
let cubes = [];
let elon;
let elipson;
let cameraRes = 10;
let resSlider;
let canMove = false;
let doBorders = false;

function preload(){
  elon = loadImage("Assets/Elon Musk.png");
}

function setup()
{
  createCanvas(windowWidth, windowHeight);
  elipson = pow(10, -8);
  world = new worldConstants();
  camera = new Camera(PI / 3, cameraRes);
  noStroke();
  //new cube3D(5, 5, 5, 20, 20, 20);
  //new cube3D(50, 50, 5, 20, 20, 20);
  new cube3D(5, 5, 5, 10, 10, 10);
  //new cube3D(20, 5, 5, 10, 10, 10);
  //new cube3D(0, 15, 0, 100, 10, 100);
  //new cube3D(50, 15, 50, 50, 50, 50);
  //new polygon3D(new pose3D(10, 10, 10), new pose3D(10, 10, 20), new pose3D(10, 20, 10), undefined, false);
}

function draw()
{
  camera.updateScreen();
  camera.control();
  fill(255);
  text(round(frameRate()), 100, 100);
}

function mousePressed()
{
  requestPointerLock();
}

class worldConstants
{
  constructor()
  {
    this.forward = new direction(0, 0);
    this.origin = new pose3D(0, 0, 0)
  }
}

class Camera
{
  constructor(FOV, screenResoltution)
  {
    // position
    this.position = world.origin.copy();

    // important constants
    this.FOV = FOV;
    this.resolution = screenResoltution;

    this.forward = world.forward.copy();

    this.rays = [];
    this.xs = [];
    this.ys = [];

    // define "screen" or raycasts that return values to the screen
    for (let x = 0; x < width / this.resolution; x++)
    {
      for (let y = 0; y < height / this.resolution; y++)
      {
        let xRot = map(x, 0, width / this.resolution, -FOV, FOV);
        let yRot = map(y, 0, height / this.resolution, -FOV, FOV) / (width / height);
        let newAng = this.forward.copy();
        newAng.rotateBy(xRot, yRot);
        this.xs.push(x * this.resolution);
        this.ys.push(y * this.resolution);
        this.rays.push(new rayCast(this.position, newAng, 1, 25));
      }
    }
    this.hasColided = [];
  }
  updateScreen()
  {
    background(100);
    for (let i = 0; i < this.rays.length; i++)
    {
      let fillColor = this.rays[i].cast(polygons);
        if(fillColor != false){
          fill(fillColor);
          if(doBorders == true && (this.hasColided[this.hasColided.length-1] != fillColor || this.hasColided[round(this.hasColided.length-(width/cameraRes))] != fillColor)) fill(20);
          square(this.xs[i], this.ys[i], cameraRes);
          noStroke();
      }
      //this.hasColided.push(fillColor);
    }
    //this.hasColided = [];
  }
  control()
  {
    let speed = 1;
    if (keyIsDown(87)) this.moveLocal(speed, 0, 0);
    if (keyIsDown(83)) this.moveLocal(-speed, 0, 0);
    if (keyIsDown(65)) this.moveLocal(0, 0, -speed);
    if (keyIsDown(68)) this.moveLocal(0, 0, speed);
    if (keyIsDown(32)) this.move(0, -speed, 0);
    if (keyIsDown(16)) this.move(0, speed, 0);

    let mouseDampening = 80;
    this.rotateBy(movedX / mouseDampening, movedY / mouseDampening);
  }
  rotateBy(y, z)
  {
    if (this.forward.zRot + z > (3 / 2) * PI || this.forward.zRot + z < -(3 / 2) * PI) z = 0;
    this.forward.rotateBy(y, z);
    for (let i = 0; i < this.rays.length; i++)
    {
      this.rays[i].direction.rotateBy(y, z);
      this.rays[i].updateVectors();
    }
  }
  moveLocal(x, y, z)
  {
    //x = horizontal, z = directly in front of, y = up/down

    // the global variables that are applied directly to the x/y/z
    let xMove = 0;
    let yMove = 0;
    let zMove = 0;

    // apply forward/back movement
    let v = this.forward.getVector();

    xMove += x * v.x;
    yMove += x * v.y;
    zMove += x * v.z;

    // rotate forward to be right so positive = right, -= left
    this.forward.rotateBy(PI / 2, 0);

    v = this.forward.getVector();
    // apply the local left movement
    xMove += z * v.x;
    yMove += z * v.y;
    zMove += z * v.z;

    // rotate forward to be down so down = up, -= up
    this.forward.rotateBy(-PI / 2, PI / 2);

    v = this.forward.getVector();
    // apply the local left movement
    xMove += y * v.x;
    yMove += y * v.y;
    zMove += y * v.z;

    // reset forward to forward
    this.forward.rotateBy(0, -PI / 2);

    // apply local movement
    this.move(xMove, 0, zMove);
  }
  move(x, y, z)
  {
    this.position.addPos(x, y, z);
    for (let i = 0; i < this.rays.length; i++)
    {
      this.rays[i].startPos.addPos(x, y, z);
      this.rays[i].updateVectors();
    }
  }
}

// yRotation is about the y axis and affects X and Z, z rotation affects Y axis in a vector.
class direction
{
  constructor(yRotation, zRotation)
  {
    this.yRot = yRotation;
    this.zRot = zRotation;
    this.getVector();
  }
  getVector()
  {
    let xValue = cos(this.yRot);
    let zValue = cos(this.yRot + PI / 2);
    let yValue = this.zRot / (PI / 3.3);
    this.tVec = createVector(xValue, yValue, zValue)
    return this.tVec;
  }
  rotateBy(y, z)
  {
    this.yRot += y;
    this.zRot += z;
  }
  copy()
  {
    return new direction(this.yRot, this.zRot);
  }
}

class rayCast
{
  constructor(startPos, direction, sampleSize, maxSamples)
  {
    this.startPos = startPos.copy();
    this.curPos = startPos.copy();
    this.direction = direction.copy();
    this.sampleSize = sampleSize;
    this.maxSamples = maxSamples;
    this.dirVec = this.direction.getVector();
    this.sp = this.startPos.toVector();
  }
  cast(checkPolys)
  {
    let colColor;
    let leastDistance = 1000000;
    for (let i = 0; i < checkPolys.length; i++)
    {
      let col = checkPolys[i].isLineColiding(this.sp, this.dirVec);
      if (col != false && leastDistance > col[1]){
        leastDistance = col[1];
        colColor = col[0];
      } 
    }
    if(colColor != undefined) return colColor;
    return false;
  }
  updateVectors(){
    this.dirVec = this.direction.getVector();
    this.sp = this.startPos.toVector();
  }
}

class polygon3D
{
  constructor(pose1, pose2, pose3, img, doCulling)
  {
    this.pose1 = pose1.copy();
    this.pose2 = pose2.copy();
    this.pose3 = pose3.copy();

    this.img = img;

    this.centerPose = this.getCenter();
    this.normal = this.getNormal();

    this.fillColor = color(random(0, 255), random(0, 255), random(0, 255));
    this.doCulling = doCulling;
    if(doCulling == undefined) this.doCulling = true;

    polygons.push(this);
  }
  getCenter()
  {
    let xPos = (this.pose1.x + this.pose2.x + this.pose3.x) / 3;
    let yPos = (this.pose1.y + this.pose2.y + this.pose3.y) / 3;
    let zPos = (this.pose1.z + this.pose2.z + this.pose3.z) / 3;
    return new pose3D(xPos, yPos, zPos);
  }
  getNormal()
  {
    let v1 = this.pose2.sub(this.pose1);
    let v2 = this.pose3.sub(this.pose1);

    let xValue = v1.y * v2.z - v1.z * v2.y;
    let yValue = v1.z * v2.x - v1.x * v2.z;
    let zValue = v1.x * v2.y - v1.y * v2.x;

    return createVector(xValue, yValue, zValue);
  }
  // All coppied from https://github.com/scratchapixel/scratchapixel-code/blob/main/ray-tracing-rendering-a-triangle/raytri.cpp
  isLineColiding(orig, direction)
  {
    orig = createVector(orig.x, orig.y, orig.z);
    // convert pose objects into vectors
    let v0 = this.pose1.toVector();
    let v1 = this.pose2.toVector();
    let v2 = this.pose3.toVector();

    // compute plane normal
    let e0 = v0.sub(v2);
    let e1 = v1.sub(v2);
    // no need to normalize
    let pvec = direction.cross(e1);
    let det = e0.dot(pvec);

    //if(det < elipson || abs(det) < elipson) return false;

    let invDet = 1/det;

    let tvec = orig.sub(v2);
    let u = tvec.dot(pvec) * invDet;
    if(u < 0 || u > 1) return false;

    let qvec = tvec.cross(e0);
    let v = direction.dot(qvec) * invDet;
    if(v < 0 || u + v > 1) return false

    let t = e1.dot(qvec) * invDet;

    if(t < 0) return false;
    return [this.fillColor, t]; // it hit
  }
}

class cube3D
{
  constructor(x, y, z, w, h, l)
  {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    this.h = h;
    this.l = l;

    this.centerPos = new pose3D(this.x + this.w / 2, this.y + this.h / 2, this.z + this.l / 2);
    background(0);
    
    elon.loadPixels();
    this.fillImage = elon.pixels;
    this.fillColor = [random(0, 255), random(0, 255), random(0, 255)];

    let c1 = new pose3D(this.x, this.y, this.z);
    let c2 = new pose3D(this.x + this.w, this.y, this.z);
    let c3 = new pose3D(this.x + this.w, this.y + this.h, this.z);
    let c4 = new pose3D(this.x, this.y + this.h, this.z);

    let c5 = new pose3D(this.x, this.y, this.z + this.l);
    let c6 = new pose3D(this.x + this.w, this.y, this.z + this.l);
    let c7 = new pose3D(this.x + this.w, this.y + this.h, this.z + this.l);
    let c8 = new pose3D(this.x, this.y + this.h, this.z + this.l);

    this.polygons = [];

    let f1 = constructFace(c1, c2, c3, c4, this.fillImage, true); // "Back"
    let f2 = constructFace(c1, c5, c8, c4, this.fillImage); // "Left"
    let f3 = constructFace(c5, c6, c7, c8, this.fillImage); // "Front"
    let f4 = constructFace(c6, c2, c3, c7, this.fillImage); // "Right"
    let f5 = constructFace(c1, c2, c6, c5, this.fillImage); // "Top"
    let f6 = constructFace(c4, c3, c7, c8, this.fillImage, true); // "Bottom"
    this.polygons.push(f1[0], f1[1], f2[0], f2[1], f3[0], f3[1], f4[0], f4[1], f5[0], f5[1], f6[0], f6[1]);

    let fM = 0.4;
    f1[0].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    f1[1].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    
    fM = 0.55;
    f2[0].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    f2[1].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    
    fM = 0.7;
    f3[0].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    f3[1].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    
    fM = 0.25;
    f4[0].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    f4[1].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    
    fM = 1;
    f5[0].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    f5[1].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    
    fM = 1.2;
    f6[0].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    f6[1].fillColor = [this.fillColor[0] * fM, this.fillColor[1] * fM, this.fillColor[2] * fM];
    /*
    */
    cubes.push(this);
  }
  isPointColiding(x, y, z)
  {
    return (x > this.x - 1 && x < this.x + this.w + 1 && y > this.y - 1 && y < this.y + this.h + 1 && z > this.z - 1 && z < this.z + this.l + 1);
  }
  isPointOnBorder(x, y, z)
  {
    let total = 0;
    if (dist(x, 0, this.centerPos.x, 0) >= this.w / 2 - 0.1) total++;
    if (dist(y, 0, this.centerPos.y, 0) >= this.h / 2 - 0.1) total++;
    if (dist(z, 0, this.centerPos.z, 0) >= this.l / 2 - 0.1) total++;

    if (total >= 2) return true;
    return false;
  }
  moveBy(x, y, z){
    for(let i = 0; i < this.polygons.length; i++){
      this.polygons[i].pose1.addPos(x, y, z);
      this.polygons[i].pose2.addPos(x, y, z);
      this.polygons[i].pose3.addPos(x, y, z);
    }
  }
}

class pose3D
{
  constructor(x, y, z)
  {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  addPos(x, y, z)
  {
    this.x += x;
    this.y += y;
    this.z += z;
  }
  setPos(x, y, z)
  {
    this.x += x;
    this.y += y;
    this.z += z;
  }
  distFrom(pose)
  {
    return (tDist(this.x, pose.x) + tDist(this.y, pose.y) + tDist(this.z, pose.z));
  }
  // same functionality as distFrom but returns in vector format
  vectorDistFrom(pose)
  {
    return createVector(tDist(this.x, pose.x), tDist(this.y, pose.y), tDist(this.z, pose.z));
  }
  add(pose)
  {
    return new pose3D(this.x + pose.x, this.y + pose.y, this.z + pose.z);
  }
  sub(pose)
  {
    return new pose3D(this.x - pose.x, this.y - pose.y, this.z - pose.z);
  }
  toVector()
  {
    return createVector(this.x, this.y, this.z);
  }
  copy()
  {
    return new pose3D(this.x, this.y, this.z)
  }
}

function tDist(x, x2)
{
  if (x > x2) return -dist(x, 0, x2, 0);
  return dist(x, 0, x2, 0);
}

function vectorToPose(vec)
{
  return new pose3D(vec.x, vec.y, vec.z);
}

function totalValue(vec)
{
  return vec.x + vec.y + vec.z;
}

function dist3D(x, y, z, x2, y2, z2){
  return sqrt(pow(x2-x, 2) + pow(y2-y, 2) + pow(z2-z, 2));
}

function deg2rad(deg){
  return deg * PI/180;
}

// 1 = top left, 2 = top right, 3 = bottom right, 4 = bottom right
function constructFace(corner1, corner2, corner3, corner4, img, constructReverse)
{
  let p1;
  let p2;
  if (constructReverse == undefined || constructReverse == false)
  {
    p1 = new polygon3D(corner1, corner2, corner3, img, true);
    p2 = new polygon3D(corner1, corner3, corner4, img, true);
  }
  else
  {
    p1 = new polygon3D(corner3, corner2, corner1, img, true);
    p2 = new polygon3D(corner4, corner3, corner1, img, true);
  }
  return [p1, p2];
}
