import "./style.css";
import { Vec } from "./vec";
import { Region, direction } from "./core";
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
    pane.element.style.width = "280px"; // Set your desired width here
  }

  const CONTROLS: Region = {
    visible: false,
    blx: 0,
    bly: 0,
    sizew: canvasSize.x / 4,
    sizeh: canvasSize.y / 4,
    domain: "constrained",
    radius: 1,
    count: 1000,
    posFn: "simple",
    dirx: 1,
    diry: 0,
    color: "#FFFFFFFF",
  };

  const dirs = ["simple", "cosY", "studentt", "cosX", "direction", "cosXY"];

  let folders: Region[] = Array(16)
    .fill(null)
    .map((_, index) => ({
      ...CONTROLS,
      blx: (canvasSize.x / 4) * (index % 4),
      bly: (canvasSize.y / 4) * Math.floor(1 + index / 4),
      posFn: dirs[index % dirs.length],
      dirx: 1,
      diry: 0,
    }));

  folders.unshift({
    ...CONTROLS,
    blx: 0,
    bly: window.innerHeight,
    sizew: window.innerWidth,
    sizeh: window.innerHeight,
    posFn: "still",
    radius: 1.5,
  });

  folders.forEach((folderControls, i) => {
    let f = pane.addFolder({
      title: i === 0 ? "Background" : `Region ${i}`,
      expanded: false,
    });

    f.addBinding(folderControls, "visible", { label: "Visible" });
    f.addBinding(folderControls, "blx", {
      label: "Bottom Left X",
      min: 0,
      max: window.innerWidth,
    });
    f.addBinding(folderControls, "bly", {
      label: "Bottom Left Y",
      min: 0,
      max: window.innerWidth,
    });
    f.addBinding(folderControls, "sizew", {
      label: "Width",
      min: 0,
      max: window.innerWidth,
    });
    f.addBinding(folderControls, "sizeh", {
      label: "Height",
      min: 0,
      max: window.innerHeight,
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
      step: 0.5,
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
    f.addBinding(folderControls, "dirx", {
      label: "Direction X",
      min: -5,
      max: 5,
    });
    f.addBinding(folderControls, "diry", {
      label: "Direction Y",
      min: -5,
      max: 5,
    });
    f.addBinding(folderControls, "color", { label: "Color", picker: "inline" });
  });

  toggleGuiVisibility();

  document.body.appendChild(canvas);

  pane.on("change", (ev) => {
    if (ev.last) {
      if (id) cancelAnimationFrame(id);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);
      let ps = folders.flatMap((f) => particleBox(f, canvasSize));
      draw(ps, ctx, canvasSize);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "v") {
      const allVisible = folders.every((folder) => folder.visible);
      toggleAllFoldersVisible(!allVisible); // Toggle based on current state
    } else if (event.key === "c") {
      toggleGuiVisibility();
    }
  });

  function toggleAllFoldersVisible(visible: boolean) {
    folders.forEach((folder) => {
      folder.visible = visible; // Set visible field to true/false
    });
    pane.refresh(); // Refreshes the UI to reflect the changes
  }

  function toggleGuiVisibility() {
    const paneElement = pane.element;
    if (paneElement.style.display === "none") {
      paneElement.style.display = "block"; // Show the pane
    } else {
      paneElement.style.display = "none"; // Hide the pane
    }
  }
  window.addEventListener("resize", () => resizeCanvas());
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

function particleBox(r: Region, canvasSize: Vec): Particle[] {
  if (!r.visible) return [];
  let particles: Particle[] = [];
  for (let i = 0; i < r.count; i++) {
    const bl = new Vec(r.blx, r.bly);
    const tr = new Vec(r.blx + r.sizew, r.bly - r.sizeh);
    particles.push(
      new Particle(
        r.radius,
        r.color,
        bl,
        tr,
        r.domain === "free" ? new Vec(0, canvasSize.y) : bl,
        r.domain === "free" ? new Vec(canvasSize.x, 0) : tr,
        direction(r.posFn, r.dirx, r.diry)
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
  ctx.fillStyle = "#00000009";
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

  for (let p of particles) {
    p.update();
    p.draw(ctx);
  }
  id = window.requestAnimationFrame(() => draw(particles, ctx, canvasSize));
}

setup();
