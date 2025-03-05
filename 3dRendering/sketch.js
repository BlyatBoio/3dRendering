let allObjects = [];
let Camera;

function setup() {
  createCanvas(windowWidth, windowHeight);
  Camera = new camera(60, 0.1, 0.01, 20);
  createCube(2, 0, 0, 2, 2, 2);
}

function draw() {
  //Camera.moveGlobal(0.01, 0, 0);
  Camera.updateScreen();
  Camera.mouseControls();
  Camera.keyboardControls();
}

function mousePressed(){
  requestPointerLock();
}

class camera{
  constructor(FOV, movementSpeed, mouseSensitivity, resolution){
    // position
    this.x = 0;
    this.y = 0;
    this.z = 0;

    this.FOV = FOV/2; // field of view
    // movement vars
    this.movementSpeed = movementSpeed;
    this.mouseSensitivity = mouseSensitivity;

    // the size of a pixel the raycast is trying to find
    this.resolution = resolution;
    this.rays = [];
    this.positions = [];

    // the forward direction
    this.forward = new Direction(0, 0);
    this.defineRays(); // define the rays
  }
  setPosition(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
  }
  moveGlobal(x, y, z){
    this.x += x;
    this.y += y;
    this.z += z;
  }
  moveLocal(x, y, z){
    //x = horizontal, z = directly in front of, y = up/down

    // the global variables that are applied directly to the x/y/z
    let xMove = 0;
    let yMove = 0;
    let zMove = 0;

    // apply forward/back movement
    
    xMove += z * this.forward.getX();
    yMove += z * this.forward.getY();
    zMove += z * this.forward.getZ();

    // rotate forward to be right so positive = right, -= left
    this.forward.rotateBy(0, -PI);

    // apply the local left movement
    xMove += x * this.forward.getX();
    yMove += x * this.forward.getY();
    zMove += x * this.forward.getZ();

    // rotate forward to be down so down = up, -= up
    this.forward.rotateBy(PI, PI);

    // apply the local left movement
    xMove += y * this.forward.getX();
    yMove += y * this.forward.getY();
    zMove += y * this.forward.getZ();

    // reset forward to forward
    this.forward.rotateBy(-PI, 0);

    // apply local movement
    this.x += xMove;
    this.y += yMove;
    this.z += zMove;
  }
  defineRays(){
    for(let x = 0; x < width/this.resolution; x++){
      for(let y = 0; y < height/this.resolution; y++){
        // "y" rotation is horizontal, so it is determined by x position
        let yRotationOff = map(x, 0, width/this.resolution, -this.FOV, this.FOV) * (PI/180); // in radians
        // "x" rotation is vertical, so it is determined by y position
        let xRotationOff = map(y, 0, height/this.resolution, -this.FOV, this.FOV) * (PI/180); // in radians

        let r = new raycast(this.x, this.y, this.z, 0.5, 70, new Direction(xRotationOff, yRotationOff));
        this.positions.push(x*this.resolution, y*this.resolution);
        this.rays.push(r);
      }
    }
  }
  mouseControls(){
    let xm = movedX * this.mouseSensitivity;
    let ym = movedY * this.mouseSensitivity;

    this.forward.rotateBy(ym, xm);
  }
  keyboardControls(){
    if(keyIsDown(87)) this.moveGlobal(0, 0, this.movementSpeed);
    if(keyIsDown(83)) this.moveGlobal(0, 0, -this.movementSpeed);
    if(keyIsDown(68)) this.moveGlobal(this.movementSpeed, 0, 0);
    if(keyIsDown(65)) this.moveGlobal(-this.movementSpeed, 0, 0);
    if(keyIsDown(32)) this.moveGlobal(0, -this.movementSpeed, 0);
    if(keyIsDown(16)) this.moveGlobal(0, this.movementSpeed, 0);
  }
  updateScreen(){
    background(0);
    noStroke();
    for(let i = 0; i < this.rays.length; i++){
      this.rays[i].direction.rotateBy(movedY * this.mouseSensitivity, movedX * this.mouseSensitivity); // update raycasts
      this.rays[i].reset(this.x, this.y, this.z);
      
      if(this.rays[i].cast() != false){
        fill(255);
        square(this.positions[i*2], this.positions[(i*2)+1], this.resolution);
      }
      //fill(this.rays[i].direction.angleY * 200);
      //circle(this.positions[i*2], this.positions[(i*2)+1], this.resolution);
        
    }
  }
}

class vertex3D{
  constructor(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
    this.totalPos = createVector(this.x, this.y, this.z);
  }
  setPosition(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;
  }
  addPosition(x, y, z){
    this.x += x;
    this.y += y;
    this.z += z;
  }
  getPosition(type){
    if(type == undefined || type == "Vector") return this.totalPos;
    if(type == "Array") return [this.x, this.y, this.z];
  }
}

function createCube(x, y, z, w, h, l){
  let v1 = new vertex3D(x, y, z);
  let v2 = new vertex3D(x+w, y, z);
  let v3 = new vertex3D(x+w, y+h, z);
  let v4 = new vertex3D(x, y+h, z);
  let v5 = new vertex3D(x, y, z+l);
  let v6 = new vertex3D(x+w, y, z+l);
  let v7 = new vertex3D(x+w, y+h, z+l);
  let v8 = new vertex3D(x, y+h, z+l);
  let c = new object3D([v1, v2, v3, v4, v5, v6, v7, v8]);
  return c;
}

