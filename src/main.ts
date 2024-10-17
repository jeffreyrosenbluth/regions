import "./style.css";
import { Vec } from "./vec";
import { StudentTDistribution } from "./studentt";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

document.body.appendChild(canvas);

let canvasSize: Vec;

class Rgba {
  // A color with red, green, blue, and alpha components. r, g, and b are in [0, 255].
  // a is in [0, 1].
  constructor(
    public r: number = 0,
    public g: number = 0,
    public b: number = 255,
    public a: number = 1
  ) {}

  color() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  setAlpha(a: number) {
    this.a = a;
  }

  random() {
    this.r = Math.floor(Math.random() * 200 + 55);
    this.g = Math.floor(Math.random() * 200 + 55);
    this.b = Math.floor(Math.random() * 200 + 55);
  }
}

class Particle {
  public radius: number;
  public color: Rgba;
  public bottomLeft: Vec;
  public topRight: Vec;
  public width: number;
  public height: number;
  public pos: Vec;
  public posFn: (p: Vec) => Vec;

  constructor(
    radius: number,
    color: Rgba,
    bottomLeft: Vec,
    topRight: Vec,
    posFn: (p: Vec) => Vec
  ) {
    this.radius = radius;
    this.color = color;
    this.bottomLeft = bottomLeft;
    this.topRight = topRight;
    this.width = topRight.x - bottomLeft.x;
    this.height = -topRight.y + bottomLeft.y;
    this.pos = new Vec(
      bottomLeft.x + this.width * Math.random(),
      topRight.y + this.height * Math.random()
    );
    this.posFn = posFn;
  }

  update() {
    this.pos = this.posFn(this.pos);
    if (this.pos.x < this.bottomLeft.x + this.radius) {
      this.pos.x = this.topRight.x - this.radius;
    }
    if (this.pos.x > this.topRight.x - this.radius) {
      this.pos.x = this.bottomLeft.x + this.radius;
    }
    if (this.pos.y > this.bottomLeft.y - this.radius) {
      this.pos.y = this.topRight.y + this.radius;
    }
    if (this.pos.y < this.topRight.y + this.radius) {
      this.pos.y = this.bottomLeft.y - this.radius;
    }
  }

  draw() {
    if (!ctx) return;
    ctx.beginPath();
    ctx.fillStyle = this.color.color();
    ctx.ellipse(
      this.pos.x,
      this.pos.y,
      this.radius,
      this.radius,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

// Particle position functions -----------------------------------------------------
const simplePosFn = (p: Vec) =>
  p.add(new Vec(3 * (0.5 - Math.random()), 3 * (0.5 - Math.random())));

const cosPosFnY = (p: Vec) => p.add(new Vec(0, Math.cos(p.x / 100)));
const cosPosFnX = (p: Vec) => p.add(new Vec(Math.cos(p.y / 100), 0));
const cosPosFnXY = (p: Vec) =>
  p.add(new Vec(Math.cos(p.y / 100), Math.cos(p.x / 100)));

const horizontalPosFn = (p: Vec) => p.add(new Vec(1, 0));
const verticalPosFn = (p: Vec) => p.add(new Vec(0, 1));

const tDist = new StudentTDistribution(1.25);
const studenttPosFn = (p: Vec) =>
  p.add(new Vec(Math.abs(tDist.sample()), Math.abs(tDist.sample())));
// -----------------------------------------------------------------------------------

type Region = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  radius?: number;
  count?: number;
  color?: Rgba;
  posFn?: (p: Vec) => Vec;
};

function region({
  x = 0,
  y = 300,
  w = 500,
  h = 300,
  radius = 1,
  count = 1000,
  color = white(0.75),
  posFn = simplePosFn,
}: Region = {}): Particle[] {
  let particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let bottomLeft = new Vec(x, y);
    let topRight = new Vec(x + w, y - h);
    particles.push(new Particle(radius, color, bottomLeft, topRight, posFn));
  }
  return particles;
}

function resizeCanvas() {
  if (!canvas || !ctx) {
    return;
  }
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  canvas.width = Math.floor(windowWidth * window.devicePixelRatio);
  canvas.height = Math.floor(windowHeight * window.devicePixelRatio);

  canvas.style.width = windowWidth + "px";
  canvas.style.height = windowHeight + "px";

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  canvasSize = new Vec(windowWidth, windowHeight);
}

function draw(particles: Particle[]) {
  if (!ctx) return;
  ctx.fillStyle = "black  ";
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

  for (let p of particles) {
    p.update();
    p.draw();
  }
  window.requestAnimationFrame(() => draw(particles));
}

function pink(opacity: number) {
  return new Rgba(255, 105, 180, opacity);
}

function white(opacity: number) {
  return new Rgba(255, 255, 255, opacity);
}

function setup() {
  if (!ctx || !canvas) {
    return;
  }
  resizeCanvas();

  const ps1 = region({
    x: 200,
    y: 800,
    w: 600,
    h: 600,
    radius: 2,
    color: white(0.35),
    count: 3000,
    posFn: cosPosFnXY,
  });

  const ps2 = region({
    x: 500,
    y: 400,
    w: 600,
    h: 50,
    radius: 1,
    color: white(1),
    count: 3000,
  });

  const ps2a = region({
    x: 450,
    y: 600,
    w: 600,
    h: 60,
    radius: 1,
    color: white(1),
    count: 3000,
    posFn: verticalPosFn,
  });

  const ps2b = region({
    x: 550,
    y: 1050,
    w: 600,
    h: 50,
    radius: 1,
    color: white(1),
    count: 3000,
    posFn: simplePosFn,
  });

  const ps3 = region({
    x: 0,
    y: canvasSize.y,
    w: canvasSize.x,
    h: canvasSize.y,
    radius: 3.5,
    color: white(1),
    count: 500,
    posFn: cosPosFnX,
  });

  const ps3a = region({
    x: 0,
    y: canvasSize.y,
    w: canvasSize.x,
    h: canvasSize.y,
    radius: 1.0,
    color: white(1),
    count: 1500,
  });

  const ps4 = region({
    x: 650,
    y: 500,
    w: 400,
    h: 400,
    radius: 3.0,
    color: pink(1),
    count: 500,
    posFn: studenttPosFn,
  });

  const ps5 = region({
    x: 300,
    y: 900,
    w: 50,
    h: 800,
    radius: 1.5,
    color: pink(0.5),
    count: 2500,
  });
  const ps6 = region({
    x: 300,
    y: 900,
    w: 800,
    h: 50,
    color: pink(0.5),
    count: 2500,
    posFn: cosPosFnXY,
  });

  const ps7 = region({
    x: 50,
    y: 1250,
    w: 350,
    h: 350,
    color: white(0.5),
    count: 2500,
    posFn: horizontalPosFn,
  });

  const ps = [
    ...ps1,
    ...ps2,
    ...ps2a,
    ...ps2b,
    ...ps3,
    ...ps3a,
    ...ps4,
    ...ps5,
    ...ps6,
    ...ps7,
  ];

  window.addEventListener("resize", () => resizeCanvas());
  window.requestAnimationFrame(() => draw(ps));
}

setup();
