import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { BOX_PRESETS, COLORS, COMPONENTS, MONITOR_CABLE_PASS, MONITORS, PANEL_FEATURES } from "./config.js";

const viewer = document.querySelector("#viewer");
const presetSelect = document.querySelector("#preset");
const monitorSelect = document.querySelector("#monitor");
const explodeToggle = document.querySelector("#explode");
const showLabelsToggle = document.querySelector("#show-labels");
const showWiresToggle = document.querySelector("#show-wires");
const showReadoutToggle = document.querySelector("#show-readout");
const orbitUpButton = document.querySelector("#orbit-up");
const orbitLeftButton = document.querySelector("#orbit-left");
const orbitResetButton = document.querySelector("#orbit-reset");
const orbitRightButton = document.querySelector("#orbit-right");
const orbitDownButton = document.querySelector("#orbit-down");
const autoRotateToggle = document.querySelector("#auto-rotate");
const readout = document.querySelector("#readout");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15191f);

const camera = new THREE.PerspectiveCamera(42, 1, 1, 3000);
camera.up.set(0, 0, 1);
camera.position.set(520, -780, 560);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
viewer.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.inset = "0";
labelRenderer.domElement.style.pointerEvents = "none";
viewer.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 150, 220);
controls.screenSpacePanning = false;

const root = new THREE.Group();
scene.add(root);
let activeBox = BOX_PRESETS.compact;
let activeMonitor = MONITORS["24"];
let showSceneLabels = false;
const clock = new THREE.Clock();
const orbitVelocity = { azimuth: 0, elevation: 0 };
const orbitHoldSpeed = 0.85;

