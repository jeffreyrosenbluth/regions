import { Vec } from "./vec";
import { StudentTDistribution } from "./studentt";
import { createNoise2D } from "./simplex";

export type RegionSettings = {
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

const noise = createNoise2D({ random_dec: Math.random });

const simplexPosFn = (p: Vec) => {
  const scale = 0.02;
  const mag = 1.5;
  const j = Math.random();
  const jumpx = j < 0.1 ? 40 * (Math.random() - 0.5) : 0;
  const jumpy = j < 0.1 ? 40 * (Math.random() - 0.5) : 0;
  const noiseValX = jumpx + mag * noise(scale * p.x, scale * p.y);
  const noiseValY =
    jumpy + mag * noise(scale * p.x + 3.117, scale * p.y + 2.713);
  return p.add(new Vec(noiseValX, noiseValY));
};

// const simplexPosFn1 = (p: Vec) => {
//     angle += rotationSpeed;

//     let x = p.x - width / 2;
//     let y = p.y - height / 2;

// Apply rotation to the coordinates
//     let rotatedX = x * cos(angle) - y * sin(angle);
//     let rotatedY = x * sin(angle) + y * cos(angle);

// Get flow field direction from rotated Perlin noise space
//     let noiseValue = noise(rotatedX * noiseScale, rotatedY * noiseScale);
//     let flowAngle = noiseValue * TWO_PI * 4;

//       // Update particle position
//     particle.x += cos(flowAngle);
//     particle.y += sin(flowAngle);

//     // Wrap around edges
//     particle.x = (particle.x + width) % width;
//     particle.y = (particle.y + height) % height;
// }

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
    case "simplex":
      return simplexPosFn;
    default:
      return stillPosFn;
  }
};

export class Region {
  public radius: number;
  public color: string;
  public bottomLeft: Vec;
  public topRight: Vec;
  public domainBL: Vec;
  public domainTR: Vec;
  public width: number;
  public height: number;
  public count: number;
  public positions: Vec[];
  public posFn: (p: Vec) => Vec;

  constructor(
    radius: number,
    color: string,
    bottomLeft: Vec,
    topRight: Vec,
    domainBL: Vec,
    domainTR: Vec,
    count: number,
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
    this.count = count;
    this.positions = Array.from(
      { length: count },
      () =>
        new Vec(
          bottomLeft.x + this.width * Math.random(),
          topRight.y + this.height * Math.random()
        )
    );
    this.posFn = posFn;
  }

  static emptyRegion(): Region {
    return new Region(
      0,
      "black",
      new Vec(0, 0),
      new Vec(0, 0),
      new Vec(0, 0),
      new Vec(0, 0),
      0,
      simplePosFn
    );
  }

  update() {
    this.positions.forEach((pos, index) => {
      this.positions[index] = this.posFn(pos);

      if (this.positions[index].x < this.domainBL.x + this.radius) {
        this.positions[index].x = this.domainTR.x - this.radius;
      }
      if (this.positions[index].x > this.domainTR.x - this.radius) {
        this.positions[index].x = this.domainBL.x + this.radius;
      }
      if (this.positions[index].y > this.domainBL.y - this.radius) {
        this.positions[index].y = this.domainTR.y + this.radius;
      }
      if (this.positions[index].y < this.domainTR.y + this.radius) {
        this.positions[index].y = this.domainBL.y - this.radius;
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let pos of this.positions) {
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.ellipse(pos.x, pos.y, this.radius, this.radius, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
