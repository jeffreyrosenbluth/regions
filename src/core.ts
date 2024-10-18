import { Vec } from "./vec";
import { StudentTDistribution } from "./studentt";

export type Region = {
  visible: boolean;
  bottomLeft: { x: number; y: number };
  size: { x: number; y: number };
  domain: string;
  radius: number;
  count: number;
  posFn: string;
  direction: { x: number; y: number };
  color: string;
};

// Particle position functions -------------------------------------------------------
const simplePosFn = (p: Vec) =>
  p.add(new Vec(3 * (0.5 - Math.random()), 3 * (0.5 - Math.random())));

const stillPosFn = (p: Vec) => p;

const cosPosFnY = (p: Vec) => p.add(new Vec(1, Math.cos(p.x / 100)));
const cosPosFnX = (p: Vec) => p.add(new Vec(Math.cos(p.y / 100), 1));
const cosPosFnXY = (p: Vec) =>
  p.add(new Vec(Math.cos(p.y / 100), Math.cos(p.x / 100)));

const tDist = new StudentTDistribution(1.25);
const studenttPosFn = (p: Vec) =>
  p.add(new Vec(0.75 * tDist.sample(), 0.75 * tDist.sample()));

function dirPosFn(x: number, y: number) {
  let dir = new Vec(x, y);
  return (p: Vec) => p.add(dir);
}
// -----------------------------------------------------------------------------------

export const direction = (posFn: string, dir: { x: number; y: number }) => {
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
      return dirPosFn(dir.x, dir.y);
    default:
      return stillPosFn;
  }
};
