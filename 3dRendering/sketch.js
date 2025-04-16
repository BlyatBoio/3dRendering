let world;
let camera;
let drawnObjects = [];
let noGoAngles  = [];

function setup()
{
  createCanvas(windowWidth, windowHeight);
  world = new worldConstants();
  camera = new Camera(PI / 3, 30);
  noStroke();
  new cube3D(5, -1, -1, 10, 10, 10);
  new cube3D(5, 5, 5, 10, 1, 10);
  new cube3D(5, -20, 5, 10, 1, 10);
}

function draw()
{
  camera.updateScreen();
  camera.control();
}

function mousePressed(){
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
        this.rays.push(new rayCast(this.position, newAng, 0.5, 50));
      }
    }
  }
  updateScreen()
  {
    for (let i = 0; i < this.rays.length; i++)
    {
      let fillColor = this.rays[i].cast();
      fill(fillColor);
      square(this.xs[i], this.ys[i], this.resolution);
      //fill(255);
      //stroke(0);
      //textSize(10);
      //text(round(this.rays[i].direction.zRot*10/PI)/10, this.xs[i], this.ys[i]);
    }
  }
  control()
  {
    let speed = 0.1;
    if (keyIsDown(87)) this.moveLocal(speed, 0, 0);
    if (keyIsDown(83)) this.moveLocal(-speed, 0, 0);
    if (keyIsDown(65)) this.moveLocal(0, 0, -speed);
    if (keyIsDown(68)) this.moveLocal(0, 0, speed);
    if (keyIsDown(32)) this.move(0, -speed, 0);
    if (keyIsDown(16)) this.move(0, speed, 0);

    let mouseDampening = 30;
    this.rotateBy(movedX / mouseDampening, movedY / mouseDampening);
  }
  rotateBy(y, z)
  {
    if(this.forward.zRot + z > (3/2)*PI || this.forward.zRot + z < -(3/2)*PI) z = 0;
    this.forward.rotateBy(y, z);
    for (let i = 0; i < this.rays.length; i++)
    {
      this.rays[i].direction.rotateBy(y, z);
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
    this.forward.rotateBy(PI/2, 0);

    v = this.forward.getVector();
    // apply the local left movement
    xMove += z * v.x;
    yMove += z * v.y;
    zMove += z * v.z;

    // rotate forward to be down so down = up, -= up
    this.forward.rotateBy(-PI/2, PI/2);

    v = this.forward.getVector();
    // apply the local left movement
    xMove += y * v.x;
    yMove += y * v.y;
    zMove += y * v.z;

    // reset forward to forward
    this.forward.rotateBy(0, -PI/2);

    // apply local movement
    this.move(xMove, 0, zMove);
  }
  move(x, y, z)
  {
    this.position.addPos(x, y, z);
    for (let i = 0; i < this.rays.length; i++)
    {
      this.rays[i].startPos.addPos(x, y, z);
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
  }
  getVector()
  {
    let xValue = cos(this.yRot);
    let zValue = cos(this.yRot + PI / 2);
    let yValue = this.zRot/(PI/3.3);
    return createVector(xValue, yValue, zValue);
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
  }
  cast()
  {
    this.curPos = this.startPos.copy();
    let samples = 0;

    while (samples < this.maxSamples)
    {
      // itterate over objects to see what is drawn
      for (let i = 0; i < drawnObjects.length; i++)
      {
        if (drawnObjects[i].isPointColiding(this.curPos.x, this.curPos.y, this.curPos.z) == true)
        {
          //if(drawnObjects[i].isPointOnBorder(this.curPos.x, this.curPos.y, this.curPos.z) == true) return 200;
          return color(drawnObjects[i].fillColor[0] / (samples/10), drawnObjects[i].fillColor[1] / (samples/10), drawnObjects[i].fillColor[2] / (samples/10));
        }
      }
      // move the step forward
      let v = this.direction.getVector();
      this.curPos.x += v.x * this.sampleSize;
      this.curPos.y += v.y * this.sampleSize;
      this.curPos.z += v.z * this.sampleSize;
      samples++;
    }
    return color(0, 0, 0);
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

    this.centerPos = new pose3D(this.x + this.w/2, this.y + this.h/2, this.z + this.l/2);

    this.fillColor = [random(0, 255), random(0, 255), random(0, 255)]
    drawnObjects.push(this);
  }
  isPointColiding(x, y, z)
  {
    return (x > this.x - 1 && x < this.x + this.w + 1 && y > this.y - 1 && y < this.y + this.h + 1 && z > this.z - 1 && z < this.z + this.l + 1);
  }
  isPointOnBorder(x, y, z){
    let total = 0;
    if(dist(x, 0, this.centerPos.x, 0) >= this.w/2 - 0.1) total ++;
    if(dist(y, 0, this.centerPos.y, 0) >= this.h/2 - 0.1) total ++;
    if(dist(z, 0, this.centerPos.z, 0) >= this.l/2 - 0.1) total ++;
    
    if(total >=2) return true;
    return false;
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
  copy()
  {
    return new pose3D(this.x, this.y, this.z)
  }
}
