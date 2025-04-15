let camera;
let world;
let drawnObjects = [];

function setup(){
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB);
  noStroke();
  world = new worldConstants();
  camera = new Camera(120, 50);
  new cube3D(5, 0, -1, 2, 2, 2);
}

function draw(){
  camera.updateScreen();
}

// holds and stores world constants like a forward direction, possibly later gravity or framerate, etc.
class worldConstants {
  constructor(){
    this.forward = new direction3D(new angle3D(0, 0));
    this.screenHeightRatio = width/height;
  }
}

class Camera {
  constructor(FOV, resolution){
    // position
    this.x = 0;
    this.y = 0;
    this.z = 0;

    // important constants
    this.forward = world.forward;
    this.FOV = FOV;
    this.resolution = resolution;

    this.screen = [];
    let FOVrad = degToRad(this.FOV/2);
    for(let x = 0; x < width / this.resolution; x++){
      for(let y = 0; y < height / this.resolution; y++){
        let xRot = map(x, 0, width/this.resolution, -FOVrad, FOVrad);
        let yRot = map(y, 0, height/this.resolution, -FOVrad, FOVrad) * world.screenHeightRatio;

        // xrot and yrot are x and y as in the x and y screen position
        // actual rotations are occuring on the Y rotation (about the Y axis) and the Z axis (about the z axis)
        // think stripper pole rotation if the stripper pole is the y axis
        this.screen.push(new rayCast(createVector(this.x, this.y, this.z), this.forward, xRot, yRot, 0.1, 50, x, y))
      }
    }
  }
  updateScreen(){
    for(let i = 0; i < this.screen.length; i++){
      let fillColor = this.screen[i].checkHits();
      fill(fillColor);
      square(this.screen[i].sX * this.resolution, this.screen[i].sY * this.resolution, this.resolution);
    }
  }
}

class rayCast {
  constructor(startPos, directionBase, offX, offY, sampleRate, maxDepth, sX, sY){
    this.startPos = startPos;
    this.direction = direction;
    this.sampleRate = sampleRate;
    this.maxDepth = maxDepth;
    // screenPosition
    this.sX = sX;
    this.sY = sY;
    // ensure this.sPos and this.cPos is not the same location in memory so adding x to cpos does not add x to sPos
    this.curPos = createVector(startPos.x, startPos.y, startPos.z); 
  }
  checkHits(){
    let samples = 0;
    // other exit conditions handled by returns
    while(samples < this.maxDepth){
      // itterate over shapes and check for colisions
      for(let i = 0; i < drawnObjects.length; i++){
        if(this.curPos.x > 1) return color(255);
        if(drawnObjects[i].isPointColiding(this.curPos.x, this.curPos.y, this.curPos.z) == true){
          return drawnObjects[i].fillColor;
        }
      }

      // update current check position
      this.curPos.x += this.direction.x * this.sampleRate;
      this.curPos.y += this.direction.y * this.sampleRate; 
      this.curPos.z += this.direction.z * this.sampleRate;

      samples ++;
    }
    this.curPos = createVector(this.startPos.x, this.startPos.y, this.startPos.z);
    return color(0, 0, 0);
  }
  rotateBy(y, z){
  }
}

class cube3D{
  constructor(x, y, z, w, h, l){
    // position
    this.x = x;
    this.y = y;
    this.z = z;
    // size
    this.w = w;
    this.h = h;
    this.l = l;

    // drawing
    this.fillColor = color(255, 255, 255);

    drawnObjects.push(this);
  }
  isPointColiding(x, y, z){
    return (x>this.x&&x<this.x+this.w&&y>this.y&&y<this.y+this.h&&z>this.z&&z<this.z+this.l)
  }
}

class direction3D {
  constructor(givenAngle){
    this.ang3D = givenAngle;
    this.yRotation = givenAngle.yAngle; // controls the x and z axis 
    this.zRotation = givenAngle.zAngle; // controls the Y axis
    this.totalVector = this.getVector();
  }
  getVector(){
    let xValue = cos(this.yRotation);
    let zValue = cos(this.yRotation + PI);
    let yValue = sin(this.zRotation);
    return createVector(xValue, yValue, zValue);
  }
  rotateBy(y, z){
    this.ang3D.rotateBy(y, z);
    this.yRotation = this.ang3D.yAngle; // controls the x and z axis 
    this.zRotation = this.ang3D.zAngle; // controls the Y axis 
    this.totalVector = this.getVector();
  }
  // save the origonal state of the direction, but return it in a rotated state.
  tempRotateBy(y, z){
    this.ang3D.rotateBy(y, z);
    this.yRotation = this.ang3D.yAngle; // controls the x and z axis 
    this.zRotation = this.ang3D.zAngle; // controls the Y axis 
    return this.getVector();
  }
}

class angle3D {
  constructor(yAngle, zAngle){
    this.yAngle = yAngle; // controls both X and Z
    this.zAngle = zAngle; // controls Y
  }
  rotateBy(y, z){
    this.yAngle += y;
    this.zAngle += z;
  }
}

function tDist(x, x2){
  if(x < x2) return dist(x, 0, x2, 0);
  return -dist(x, 0, x2, 0);
}

function degToRad(angle){
  return angle * (PI/180);
}