scene.add(new THREE.HemisphereLight(0xdcefff, 0x343a40, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(420, -520, 820);
sun.castShadow = true;
scene.add(sun);

function mmBox(size, color, options = {}) {
  const geometry = new THREE.BoxGeometry(size.width, size.depth, size.height);
  const material = new THREE.MeshStandardMaterial({
    color,
    transparent: Boolean(options.opacity && options.opacity < 1),
    opacity: options.opacity ?? 1,
    roughness: 0.62,
    metalness: options.metalness ?? 0.08,
    depthWrite: options.opacity >= 1 || options.opacity == null,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addBox(group, name, size, position, color, label, opacity = 1, labelOffset = {}) {
  const mesh = mmBox(size, color, { opacity });
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  group.add(mesh);
  addEdges(mesh);
  if (label) {
    addLabel(
      group,
      label,
      {
        x: mesh.position.x + (labelOffset.x ?? 0),
        y: mesh.position.y + (labelOffset.y ?? 0),
        z: mesh.position.z + (labelOffset.z ?? 0),
      },
      size.height / 2 + 14,
    );
  }
  return mesh;
}

function addEdges(mesh) {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: COLORS.sheetEdge, transparent: true, opacity: 0.42 }),
  );
  mesh.add(line);
}

function addLabel(group, text, position, zOffset = 0) {
  if (!showSceneLabels) return null;
  const element = document.createElement("div");
  element.className = "label";
  element.textContent = text;
  const label = new CSS2DObject(element);
  label.position.set(position.x, position.y, position.z + zOffset);
  group.add(label);
  return label;
}

function addArrow(group, from, to, color, label) {
  const start = new THREE.Vector3(from.x, from.y, from.z);
  const end = new THREE.Vector3(to.x, to.y, to.z);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const arrow = new THREE.ArrowHelper(direction.normalize(), start, length, color, 22, 12);
  group.add(arrow);
  addLabel(group, label, end, 12);
}

function toScenePosition(box, origin, size) {
  return {
    x: origin.x + size.width / 2 - box.width / 2,
    y: origin.y + size.depth / 2,
    z: origin.z + size.height / 2,
  };
}

function addCylinder(group, name, radius, depth, position, color, rotation = {}) {
  const geometry = new THREE.CylinderGeometry(radius, radius, depth, 40);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.08 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(position.x, position.y, position.z);
  mesh.rotation.set(rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addWire(group, name, points, color, radius = 3) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point.x, point.y, point.z)));
  const geometry = new THREE.TubeGeometry(curve, 32, radius, 10, false);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.02 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function addReceiptSlot(group, box, printerCenter) {
  const slot = addBox(
    group,
    "receipt-slot",
    { width: 112, depth: 3, height: 12 },
    { x: printerCenter.x, y: -1.5, z: 95 },
    0x101316,
    "Receipt slot",
    1,
    { x: 54, y: -18, z: -10 },
  );
  slot.material.metalness = 0;
  return slot;
}

function addFrontDoor(group, box) {
  const door = {
    ...PANEL_FEATURES.frontDoor,
    size: { width: box.width, height: box.height },
    position: { z: 0 },
  };
  const doorCenter = {
    x: 0,
    y: -2,
    z: door.position.z + door.size.height / 2,
  };
  addBox(
    group,
    "front-paper-loading-door-panel",
    { width: door.size.width, depth: 3, height: door.size.height },
    doorCenter,
    0xb7c5ce,
    "Full front opening door",
    0.28,
    { y: -22, z: 12 },
  );

  const edgeColor = 0x101316;
  const halfW = door.size.width / 2;
  const halfH = door.size.height / 2;
  addBox(group, "front-door-top-seam", { width: door.size.width, depth: 4, height: 3 }, { x: 0, y: -4, z: doorCenter.z + halfH }, edgeColor, "");
  addBox(group, "front-door-bottom-seam", { width: door.size.width, depth: 4, height: 3 }, { x: 0, y: -4, z: doorCenter.z - halfH }, edgeColor, "");
  addBox(group, "front-door-left-seam", { width: 3, depth: 4, height: door.size.height }, { x: -halfW, y: -4, z: doorCenter.z }, edgeColor, "");
  addBox(group, "front-door-right-seam", { width: 3, depth: 4, height: door.size.height }, { x: halfW, y: -4, z: doorCenter.z }, edgeColor, "");

  for (const z of [55, doorCenter.z, box.height - 55]) {
    addBox(
      group,
      `front-door-hinge-${z}`,
      { width: 12, depth: 12, height: 34 },
      { x: -halfW - 7, y: -8, z },
      0x4b555c,
      "",
    );
  }
  addBox(
    group,
    "front-door-pull-handle",
    { width: 46, depth: 8, height: 10 },
    { x: halfW - 58, y: -10, z: 104 },
    0x2d343a,
    "",
  );
  addLabel(group, "Whole front face opens for paper loading", { x: 0, y: -42, z: box.height + 18 });
}

function addWireRouting(group, box, centers) {
  const rearY = box.depth - 28;
  const passX = box.width / 2;
  const passY = PANEL_FEATURES.extensionWire.position.y;
  const passZ = PANEL_FEATURES.extensionWire.position.z;

  addWire(
    group,
    "printer-power-wire",
    [
      { x: centers.printer.x, y: centers.printer.y + 48, z: centers.printer.z + 20 },
      { x: 42, y: 170, z: 42 },
      { x: passX - 6, y: passY, z: passZ + 8 },
    ],
    0x1f1f1f,
  );
  addWire(
    group,
    "printer-usb-wire",
    [
      { x: centers.printer.x - 30, y: centers.printer.y + 64, z: centers.printer.z + 34 },
      { x: -28, y: 152, z: 74 },
      { x: centers.motherboard.x + 8, y: centers.motherboard.y - 20, z: centers.motherboard.z - 36 },
    ],
    0x2f8fff,
    2.4,
  );
  addWire(
    group,
    "smps-power-wire",
    [
      { x: centers.smps.x + 36, y: centers.smps.y - 34, z: centers.smps.z + 14 },
      { x: passX - 12, y: passY, z: passZ + 10 },
      { x: passX + 18, y: passY, z: passZ },
    ],
    0xff4b42,
    3.2,
  );
  addWire(
    group,
    "sound-box-wire",
    [
      { x: centers.sound.x - 20, y: centers.sound.y + 12, z: centers.sound.z + 18 },
      { x: 18, y: 112, z: 66 },
      { x: centers.motherboard.x + 6, y: centers.motherboard.y + 30, z: centers.motherboard.z - 8 },
    ],
    0xf2f5f6,
    2.2,
  );

  addLabel(group, "Wires route to plug pass-through / board", {
    x: passX + 26,
    y: passY,
    z: passZ + 46,
  });
}

function addPanelHoleMarkers(group, box) {
  const rightX = box.width / 2;
  const power = PANEL_FEATURES.powerButton;
  addCylinder(
    group,
    "power-button-hole-marker",
    power.diameter / 2,
    3,
    { x: rightX + 2, y: power.position.y, z: power.position.z },
    0x0b0d0f,
    { z: Math.PI / 2 },
  );
  addCylinder(
    group,
    "power-button-trim-ring",
    power.diameter / 2 + 4,
    2,
    { x: rightX + 1, y: power.position.y, z: power.position.z },
    0x2f363d,
    { z: Math.PI / 2 },
  );
  addLabel(group, "19.5 mm power button hole", {
    x: rightX + 24,
    y: power.position.y,
    z: power.position.z + 28,
  });

  const lock = PANEL_FEATURES.sideDoorLock;
  addCylinder(
    group,
    "side-door-lock-marker",
    lock.diameter / 2,
    3,
    { x: rightX + 2, y: lock.position.y, z: lock.position.z },
    0x050607,
    { z: Math.PI / 2 },
  );
  addCylinder(
    group,
    "side-door-lock-trim",
    lock.diameter / 2 + 4,
    2,
    { x: rightX + 1, y: lock.position.y, z: lock.position.z },
    0xd5dde1,
    { z: Math.PI / 2 },
  );
  addBox(
    group,
    "side-door-lock-key-slot",
    { width: 2, depth: 3, height: 15 },
    { x: rightX + 4, y: lock.position.y, z: lock.position.z },
    0x050607,
    "",
  );
  addLabel(group, "Door lock near front edge", {
    x: rightX + 24,
    y: lock.position.y,
    z: lock.position.z - 26,
  });

  const extension = PANEL_FEATURES.extensionWire;
  addLabel(group, "Extension plug uses right-side control opening", {
    x: rightX + 26,
    y: extension.position.y,
    z: extension.position.z + 28,
  });
}

function addPrinterDetails(group, printerCenter, printerSize) {
  addBox(
    group,
    "printer-front-face",
    { width: printerSize.width - 18, depth: 4, height: 42 },
    { x: printerCenter.x, y: 2, z: printerCenter.z + 12 },
    0x20252a,
    "",
    1,
  );
  addBox(
    group,
    "printer-paper-exit",
    { width: 98, depth: 5, height: 10 },
    { x: printerCenter.x, y: -3, z: 96 },
    0xf4f4ed,
    "",
    1,
  );
  addCylinder(
    group,
    "printer-roll-reference",
    38,
    printerSize.width - 24,
    { x: printerCenter.x, y: printerCenter.y + 42, z: printerCenter.z + 30 },
    0xf7f3dc,
    { z: Math.PI / 2 },
  );
  addBox(
    group,
    "printer-cutter-bar",
    { width: 106, depth: 5, height: 6 },
    { x: printerCenter.x, y: 6, z: 107 },
    0x0c0f12,
    "",
  );
  addCylinder(
    group,
    "printer-status-led",
    4,
    3,
    { x: printerCenter.x + printerSize.width / 2 - 22, y: 0, z: printerCenter.z + 34 },
    0x2bff75,
    { x: Math.PI / 2 },
  );
  addCylinder(
    group,
    "printer-feed-button",
    7,
    3,
    { x: printerCenter.x + printerSize.width / 2 - 40, y: 0, z: printerCenter.z + 34 },
    0x303841,
    { x: Math.PI / 2 },
  );
}

function addMotherboardDetails(group, center) {
  const chipColor = 0x1d2420;
  addBox(group, "motherboard-cpu", { width: 22, depth: 28, height: 8 }, { x: center.x + 2, y: center.y - 24, z: center.z + 18 }, chipColor, "");
  addBox(group, "motherboard-ram-1", { width: 10, depth: 92, height: 7 }, { x: center.x + 4, y: center.y + 14, z: center.z + 4 }, 0x273f34, "");
  addBox(group, "motherboard-ram-2", { width: 10, depth: 92, height: 7 }, { x: center.x + 4, y: center.y + 14, z: center.z - 10 }, 0x24382f, "");
  addBox(group, "motherboard-io", { width: 12, depth: 46, height: 18 }, { x: center.x - 20, y: center.y - 58, z: center.z - 46 }, 0xc4ccd0, "");
  addBox(group, "motherboard-pcie-slot", { width: 8, depth: 96, height: 8 }, { x: center.x + 5, y: center.y + 18, z: center.z - 42 }, 0x20242a, "");
  addBox(group, "motherboard-heatsink", { width: 18, depth: 24, height: 12 }, { x: center.x + 4, y: center.y + 48, z: center.z + 28 }, 0x7a858a, "");
  for (const [i, point] of [
    [0, { y: -58, z: 34 }],
    [1, { y: -42, z: 36 }],
    [2, { y: 54, z: -20 }],
    [3, { y: 68, z: -22 }],
    [4, { y: 70, z: 46 }],
  ]) {
    addCylinder(
      group,
      `motherboard-capacitor-${i}`,
      4,
      10,
      { x: center.x + 8, y: center.y + point.y, z: center.z + point.z },
      0x2b3035,
      { z: Math.PI / 2 },
    );
  }
  for (const [i, y] of [-72, -60, -48].entries()) {
    addBox(
      group,
      `motherboard-rear-port-${i}`,
      { width: 8, depth: 10, height: 12 },
      { x: center.x - 24, y: center.y + y, z: center.z - 18 + i * 16 },
      0xb8c1c6,
      "",
    );
  }
}

function addMotherboardMountingHardware(group, plateX, plateY, plateZ) {
  const points = [
    { y: plateY - 72, z: plateZ - 70 },
    { y: plateY + 72, z: plateZ - 70 },
    { y: plateY - 72, z: plateZ + 70 },
    { y: plateY + 72, z: plateZ + 70 },
  ];

  for (const [index, point] of points.entries()) {
    addCylinder(
      group,
      `motherboard-standoff-${index + 1}`,
      6,
      10,
      { x: plateX + 7, y: point.y, z: point.z },
      0xd5dde1,
      { z: Math.PI / 2 },
    );
    addCylinder(
      group,
      `motherboard-screw-head-${index + 1}`,
      3,
      3,
      { x: plateX + 14, y: point.y, z: point.z },
      0x2d3338,
      { z: Math.PI / 2 },
    );
  }

  addLabel(group, "M3 standoffs / screw points", { x: plateX + 18, y: plateY - 96, z: plateZ + 92 });
}

function addSmpsDetails(group, center, size) {
  for (let i = -2; i <= 2; i += 1) {
    addBox(
      group,
      `smps-vent-${i}`,
      { width: size.width - 18, depth: 3, height: 3 },
      { x: center.x, y: center.y + i * 16, z: center.z + size.height / 2 + 2 },
      0x22272c,
      "",
    );
  }
  for (let i = -2; i <= 2; i += 1) {
    addBox(
      group,
      `smps-side-slot-${i}`,
      { width: 4, depth: 7, height: 20 },
      { x: center.x - size.width / 2 - 2, y: center.y + i * 13, z: center.z + 2 },
      0x20252a,
      "",
    );
  }
  addBox(
    group,
    "smps-terminal-block",
    { width: 44, depth: 10, height: 16 },
    { x: center.x + size.width / 2 - 28, y: center.y - size.depth / 2 - 2, z: center.z + 4 },
    0x26313a,
    "",
  );
  for (let i = 0; i < 3; i += 1) {
    addBox(
      group,
      `smps-terminal-screw-${i}`,
      { width: 9, depth: 3, height: 4 },
      { x: center.x + size.width / 2 - 42 + i * 14, y: center.y - size.depth / 2 - 8, z: center.z + 12 },
      0xd6dde2,
      "",
    );
  }
}

function addSoundBoxDetails(group, center, size) {
  // Intentionally no grille/badge: sound box is internal only.
}

function addPowerStripDetails(group, center, size) {
  for (let i = -2; i <= 2; i += 1) {
    addCylinder(
      group,
      `power-strip-socket-${i}`,
      10,
      4,
      { x: center.x - size.width / 2 - 2, y: center.y + i * 36, z: center.z + 2 },
      0x2a1f13,
      { z: Math.PI / 2 },
    );
    addBox(
      group,
      `power-strip-slot-a-${i}`,
      { width: 3, depth: 2, height: 12 },
      { x: center.x - size.width / 2 - 5, y: center.y + i * 36 - 4, z: center.z + 2 },
      0x0d0d0d,
      "",
    );
    addBox(
      group,
      `power-strip-slot-b-${i}`,
      { width: 3, depth: 2, height: 12 },
      { x: center.x - size.width / 2 - 5, y: center.y + i * 36 + 4, z: center.z + 2 },
      0x0d0d0d,
      "",
    );
  }
  addBox(
    group,
    "power-strip-cable-tail",
    { width: 16, depth: 18, height: 10 },
    { x: center.x + 8, y: center.y + size.depth / 2 - 8, z: center.z - 12 },
    0x1c1c1c,
    "",
  );
}

function addFanDetail(group, fanCenter, box) {
  const ringGeometry = new THREE.TorusGeometry(33, 2.8, 12, 72);
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3137, roughness: 0.55 });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(box.width / 2 + 20, fanCenter.y, fanCenter.z);
  ring.rotation.y = Math.PI / 2;
  group.add(ring);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 5, 32),
    new THREE.MeshStandardMaterial({ color: 0x191c20 }),
  );
  hub.position.copy(ring.position);
  hub.rotation.y = Math.PI / 2;
  group.add(hub);

  for (let i = 0; i < 4; i += 1) {
    const blade = addBox(
      group,
      `fan-blade-${i}`,
      { width: 9, depth: 4, height: 30 },
      { x: box.width / 2 + 21, y: fanCenter.y, z: fanCenter.z + 18 },
      0x20252b,
      "",
    );
    blade.rotation.x = (Math.PI / 2) * i;
    blade.rotation.z = Math.PI / 9;
  }
}

