import { Vec } from "./vec";
import { StudentTDistribution } from "./studentt";

export type Region = {
  visible: boolean;
  blx: number;
  bly: number;
  sizew: number;
  sizeh: number;
  domain: string;
  radius: number;
  count: number;
  posFn: string;
  dirx: number;
  diry: number;
  color: string;
};

// Particle position functions -------------------------------------------------
const simplePosFn = (p: Vec) =>
  p.add(new Vec(3 * (0.5 - Math.random()), 3 * (0.5 - Math.random())));

const stillPosFn = (p: Vec) => p;

const cosPosFnY = (p: Vec) => p.add(new Vec(1, Math.cos(p.x / 100)));
const cosPosFnX = (p: Vec) => p.add(new Vec(Math.cos(p.y / 100), 1));
const cosPosFnXY = (p: Vec) =>
  p.add(new Vec(Math.cos(p.y / 100), Math.cos(p.x / 100)));

const tDist = new StudentTDistribution(1.25);
const studenttPosFn = (p: Vec) =>
  p.add(new Vec(tDist.sample(), tDist.sample()));

function dirPosFn(x: number, y: number) {
  let dir = new Vec(x, y);
  return (p: Vec) => p.add(dir);
}

export const direction = (posFn: string, x: number, y: number) => {
  switch (posFn) {
    case "still":
      return stillPosFn;
    case "simple":
      return simplePosFn;
    case "studentt":
      return studenttPosFn;
    case "cosY":
      return cosPosFnY;
    case "cosX":
      return cosPosFnX;
    case "cosXY":
      return cosPosFnXY;
    case "direction":
      return dirPosFn(x, y);
    default:
      return stillPosFn;
  }
};

export class Particle {
  public radius: number;
  public color: string;
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
    color: string,
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

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
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

export type ParticleBox = {
  particles: Particle[];
  x: number;
  y: number;
  width: number;
  height: number;
};
