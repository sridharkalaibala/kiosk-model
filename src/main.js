import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { BOX_PRESETS, COLORS, COMPONENTS, MONITOR_CABLE_PASS, MONITORS, PANEL_FEATURES } from "./config.js";

const viewer = document.querySelector("#viewer");
const presetSelect = document.querySelector("#preset");
const monitorSelect = document.querySelector("#monitor");
const explodeToggle = document.querySelector("#explode");
const showLabelsToggle = document.querySelector("#show-labels");
const showMarkersToggle = document.querySelector("#show-markers");
const showWiresToggle = document.querySelector("#show-wires");
const showReadoutToggle = document.querySelector("#show-readout");
const rotateLeftButton = document.querySelector("#rotate-left");
const rotateRightButton = document.querySelector("#rotate-right");
const autoRotateToggle = document.querySelector("#auto-rotate");
const readout = document.querySelector("#readout");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15191f);

const camera = new THREE.PerspectiveCamera(42, 1, 1, 3000);
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

const root = new THREE.Group();
scene.add(root);
let activeBox = BOX_PRESETS.compact;
let activeMonitor = MONITORS["24"];
let showSceneLabels = false;
const clock = new THREE.Clock();

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
  const grommetX = box.width / 2 - PANEL_FEATURES.extensionWire.position.xOffsetFromRight;
  const grommetZ = PANEL_FEATURES.extensionWire.position.z;

  addWire(
    group,
    "printer-power-wire",
    [
      { x: centers.printer.x, y: centers.printer.y + 48, z: centers.printer.z + 20 },
      { x: 42, y: 170, z: 42 },
      { x: grommetX, y: rearY, z: grommetZ + 8 },
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
      { x: grommetX + 16, y: rearY - 14, z: grommetZ + 10 },
      { x: grommetX, y: box.depth + 18, z: grommetZ },
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

  addLabel(group, "Wires route to rear grommet / cable path", {
    x: grommetX - 32,
    y: box.depth + 52,
    z: grommetZ + 46,
  });
}

function addPanelHoleMarkers(group, box) {
  const rightX = box.width / 2;
  const power = PANEL_FEATURES.powerButton;
  const powerX = rightX - power.position.xOffsetFromRight;
  addCylinder(
    group,
    "power-button-hole-marker",
    power.diameter / 2,
    3,
    { x: powerX, y: -8, z: power.position.z },
    0x0b0d0f,
  );
  addCylinder(
    group,
    "power-button-trim-ring",
    power.diameter / 2 + 4,
    2,
    { x: powerX, y: -9, z: power.position.z },
    0x2f363d,
  );
  addLabel(group, "19.5 mm power button hole", {
    x: powerX - 20,
    y: -38,
    z: power.position.z + 28,
  });

  const lock = PANEL_FEATURES.sideDoorLock;
  const lockX = rightX - lock.position.xOffsetFromRight;
  addCylinder(
    group,
    "side-door-lock-marker",
    lock.diameter / 2,
    3,
    { x: lockX, y: -8, z: lock.position.z },
    0x050607,
  );
  addCylinder(
    group,
    "side-door-lock-trim",
    lock.diameter / 2 + 4,
    2,
    { x: lockX, y: -9, z: lock.position.z },
    0xd5dde1,
  );
  addBox(
    group,
    "side-door-lock-key-slot",
    { width: 3, depth: 2, height: 15 },
    { x: lockX, y: -13, z: lock.position.z },
    0x050607,
    "",
  );
  addLabel(group, "Door lock on front edge", {
    x: lockX - 22,
    y: -38,
    z: lock.position.z - 26,
  });

  const extension = PANEL_FEATURES.extensionWire;
  const extensionX = rightX - extension.position.xOffsetFromRight;
  addCylinder(
    group,
    "extension-wire-hole-marker",
    extension.diameter / 2,
    3,
    { x: extensionX, y: box.depth + 2, z: extension.position.z },
    0x030405,
  );
  addCylinder(
    group,
    "extension-wire-rubber-grommet",
    extension.diameter / 2 + 5,
    5,
    { x: extensionX, y: box.depth + 4, z: extension.position.z },
    0x15191d,
  );
  addLabel(group, "25 mm wire hole + rubber grommet", {
    x: extensionX,
    y: box.depth + 34,
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
  addBox(
    group,
    "sound-box-sealed-badge",
    { width: size.width - 18, depth: 4, height: 18 },
    { x: center.x, y: center.y - size.depth / 2 - 2, z: center.z + 18 },
    0x0f2b52,
    "",
    1,
  );
}

function addPowerStripDetails(group, center, size) {
  for (let i = -2; i <= 2; i += 1) {
    addCylinder(
      group,
      `power-strip-socket-${i}`,
      10,
      4,
      { x: center.x + i * 42, y: center.y - size.depth / 2 - 2, z: center.z + 2 },
      0x2a1f13,
    );
    addBox(
      group,
      `power-strip-slot-a-${i}`,
      { width: 3, depth: 2, height: 12 },
      { x: center.x + i * 42 - 4, y: center.y - size.depth / 2 - 5, z: center.z + 2 },
      0x0d0d0d,
      "",
    );
    addBox(
      group,
      `power-strip-slot-b-${i}`,
      { width: 3, depth: 2, height: 12 },
      { x: center.x + i * 42 + 4, y: center.y - size.depth / 2 - 5, z: center.z + 2 },
      0x0d0d0d,
      "",
    );
  }
  addBox(
    group,
    "power-strip-cable-tail",
    { width: 16, depth: 18, height: 10 },
    { x: center.x + size.width / 2 - 8, y: center.y + size.depth / 2 + 4, z: center.z - 12 },
    0x1c1c1c,
    "",
  );
}

function addFanDetail(group, fanCenter, box) {
  const ringGeometry = new THREE.TorusGeometry(33, 2.8, 12, 72);
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3137, roughness: 0.55 });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(fanCenter.x, box.depth + 20, fanCenter.z);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 5, 32),
    new THREE.MeshStandardMaterial({ color: 0x191c20 }),
  );
  hub.position.copy(ring.position);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  for (let i = 0; i < 4; i += 1) {
    const blade = addBox(
      group,
      `fan-blade-${i}`,
      { width: 9, depth: 4, height: 30 },
      { x: fanCenter.x, y: box.depth + 21, z: fanCenter.z + 18 },
      0x20252b,
      "",
    );
    blade.rotation.y = (Math.PI / 2) * i;
    blade.rotation.z = Math.PI / 9;
  }
}

