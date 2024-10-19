import "./style.css";
import { Vec } from "./vec";
import { Particle, ParticleBox, Region, direction } from "./core";
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
  let debug = false;

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
    bly: canvasSize.y,
    sizew: canvasSize.x,
    sizeh: canvasSize.y,
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
      max: canvasSize.x,
    });
    f.addBinding(folderControls, "bly", {
      label: "Bottom Left Y",
      min: 0,
      max: canvasSize.y,
    });
    f.addBinding(folderControls, "sizew", {
      label: "Width",
      min: 0,
      max: canvasSize.x,
    });
    f.addBinding(folderControls, "sizeh", {
      label: "Height",
      min: 0,
      max: canvasSize.y,
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

  const reDraw = () => {
    if (id) cancelAnimationFrame(id);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);
    let ps = folders.map((f) => particleBox(f, canvasSize));
    draw(ps, ctx, canvasSize, debug);
  };

  pane.on("change", (ev) => {
    if (ev.last) {
      reDraw();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "v") {
      const allVisible = folders.every((folder) => folder.visible);
      toggleAllFoldersVisible(!allVisible); // Toggle based on current state
    } else if (event.key === "c") {
      toggleGuiVisibility();
    } else if (event.key === "-") {
      shrinkAllRegions();
    } else if (event.key === "d") {
      debug = !debug;
      reDraw();
    }
  });

  function shrinkAllRegions() {}

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

function particleBox(r: Region, canvasSize: Vec): ParticleBox {
  if (!r.visible) return { particles: [], x: 0, y: 0, width: 0, height: 0 };
  let particles: Particle[] = [];
  const bl = new Vec(r.blx, r.bly);
  const tr = new Vec(r.blx + r.sizew, r.bly - r.sizeh);
  for (let i = 0; i < r.count; i++) {
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
  return {
    particles: particles,
    x: bl.x,
    y: bl.y,
    width: r.sizew,
    height: r.sizeh,
  };
}

function draw(
  particles: ParticleBox[],
  ctx: CanvasRenderingContext2D,
  canvasSize: Vec,
  debug: boolean
) {
  ctx.fillStyle = "#00000009";
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

  for (let particleBox of particles) {
    if (debug) {
      ctx.strokeStyle = "red";
      ctx.strokeRect(
        particleBox.x,
        particleBox.y - particleBox.height,
        particleBox.width,
        particleBox.height
      );
    }
    for (let p of particleBox.particles) {
      p.update();
      p.draw(ctx);
    }
  }
  id = window.requestAnimationFrame(() =>
    draw(particles, ctx, canvasSize, debug)
  );
}

setup();
