import "./style.css";
import { Vec } from "./vec";
import { Region, RegionSettings, direction } from "./core";
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
    pane.element.style.width = "280px";
  }

  const CONTROLS: RegionSettings = {
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

  let folders: RegionSettings[] = Array(16)
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
      step: 1,
      min: 0,
      max: canvasSize.x,
    });
    f.addBinding(folderControls, "bly", {
      label: "Bottom Left Y",
      step: 1,
      min: 0,
      max: canvasSize.y,
    });
    f.addBinding(folderControls, "sizew", {
      label: "Width",
      step: 1,
      min: 0,
      max: canvasSize.x,
    });
    f.addBinding(folderControls, "sizeh", {
      label: "Height",
      step: 1,
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
      step: 0.1,
      min: -5,
      max: 5,
    });
    f.addBinding(folderControls, "diry", {
      label: "Direction Y",
      step: 0.1,
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
    let ps = folders.map((f) => region(f, canvasSize));
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
      resizeAllRegions();
      reDraw();
    } else if (event.key === "=") {
      resizeAllRegions(true);
      reDraw();
    } else if (event.key === "ArrowRight") {
      moveAllRegions(5, 0);
      reDraw();
    } else if (event.key === "ArrowLeft") {
      moveAllRegions(-5, 0);
      reDraw();
    } else if (event.key === "ArrowUp") {
      moveAllRegions(0, -5);
      reDraw();
    } else if (event.key === "ArrowDown") {
      moveAllRegions(0, 5);
      reDraw();
    } else if (event.key === "d") {
      debug = !debug;
      reDraw();
    }
  });

  function resizeAllRegions(expand = false) {
    const w = expand ? 5 : -5;
    const h = expand ? 5 : -5;
    folders.forEach((folder) => {
      if (folder.visible) {
        folder.sizew = folder.sizew + w;
        folder.sizeh = folder.sizeh + h;
      }
    });
  }

  function moveAllRegions(right: number, up: number) {
    folders.forEach((folder) => {
      if (folder.visible) {
        folder.blx = folder.blx + right;
        folder.bly = folder.bly + up;
      }
    });
  }

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

function region(r: RegionSettings, canvasSize: Vec): Region {
  if (!r.visible) return Region.emptyRegion();
  const bl = new Vec(r.blx, r.bly);
  const tr = new Vec(r.blx + r.sizew, r.bly - r.sizeh);
  const blDomain = r.domain === "free" ? new Vec(0, canvasSize.y) : bl;
  const trDomain = r.domain === "free" ? new Vec(canvasSize.x, 0) : tr;
  return new Region(
    r.radius,
    r.color,
    bl,
    tr,
    blDomain,
    trDomain,
    r.count,
    direction(r.posFn, r.dirx, r.diry)
  );
}

function draw(
  regions: Region[],
  ctx: CanvasRenderingContext2D,
  canvasSize: Vec,
  debug: boolean
) {
  ctx.fillStyle = "#00000009";
  ctx.fillRect(0, 0, canvasSize.x, canvasSize.y);

  for (let region of regions) {
    if (debug) {
      ctx.strokeStyle = "red";
      ctx.strokeRect(
        region.bottomLeft.x,
        region.bottomLeft.y - region.height,
        region.width,
        region.height
      );
    }
    region.update();
    region.draw(ctx);
  }
  id = window.requestAnimationFrame(() =>
    draw(regions, ctx, canvasSize, debug)
  );
}

setup();