function addMonitor(group, box, monitor, showWires) {
  const lift = 24;
  const centerZ = box.height + lift + monitor.height / 2;
  const tiltRadians = THREE.MathUtils.degToRad(MONITOR_CABLE_PASS.tiltDegrees);

  addBox(
    group,
    "monitor-bottom-mounting-plate",
    { width: box.width, depth: 48, height: 8 },
    { x: 0, y: 24, z: box.height + 4 },
    0x8f9da6,
    "Flat monitor mounting plate",
    0.78,
    { x: -76, y: -18, z: 8 },
  );
  for (const x of [-box.width / 2 + 34, box.width / 2 - 34]) {
    for (const y of [10, 38]) {
      addCylinder(
        group,
        `monitor-plate-screw-${x}-${y}`,
        4,
        4,
        { x, y, z: box.height + 10 },
        0x20262c,
      );
    }
  }

  const monitorGroup = new THREE.Group();
  monitorGroup.rotation.x = -tiltRadians;
  monitorGroup.position.set(0, 34, centerZ);
  group.add(monitorGroup);

  const frame = addBox(
    monitorGroup,
    "monitor-frame",
    { width: monitor.width, depth: monitor.depth, height: monitor.height },
    { x: 0, y: 0, z: 0 },
    COLORS.monitor,
    monitor.label,
    1,
    { x: -monitor.width / 2 - 34, y: -6, z: -monitor.height / 4 },
  );
  frame.material.metalness = 0.16;

  addBox(
    monitorGroup,
    "monitor-screen",
    { width: monitor.width - 34, depth: 3, height: monitor.height - 44 },
    { x: 0, y: -18, z: 0 },
    COLORS.screen,
    "",
    0.82,
  );

  addCylinder(
    group,
    "monitor-cable-hole-round-edge",
    MONITOR_CABLE_PASS.diameter / 2,
    6,
    { x: MONITOR_CABLE_PASS.position.x, y: MONITOR_CABLE_PASS.position.y, z: box.height + 4 },
    0x050607,
    { x: Math.PI / 2 },
  );
  addLabel(group, "50 mm round monitor cable hole", {
    x: MONITOR_CABLE_PASS.position.x - 58,
    y: MONITOR_CABLE_PASS.position.y + 8,
    z: box.height + 28,
  });

  if (showWires) {
    const cableStartZ = box.height + lift + 90;
    const cableEndZ = box.height - 12;
    for (const [index, cable] of MONITOR_CABLE_PASS.cables.entries()) {
      const x = -16 + index * 16;
      addWire(
        group,
        `monitor-${cable.label.toLowerCase().replaceAll(" ", "-")}-cable`,
        [
          { x, y: 20, z: cableStartZ },
          { x, y: MONITOR_CABLE_PASS.position.y, z: box.height + 44 },
          { x, y: MONITOR_CABLE_PASS.position.y, z: cableEndZ },
        ],
        cable.color,
        index === 0 ? 3.5 : 2.6,
      );
    }
    addBox(
      group,
      "monitor-power-plug-clearance-gauge",
      { width: MONITOR_CABLE_PASS.plugHeadWidth, depth: 18, height: 24 },
      { x: -30, y: MONITOR_CABLE_PASS.position.y, z: box.height + 28 },
      0xff4b42,
      "40 mm power plug head clearance",
      0.65,
      { x: -26, y: 12, z: 6 },
    );
  }
  addLabel(group, `${MONITOR_CABLE_PASS.tiltDegrees} degree monitor tilt visual`, {
    x: monitor.width / 2 - 70,
    y: 6,
    z: centerZ + monitor.height / 2 + 24,
  });
}