class object3D{
  constructor(vertecies){
    this.vertecies = vertecies;

    allObjects.push(this); // push into the all objects array
    
    // get the relative center of the object
    let minX = 10000;
    let minY = 10000;
    let minZ = 10000;
    let maxX = -10000;
    let maxY = -10000;
    let maxZ = -10000;

    for(let i = 0; i < this.vertecies.length; i++){
      // get min and max X positions
      if(this.vertecies[i].x < minX) minX = this.vertecies[i].x;
      if(this.vertecies[i].x > maxX) maxX = this.vertecies[i].x;
      // get min and max Y positions
      if(this.vertecies[i].y < minY) minY = this.vertecies[i].y;
      if(this.vertecies[i].y > maxY) maxY = this.vertecies[i].y;
      // get min and max Z positions
      if(this.vertecies[i].z < minZ) minZ = this.vertecies[i].z;
      if(this.vertecies[i].z > maxZ) maxZ = this.vertecies[i].z;
    }

    // define a bounds object
    this.bounds = new bounds3D(minX, minY, minZ, dist(minX, 0, maxX, 0), dist(minY, 0, maxY, 0), dist(minZ, 0, maxZ, 0));
    
    // get the center of the object
    this.centerX = minX + this.bounds.w/2;
    this.centerY = minY + this.bounds.h/2;
    this.centerZ = minZ+ this.bounds.l/2;
  }
  addPosition(x, y, z){
    for(let i = 0; i < this.lines.length; i++){
      this.lines[i].addPosition(x, y, z);
    }
  }
}

class bounds3D{
  constructor(x, y, z, w, h, l){
    // position
    this.x = x;
    this.y = y;
    this.z = z;
    // dimensions
    this.w = w;
    this.h = h;
    this.l = l;
  }
  isWithin(x, y, z){
    return (
      x > this.x && x < this.x + this.w &&
      y > this.y && y < this.y + this.h &&
      z > this.z && z < this.z + this.l
    );
  }
}

class raycast{
  constructor(startX, startY, startZ, stepSize, maxSteps, direction){
    // start position
    this.startX = startX;
    this.startY = startY;
    this.startZ = startZ;

    this.stepSize = stepSize; // the distance the ray will cover in one strp
    this.maxSteps = maxSteps; // the maximum length it will interact with objects
    this.direction = direction; // the direction the raycast moves
    this.possibleColisions = [];
  }
  reset(x, y, z){
    if(x == undefined){x=this.startX;y=this.startY;z=this.startZ;}
    // reset start pos
    this.startX = x;
    this.startY = y;
    this.startZ = z;
    
    // reset check pos
    this.checkX = x;
    this.checkY = y;
    this.checkZ = z;

  }
  getPossibleCollisions(){
    // check if going in the provided direction gets the ray any closer towards said object
    // If it does not, that object is "Behind" the ray and is not checked for colissions
    for(let i = 0; i < allObjects.length; i++){
      let d1 = dist3D(this.startX, this.startY, this.startZ, allObjects[i].centerX, allObjects[i].centerY, allObjects[i].centerZ);
      let d2 = dist3D(this.startX + this.direction.getX() * 5, this.startY + this.direction.getY() * 5, this.startZ + this.direction.getZ() * 5, allObjects[i].centerX, allObjects[i].centerY, allObjects[i].centerZ);
      if(d1 > d2) this.possibleColisions.push(allObjects[i]);
    }
  }
  cast(){
    let currentSteps = 0;
    //this.getPossibleCollisions();
    this.possibleColisions = allObjects;
    while(currentSteps < this.maxSteps){
      currentSteps++;
      this.step();
      for(let i = 0; i < this.possibleColisions.length; i++){
        // if it is even within the bounds of the object
        if(this.possibleColisions[i].bounds.isWithin(this.checkX, this.checkY, this.checkZ) == true){
          return true;
        }
      }
    }
    return false;
  }
  step(){
    this.checkX += this.direction.getX() * this.stepSize;
    this.checkY += this.direction.getY() * this.stepSize;
    this.checkZ += this.direction.getZ() * this.stepSize;
  }
}

class Direction{
  // angleZ is a head tilt, not useful in direction
  constructor(angleX, angleY){
    this.angleX = angleX;
    this.angleY = angleY;

    this.xRotation = createVector(1, 0);
    this.yRotation = createVector(1, 0);
    this.zRotation = createVector(0, 1); // rotated by y rotation, math maths
 
    // y rotation is "horizontal" and therefore affects the x and z directions
    this.xRotation.rotate(angleY);
    this.zRotation.rotate(angleY); 

    // rotate vertically "around" the x axis
    this.yRotation.rotate(angleX);
    //this.zRotation.rotate(angleX);

    // update total vector
    this.totalVector = createVector(this.xRotation.x, this.yRotation.x, this.zRotation.x);
  }
  rotateBy(angleX, angleY){
    this.angleX += angleX;
    this.angleY += angleY;

    if(this.angleX > TWO_PI) this.angleX = 0.01;
    if(this.angleY > TWO_PI) this.angleY = 0.01;
    if(this.angleX < 0) this.angleX = TWO_PI - 0.01;
    if(this.angleY < 0) this.angleY = TWO_PI - 0.01;
    
    // y rotation is "horizontal" and therefore affects the x and z directions
    this.xRotation.rotate(angleY);
    //this.zRotation.rotate(angleY); 

    // rotate vertically "around" the x axis
    this.yRotation.rotate(angleX);
    this.zRotation.rotate(angleX);

    // update total vector
    this.totalVector.x = this.xRotation.x;
    this.totalVector.y = this.yRotation.x;
    this.totalVector.z = this.zRotation.x;
  }
  getX(){
    return this.totalVector.x;
  }
  getY(){
    return this.totalVector.y;
  }
  getZ(){
    return this.totalVector.z;
  }
}

function dist3D(x, y, z, x2, y2, z2){
  return dist(x, 0, x2, 0) + dist(y, 0, y2) + dist(z, 0, z2, 0);
}