function addMonitor(group, box, monitor, showWires) {
  const lift = 24;
  const centerZ = box.height + lift + monitor.height / 2;
  const tiltRadians = THREE.MathUtils.degToRad(MONITOR_CABLE_PASS.tiltDegrees);
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

  addBox(
    group,
    "cable-path",
    { width: MONITOR_CABLE_PASS.width, depth: MONITOR_CABLE_PASS.depth, height: box.height + lift + 16 },
    { x: 0, y: box.depth - 44, z: (box.height + lift + 16) / 2 },
    COLORS.cable,
    "50 mm monitor cable pass-through",
    0.72,
    { x: -52, y: 26, z: 40 },
  );

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
          { x, y: box.depth - 44, z: box.height + 36 },
          { x, y: box.depth - 44, z: cableEndZ },
        ],
        cable.color,
        index === 0 ? 3.5 : 2.6,
      );
    }
    addBox(
      group,
      "monitor-power-plug-clearance-gauge",
      { width: MONITOR_CABLE_PASS.plugHeadWidth, depth: 18, height: 24 },
      { x: -30, y: box.depth - 44, z: box.height + 18 },
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
  const showMarkers = showMarkersToggle.checked;
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
  if (showMarkers) {
    addFrontDoor(root, box);
    addPanelHoleMarkers(root, box);
  }

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

  // Power strip: mounted to rear upper inner wall, not placed on the floor.
  const strip = COMPONENTS.powerStrip;
  const stripCenter = {
    x: -12,
    y: box.depth - strip.size.depth / 2 - 5,
    z: box.height - strip.size.height / 2 - 14,
  };
  addBox(
    root,
    "power-strip",
    strip.size,
    stripCenter,
    strip.color,
    strip.label,
    1,
    { x: -76, y: 24 },
  );
  addPowerStripDetails(root, stripCenter, strip.size);

  // Exhaust fan: 80 x 80 mm, outside rear/right wall of bottom system box only.
  const fan = COMPONENTS.fan;
  const fanCenter = {
    x: rightX - fan.size.width / 2 - 20,
    y: box.depth + fan.size.depth / 2,
    z: 96,
  };
  addBox(root, "rear-right-fan", fan.size, fanCenter, fan.color, fan.label, 1, {
    x: -46,
    y: 38,
    z: 16,
  });
  addFanDetail(root, fanCenter, box);

  // Monitor frame and hidden wiring route above the bottom box.
  addMonitor(root, box, monitor, showWires);

  // Front/rear direction markers and airflow.
  if (showMarkers) {
    addLabel(root, "FRONT / CUSTOMER  Y=0", { x: 0, y: -52, z: 18 });
    addLabel(root, "REAR / SERVICE  Y=box depth", { x: 0, y: box.depth + 66, z: 18 });
  }
  if (showWires) {
    addArrow(root, { x: -box.width / 2 - 80, y: 62, z: 70 }, { x: -box.width / 2 - 8, y: 62, z: 70 }, COLORS.intake, "Blue intake");
    addArrow(root, { x: -20, y: -82, z: 56 }, { x: -20, y: 4, z: 56 }, COLORS.intake, "Blue intake");
    addArrow(root, { x: fanCenter.x, y: box.depth - 18, z: fanCenter.z }, { x: fanCenter.x, y: box.depth + 118, z: fanCenter.z }, COLORS.exhaust, "Red exhaust");
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
    ["Motherboard", "170W x 170H x 50D mm", COMPONENTS.motherboard.color],
    ["SMPS", "143L x 80W x 40H mm", COMPONENTS.smps.color],
    ["Sound", "115L x 113W x 97H mm", COMPONENTS.soundBox.color],
    ["Power strip", COMPONENTS.powerStrip.actual, COMPONENTS.powerStrip.color],
    ["Front door", `Full ${box.width}W x ${box.height}H mm opening`, 0xb7c5ce],
    ["Door lock", "Front/right edge, below monitor", 0xd5dde1],
    ["Wire routing", "Simulated cables to rear grommet + board", 0x3b3f45],
    ["Power button hole", "19.5 mm round, front below monitor", 0x2f363d],
    ["Wire grommet hole", "25 mm round, rear/right bottom", 0x15191d],
    ["Monitor cable pass", "50 mm wide for 40 mm power plug", COLORS.cable],
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
    rotateView(delta * 0.45);
  }
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function rotateView(angleRadians) {
  const offset = camera.position.clone().sub(controls.target);
  offset.applyAxisAngle(new THREE.Vector3(0, 0, 1), angleRadians);
  camera.position.copy(controls.target).add(offset);
  camera.lookAt(controls.target);
}

presetSelect.addEventListener("change", buildScene);
monitorSelect.addEventListener("change", buildScene);
explodeToggle.addEventListener("change", buildScene);
showLabelsToggle.addEventListener("change", buildScene);
showMarkersToggle.addEventListener("change", buildScene);
showWiresToggle.addEventListener("change", buildScene);
showReadoutToggle.addEventListener("change", () => {
  readout.hidden = !showReadoutToggle.checked;
});
rotateLeftButton.addEventListener("click", () => rotateView(THREE.MathUtils.degToRad(45)));
rotateRightButton.addEventListener("click", () => rotateView(THREE.MathUtils.degToRad(-45)));
window.addEventListener("resize", resize);

buildScene();
resize();
animate();