function buildScene() {
  root.clear();
  const box = BOX_PRESETS[presetSelect.value];
  const monitor = MONITORS[monitorSelect.value];
  activeBox = box;
  activeMonitor = monitor;
  showSceneLabels = showLabelsToggle.checked;
  const separated = explodeToggle.checked ? 18 : 0;
  const showWires = showWiresToggle.checked;

  const floorZ = 2;
  const innerWallGap = 8;
  const leftX = -box.width / 2;
  const rightX = box.width / 2;

  // Semi-transparent bottom system box enclosure.
  addBox(
    root,
    "bottom-system-box",
    box,
    { x: 0, y: box.depth / 2, z: box.height / 2 },
    COLORS.box,
    `Bottom box ${box.width}W x ${box.depth}D x ${box.height}H`,
    0.2,
  );
  addFrontDoor(root, box);
  addPanelHoleMarkers(root, box);

  // Thermal printer: actual 145W x 180D x 130H, front-aligned at Y = 0.
  const printer = COMPONENTS.printer;
  const printerCenter = toScenePosition(box, { x: 75, y: 0, z: 10 }, printer.size);
  addBox(root, "printer", printer.size, printerCenter, printer.color, printer.label, 1, {
    x: 82,
    y: -18,
  });
  addPrinterDetails(root, printerCenter, printer.size);
  addReceiptSlot(root, box, printerCenter);

  // Motherboard: vertical on fixed left internal plate; top-view footprint 50W x 170D.
  const motherboard = COMPONENTS.motherboard;
  const platePosition = { x: leftX + innerWallGap + separated, y: 118, z: 106 };
  const motherboardCenter = {
    x: leftX + innerWallGap + motherboard.size.width / 2 + separated,
    y: 118,
    z: 96,
  };
  addBox(
    root,
    "motherboard-left-plate",
    { width: 4, depth: 190, height: 190 },
    platePosition,
    0x3a4248,
    "Sheet metal motherboard plate",
    0.82,
    { x: -38, y: -34, z: -54 },
  );
  addMotherboardMountingHardware(root, platePosition.x, platePosition.y, platePosition.z);
  addBox(
    root,
    "motherboard",
    motherboard.size,
    motherboardCenter,
    motherboard.color,
    motherboard.label,
    1,
    { x: -72, y: 20, z: -20 },
  );
  addBox(
    root,
    "motherboard-170-face-reference",
    { width: 3, depth: 170, height: 170 },
    { x: motherboardCenter.x + motherboard.size.width / 2 + 3, y: motherboardCenter.y, z: motherboardCenter.z },
    0x98f0b4,
    "Motherboard face 170 x 170 mm",
    0.32,
    { x: -18, y: 0, z: 22 },
  );
  addMotherboardDetails(root, motherboardCenter);

  // SMPS: rear/right, close to exhaust fan.
  const smps = COMPONENTS.smps;
  const smpsCenter = toScenePosition(box, { x: 225 - separated, y: 210, z: 10 }, smps.size);
  addBox(
    root,
    "smps",
    smps.size,
    smpsCenter,
    smps.color,
    smps.label,
    1,
    { x: 30, y: 52 },
  );
  addSmpsDetails(root, smpsCenter, smps.size);

  // Sound box: internal only, with no external grille or opening.
  const sound = COMPONENTS.soundBox;
  const soundCenter = toScenePosition(box, { x: 245, y: 25, z: 10 }, sound.size);
  addBox(
    root,
    "sound-box",
    sound.size,
    soundCenter,
    sound.color,
    sound.label,
    1,
    { x: -42, y: -20 },
  );
  addSoundBoxDetails(root, soundCenter, sound.size);
  if (showWires) {
    addWireRouting(root, box, {
      printer: printerCenter,
      motherboard: motherboardCenter,
      smps: smpsCenter,
      sound: soundCenter,
    });
  }

  // Power strip: mounted on right inner wall near plug pass-through, not placed on the floor.
  const strip = COMPONENTS.powerStrip;
  const stripWallSize = { width: 60, depth: 246, height: 89 };
  const stripCenter = {
    x: rightX - stripWallSize.width / 2 - 6,
    y: 166,
    z: box.height - stripWallSize.height / 2 - 18,
  };
  addBox(
    root,
    "power-strip",
    stripWallSize,
    stripCenter,
    strip.color,
    strip.label,
    1,
    { x: -32, y: 42 },
  );
  addPowerStripDetails(root, stripCenter, stripWallSize);
  if (showWires) {
    addWire(
      root,
      "power-strip-input-cable-to-right-pass-through",
      [
        { x: stripCenter.x + stripWallSize.width / 2 - 6, y: stripCenter.y - 62, z: stripCenter.z - 12 },
        { x: rightX - 10, y: 92, z: 92 },
        { x: rightX - 6, y: PANEL_FEATURES.powerButton.position.y, z: PANEL_FEATURES.extensionWire.position.z + 10 },
        { x: rightX + 18, y: PANEL_FEATURES.powerButton.position.y, z: PANEL_FEATURES.extensionWire.position.z },
      ],
      0x111111,
      3.2,
    );
    addLabel(root, "Power extension input wire exits near lock/power hole", {
      x: rightX + 22,
      y: PANEL_FEATURES.powerButton.position.y,
      z: PANEL_FEATURES.extensionWire.position.z + 54,
    });
  }

  // Exhaust fan: 80 x 80 mm, outside right side wall near SMPS.
  const fan = COMPONENTS.fan;
  const fanCenter = {
    x: rightX + fan.size.depth / 2,
    y: 220,
    z: 96,
  };
  addBox(root, "right-side-fan", { width: fan.size.depth, depth: fan.size.width, height: fan.size.height }, fanCenter, fan.color, fan.label, 1, {
    x: -46,
    y: 38,
    z: 16,
  });
  addFanDetail(root, fanCenter, box);

  // Monitor frame and hidden wiring route above the bottom box.
  addMonitor(root, box, monitor, showWires);

  // Front/rear direction markers and airflow.
  addLabel(root, "FRONT / CUSTOMER  Y=0", { x: 0, y: -52, z: 18 });
  addLabel(root, "REAR / SERVICE  Y=box depth", { x: 0, y: box.depth + 66, z: 18 });
  if (showWires) {
    addArrow(root, { x: -box.width / 2 - 80, y: 62, z: 70 }, { x: -box.width / 2 - 8, y: 62, z: 70 }, COLORS.intake, "Blue intake");
    addArrow(root, { x: -20, y: -82, z: 56 }, { x: -20, y: 4, z: 56 }, COLORS.intake, "Blue intake");
    addArrow(root, { x: rightX - 18, y: fanCenter.y, z: fanCenter.z }, { x: rightX + 118, y: fanCenter.y, z: fanCenter.z }, COLORS.exhaust, "Red exhaust");
  }

  addFloorGrid(box, monitor);
  updateReadout(box, monitor);
  fitCamera();
}

