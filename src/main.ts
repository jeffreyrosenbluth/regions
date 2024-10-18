import "./style.css";
import { Vec } from "./vec";
import { StudentTDistribution } from "./studentt";
import { Region } from "./core";
import { Pane } from "tweakpane";

let id: number | undefined;

function setup() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx || !canvas) {
    return;
  }

  function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    canvas.width = Math.floor(windowWidth * window.devicePixelRatio);
    canvas.height = Math.floor(windowHeight * window.devicePixelRatio);

    canvas.style.width = windowWidth + "px";
    canvas.style.height = windowHeight + "px";

    if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    return new Vec(windowWidth, windowHeight);
  }
  const canvasSize = resizeCanvas();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);
  const pane = new Pane({
    container: document.getElementById("container") || undefined,
    title: "Controls",
  });

  if (pane.element) {
    pane.element.style.width = "270px"; // Set your desired width here
  }

  const CONTROLS: Region = {
    visible: false,
    bottomLeft: { x: 0, y: 250 },
    size: { x: 250, y: 250 },
    domain: "constrained",
    radius: 1,
    count: 500,
    posFn: "simple",
    direction: { x: 1, y: 0 },
    color: "#FFFFFFFF",
  };

  const folders: Region[] = Array(17)
    .fill(null)
    .map(() => ({
      ...CONTROLS,
      bottomLeft: { ...CONTROLS.bottomLeft },
      size: { ...CONTROLS.size },
      direction: { ...CONTROLS.direction },
    }));

  folders.forEach((folderControls, i) => {
    let f = pane.addFolder({
      title: `Region ${i}`,
      expanded: false,
    });

    f.addBinding(folderControls, "visible", { label: "Visible" });
    f.addBinding(folderControls, "bottomLeft", {
      label: "Bottom Left",
      picker: "inline",
      x: { min: 0, max: window.innerWidth },
      y: { min: 0, max: window.innerHeight },
    });
    f.addBinding(folderControls, "size", {
      label: "Size",
      picker: "inline",
      x: { min: 0, max: window.innerWidth },
      y: { min: 0, max: window.innerHeight },
    });
    f.addBinding(folderControls, "domain", {
      label: "Domain",
      options: {
        Constrained: "constrained",
        Free: "free",
      },
    });
    f.addBinding(folderControls, "radius", {
      label: "Radius",
      min: 0,
      max: 10,
    });
    f.addBinding(folderControls, "count", {
      label: "Count",
      step: 50,
      min: 0,
      max: 10000,
    });
    f.addBinding(folderControls, "posFn", {
      label: "Movement",
      options: {
        Still: "still",
        Simple: "simple",
        StudentT: "studentt",
        CosY: "cosY",
        CosX: "cosX",
        CosXY: "cosXY",
        Direction: "direction",
      },
    });
    f.addBinding(folderControls, "direction", {
      label: "Direction",
      picker: "inline",
      x: { min: -5, max: 5 },
      y: { min: -5, max: 5 },
    });
    f.addBinding(folderControls, "color", { label: "Color", picker: "inline" });
  });

  document.body.appendChild(canvas);

  pane.on("change", () => {
    if (id) cancelAnimationFrame(id);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);
    let ps = folders.flatMap((f) => particleBox(f, canvasSize));
    draw(ps, ctx, canvasSize);
  });

  window.addEventListener("resize", () => resizeCanvas());
}

function direction(posFn: string, dir: { x: number; y: number }) {
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
}

class Particle {
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
    // if (!ctx) return;
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

function particleBox(r: Region, canvasSize: Vec): Particle[] {
  if (!r.visible) return [];
  let particles: Particle[] = [];
  for (let i = 0; i < r.count; i++) {
    const bl = new Vec(r.bottomLeft.x, r.bottomLeft.y);
    const tr = new Vec(r.bottomLeft.x + r.size.x, r.bottomLeft.y - r.size.y);
    particles.push(
      new Particle(
        r.radius,
        r.color,
        bl,
        tr,
        r.domain === "free" ? new Vec(0, canvasSize.y) : bl,
        r.domain === "free" ? new Vec(canvasSize.x, 0) : tr,
        direction(r.posFn, r.direction)
      )
    );
  }
  return particles;
}

function draw(
  particles: Particle[],
  ctx: CanvasRenderingContext2D,
  canvasSize: Vec
) {
  ctx.fillStyle = "#00000013";
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

  for (let p of particles) {
    p.update();
    p.draw(ctx);
  }
  id = window.requestAnimationFrame(() => draw(particles, ctx, canvasSize));
}

// const swirlRegion = region({
//   x: 300,
//   y: 890,
//   w: 600,
//   h: 600,
//   radius: 2,
//   color: "white",
//   count: 3000,
//   posFn: cosPosFnXY,
// });

// const ps2 = region(
//   {
//     x: 500,
//     y: 400,
//     w: 600,
//     h: 75,
//     radius: 3,
//     count: 400,
//     posFn: dirPosFn(1, 0),
//   },
//   true
// );

// const ps2b = region(
//   {
//     x: 550,
//     y: 1060,
//     w: 600,
//     h: 100,
//     radius: 1.5,
//     color: "white",
//     count: 1000,
//     posFn: dirPosFn(-1, 0),
//   },
//   true
// );

// const ps2c = region(
//   {
//     x: 600,
//     y: 1099,
//     w: 600,
//     h: 50,
//     radius: 1,
//     color: "white",
//     count: 500,
//     posFn: dirPosFn(0, -1),
//   },
//   true
// );

// const bgRegion = region(
//   {
//     x: 0,
//     y: canvasSize.y,
//     w: canvasSize.x,
//     h: canvasSize.y,
//     radius: 1.5,
//     color: "white",
//     count: 700,
//     posFn: stillPosFn,
//   },
//   true
// );

// const jitterRegionA = region({
//   x: 0,
//   y: 450,
//   w: 450,
//   h: 450,
//   radius: 6.0,
//   color: "white",
//   count: 250,
//   posFn: studenttPosFn,
// });

// const jitterRegionB = region({
//   x: 650,
//   y: 500,
//   w: 650,
//   h: 450,
//   radius: 0.5,
//   color: "white",
//   count: 5000,
//   posFn: cosPosFnX,
// });

// const ps5 = region(
//   {
//     x: 300,
//     y: 900,
//     w: 50,
//     h: 800,
//     radius: 1.5,
//     color: "white",
//     count: 2500,
//   },
//   true
// );
// const ps6 = region(
//   {
//     x: 250,
//     y: 950,
//     w: 800,
//     h: 50,
//     radius: 1.0,
//     color: "white",
//     count: 3000,
//     posFn: cosPosFnXY,
//   },
//   true
// );

// const ps6a = region({
//   x: 250,
//   y: 950,
//   w: 800,
//   h: 50,
//   radius: 1.5,
//   color: "white",
//   count: 500,
//   posFn: cosPosFnXY,
// });

// const cornerRegion = region({
//   x: 50,
//   y: 1225,
//   w: 350,
//   h: 350,
//   color: "white",
//   count: 3000,
//   posFn: dirPosFn(1, -0.25),
// });

// const ps = [
//   ...swirlRegion,
//   ...ps2,
//   ...ps2b,
//   ...ps2c,
//   ...bgRegion,
//   ...jitterRegionA,
//   ...jitterRegionB,
//   ...ps5,
//   ...ps6,
//   ...ps6a,
//   ...cornerRegion,
// ];

setup();
