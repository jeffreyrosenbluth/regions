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
  public domainBL: Vec;
  public domainTR: Vec;
  public width: number;
  public height: number;
  public pos: Vec;
  public posFn: (p: Vec) => Vec;

  constructor(
    radius: number,
    color: Rgba,
    bottomLeft: Vec,
    topRight: Vec,
    domainBL: Vec,
    domainTR: Vec,
    posFn: (p: Vec) => Vec
  ) {
    this.radius = radius;
    this.color = color;
    this.bottomLeft = bottomLeft;
    this.topRight = topRight;
    this.domainBL = domainBL;
    this.domainTR = domainTR;
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
    if (this.pos.x < this.domainBL.x + this.radius) {
      this.pos.x = this.domainTR.x - this.radius;
    }
    if (this.pos.x > this.domainTR.x - this.radius) {
      this.pos.x = this.domainBL.x + this.radius;
    }
    if (this.pos.y > this.domainBL.y - this.radius) {
      this.pos.y = this.domainTR.y + this.radius;
    }
    if (this.pos.y < this.domainTR.y + this.radius) {
      this.pos.y = this.domainBL.y - this.radius;
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

// Particle position functions -------------------------------------------------------
const simplePosFn = (p: Vec) =>
  p.add(new Vec(3 * (0.5 - Math.random()), 3 * (0.5 - Math.random())));

const cosPosFnY = (p: Vec) => p.add(new Vec(1, Math.cos(p.x / 100)));
const cosPosFnX = (p: Vec) => p.add(new Vec(Math.cos(p.y / 100), 1));
const cosPosFnXY = (p: Vec) =>
  p.add(new Vec(Math.cos(p.y / 100), Math.cos(p.x / 100)));

const horizontalPosFn = (p: Vec) => p.add(new Vec(1, 0));
const verticalPosFn = (p: Vec) => p.add(new Vec(0, 1));

const tDist = new StudentTDistribution(1.25);
const studenttPosFn = (p: Vec) =>
  p.add(new Vec(0.75 * tDist.sample(), 0.75 * tDist.sample()));
// -----------------------------------------------------------------------------------

type Region = {
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  w?: number;
  h?: number;
  dw?: number;
  dh?: number;
  radius?: number;
  count?: number;
  color?: Rgba;
  posFn?: (p: Vec) => Vec;
};

function region(
  {
    x = 0,
    y = 300,
    dx = x,
    dy = y,
    w = 500,
    h = 300,
    dw = w,
    dh = h,
    radius = 1,
    count = 1000,
    color = white(0.75),
    posFn = simplePosFn,
  }: Region = {},
  free: boolean = false
): Particle[] {
  let particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    let bottomLeft = new Vec(x, y);
    let topRight = new Vec(x + w, y - h);
    let domainBL = free ? new Vec(0, canvasSize.y) : new Vec(dx, dy);
    let domainTR = free ? new Vec(canvasSize.x, 0) : new Vec(dx + dw, dy - dh);
    particles.push(
      new Particle(
        radius,
        color,
        bottomLeft,
        topRight,
        domainBL,
        domainTR,
        posFn
      )
    );
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
  ctx.fillStyle = new Rgba(0, 0, 0, 0.05).color();
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

  for (let p of particles) {
    p.update();
    p.draw();
  }
  window.requestAnimationFrame(() => draw(particles));
}

function blue(opacity: number) {
  return new Rgba(40, 125, 240, opacity);
}

function white(opacity: number) {
  return new Rgba(255, 255, 255, opacity);
}

function setup() {
  if (!ctx || !canvas) {
    return;
  }
  resizeCanvas();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

  const swirlRegion = region({
    x: 200,
    y: 800,
    w: 600,
    h: 600,
    radius: 2,
    color: white(0.35),
    count: 3000,
    posFn: cosPosFnXY,
  });

  const ps2 = region(
    {
      x: 500,
      y: 400,
      w: 600,
      h: 50,
      radius: 3,
      count: 1000,
    },
    true
  );

  const ps2a = region(
    {
      x: 450,
      y: 600,
      w: 600,
      h: 60,
      radius: 1,
      color: white(1),
      count: 3000,
      posFn: horizontalPosFn,
    },
    true
  );

  const ps2b = region({
    x: 550,
    y: 1050,
    w: 600,
    h: 50,
    radius: 1,
    color: white(0.75),
    count: 1000,
    posFn: verticalPosFn,
  });

  const ps2c = region(
    {
      x: 600,
      y: 1099,
      w: 600,
      h: 50,
      radius: 1,
      color: white(1),
      count: 500,
      posFn: verticalPosFn,
    },
    true
  );

  const bgRegion = region(
    {
      x: 0,
      y: canvasSize.y,
      w: canvasSize.x,
      h: canvasSize.y,
      radius: 1.5,
      color: white(1),
      count: 500,
      posFn: cosPosFnY,
    },
    true
  );

  const jitterRegionA = region({
    x: 600,
    y: 550,
    w: 400,
    h: 400,
    radius: 4.0,
    color: white(0.8),
    count: 1000,
    posFn: studenttPosFn,
  });

  const jitterRegionB = region({
    x: 650,
    y: 500,
    w: 650,
    h: 450,
    radius: 1.5,
    color: white(0.25),
    count: 5000,
    posFn: cosPosFnX,
  });

  const ps5 = region(
    {
      x: 300,
      y: 900,
      w: 50,
      h: 800,
      radius: 1.5,
      color: white(0.5),
      count: 2500,
    },
    true
  );
  const ps6 = region(
    {
      x: 250,
      y: 900,
      w: 800,
      h: 50,
      radius: 1.5,
      color: white(0.7),
      count: 3000,
      posFn: cosPosFnXY,
    },
    true
  );

  const ps6a = region({
    x: 250,
    y: 900,
    w: 800,
    h: 50,
    radius: 1.5,
    color: white(0.7),
    count: 3000,
    posFn: cosPosFnXY,
  });

  const cornerRegion = region(
    {
      x: 50,
      y: 1225,
      w: 350,
      h: 350,
      color: white(0.5),
      count: 3000,
      posFn: horizontalPosFn,
    },
    true
  );

  const ps = [
    ...swirlRegion,
    ...ps2,
    ...ps2a,
    ...ps2b,
    ...ps2c,
    ...bgRegion,
    ...jitterRegionA,
    ...jitterRegionB,
    ...ps5,
    ...ps6,
    ...ps6a,
    ...cornerRegion,
  ];

  window.addEventListener("resize", () => resizeCanvas());
  window.requestAnimationFrame(() => draw(ps));
}

setup();