function addFloorGrid(box, monitor) {
  const grid = new THREE.GridHelper(Math.max(760, monitor.height), 20, 0x5d6972, 0x303840);
  grid.position.set(0, box.depth / 2, -1);
  grid.rotation.x = Math.PI / 2;
  root.add(grid);
}

function updateReadout(box, monitor) {
  readout.hidden = !showReadoutToggle.checked;
  const rows = [
    ["Box", `${box.width}W x ${box.depth}D x ${box.height}H mm`, COLORS.box],
    ["Printer", "145W x 180D x 130H mm", COMPONENTS.printer.color],
    ["Motherboard", "Actual face 170W x 170H x 50D mm", COMPONENTS.motherboard.color],
    ["MB footprint", "Vertical mount uses 50W x 170D floor space", COMPONENTS.motherboard.color],
    ["SMPS", "143L x 80W x 40H mm", COMPONENTS.smps.color],
    ["Sound", "115L x 113W x 97H mm", COMPONENTS.soundBox.color],
    ["Power strip", COMPONENTS.powerStrip.actual, COMPONENTS.powerStrip.color],
    ["Power strip mount", "Right inner wall, off floor", COMPONENTS.powerStrip.color],
    ["Sound box note", "Internal only, no outside holes", COMPONENTS.soundBox.color],
    ["Front door", `Full ${box.width}W x ${box.height}H mm opening`, 0xb7c5ce],
    ["Door lock", "Right side near front edge", 0xd5dde1],
    ["Wire routing", "Top monitor hole + right plug pass", 0x3b3f45],
    ["Power button hole", "19.5 mm round, right side near front", 0x2f363d],
    ["Extension plug pass", "Uses right control opening, 40 mm plug", 0x15191d],
    ["Monitor cable hole", "50 mm round top hole under monitor", COLORS.cable],
    ["Monitor mount plate", `Flat ${box.width}W x 48D mm, front aligned`, 0x8f9da6],
    ["Monitor cables", "Power + HDMI + USB touch into box", 0x2f8fff],
    ["Monitor tilt", `${MONITOR_CABLE_PASS.tiltDegrees} degree visual reference`, COLORS.monitor],
    ["Monitor ref", `${monitor.width}W x ${monitor.height}H mm`, COLORS.screen],
  ];
  readout.replaceChildren(
    ...rows.flatMap(([term, value, color]) => {
      const dt = document.createElement("dt");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.setProperty("--dot-color", `#${color.toString(16).padStart(6, "0")}`);
      const label = document.createElement("span");
      label.textContent = term;
      dt.append(dot, label);
      const dd = document.createElement("dd");
      dd.textContent = value;
      return [dt, dd];
    }),
  );
}

function resize() {
  const { clientWidth, clientHeight } = viewer;
  camera.aspect = clientWidth / clientHeight;
  camera.fov = clientWidth < 620 ? 56 : 42;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
  labelRenderer.setSize(clientWidth, clientHeight);
  fitCamera(false);
}

function fitCamera(enableTransition = true) {
  const modelHeight = activeBox.height + 24 + activeMonitor.height;
  const span = Math.max(activeBox.width, activeMonitor.width, activeBox.depth);
  const compactViewport = viewer.clientWidth < 620;
  const distance = compactViewport ? 1.55 : 1.05;
  camera.position.set(span * distance, -modelHeight * distance, modelHeight * 0.72);
  controls.target.set(0, activeBox.depth / 2, modelHeight * 0.42);
  if (!enableTransition) controls.update();
}

function animate() {
  const delta = clock.getDelta();
  if (autoRotateToggle.checked) {
    orbitHorizontal(-delta * 0.45);
  }
  if (orbitVelocity.azimuth || orbitVelocity.elevation) {
    orbitBy(orbitVelocity.azimuth * delta, orbitVelocity.elevation * delta);
  }
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function orbitHorizontal(angleRadians) {
  orbitBy(angleRadians, 0);
}

function orbitVertical(angleRadians) {
  const offset = camera.position.clone().sub(controls.target);
  const radius = offset.length();
  const horizontalRadius = Math.hypot(offset.x, offset.y);
  const elevation = Math.atan2(offset.z, horizontalRadius);
  const maxElevation = THREE.MathUtils.degToRad(84);
  const minElevation = THREE.MathUtils.degToRad(-20);
  const nextElevation = THREE.MathUtils.clamp(elevation + angleRadians, minElevation, maxElevation);
  const azimuth = Math.atan2(offset.y, offset.x);
  setOrbitFromAngles(radius, azimuth, nextElevation);
}

function orbitBy(azimuthDelta, elevationDelta) {
  const offset = camera.position.clone().sub(controls.target);
  const radius = offset.length();
  const horizontalRadius = Math.hypot(offset.x, offset.y);
  const azimuth = Math.atan2(offset.y, offset.x) + azimuthDelta;
  const elevation = Math.atan2(offset.z, horizontalRadius);
  const nextElevation = THREE.MathUtils.clamp(
    elevation + elevationDelta,
    THREE.MathUtils.degToRad(-20),
    THREE.MathUtils.degToRad(84),
  );
  setOrbitFromAngles(radius, azimuth, nextElevation);
}

function setOrbitFromAngles(radius, azimuth, elevation) {
  const horizontalRadius = radius * Math.cos(elevation);
  const offset = new THREE.Vector3(
    horizontalRadius * Math.cos(azimuth),
    horizontalRadius * Math.sin(azimuth),
    radius * Math.sin(elevation),
  );
  camera.position.copy(controls.target).add(offset);
  camera.lookAt(controls.target);
  controls.update();
}

presetSelect.addEventListener("change", buildScene);
monitorSelect.addEventListener("change", buildScene);
explodeToggle.addEventListener("change", buildScene);
showLabelsToggle.addEventListener("change", buildScene);
showWiresToggle.addEventListener("change", buildScene);
showReadoutToggle.addEventListener("change", () => {
  readout.hidden = !showReadoutToggle.checked;
});
bindOrbitButton(orbitLeftButton, orbitHoldSpeed, 0);
bindOrbitButton(orbitRightButton, -orbitHoldSpeed, 0);
bindOrbitButton(orbitUpButton, 0, THREE.MathUtils.degToRad(32));
bindOrbitButton(orbitDownButton, 0, THREE.MathUtils.degToRad(-32));
orbitResetButton.addEventListener("click", () => fitCamera(false));
window.addEventListener("resize", resize);

function bindOrbitButton(button, azimuthSpeed, elevationSpeed) {
  let pressed = false;
  let movedByHold = false;
  const clickAzimuth = Math.sign(azimuthSpeed) * THREE.MathUtils.degToRad(18);
  const clickElevation = Math.sign(elevationSpeed) * THREE.MathUtils.degToRad(12);

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pressed = true;
    movedByHold = false;
    orbitVelocity.azimuth = azimuthSpeed;
    orbitVelocity.elevation = elevationSpeed;
    button.setPointerCapture(event.pointerId);
    window.setTimeout(() => {
      if (pressed) movedByHold = true;
    }, 180);
  });

  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    pressed = false;
    orbitVelocity.azimuth = 0;
    orbitVelocity.elevation = 0;
    if (!movedByHold) orbitBy(clickAzimuth, clickElevation);
    button.releasePointerCapture(event.pointerId);
  });

  button.addEventListener("pointercancel", () => {
    pressed = false;
    orbitVelocity.azimuth = 0;
    orbitVelocity.elevation = 0;
  });

  button.addEventListener("pointerleave", () => {
    if (!pressed) return;
    pressed = false;
    orbitVelocity.azimuth = 0;
    orbitVelocity.elevation = 0;
  });
}

buildScene();
resize();
animate();
