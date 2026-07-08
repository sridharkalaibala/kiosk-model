export const BOX_PRESETS = {
  compact: { width: 380, depth: 300, height: 260 },
  prototype: { width: 400, depth: 320, height: 280 },
};

export const MONITORS = {
  "24": { width: 420, height: 680, depth: 34, label: "24 inch monitor" },
  "21.5": { width: 335, height: 560, depth: 32, label: "21.5 inch monitor" },
  "15": { width: 230, height: 390, depth: 30, label: "15 inch monitor" },
};

export const MONITOR_CABLE_PASS = {
  width: 50,
  depth: 28,
  plugHeadWidth: 40,
  tiltDegrees: 10,
  cables: [
    { label: "Power", color: 0xff4b42 },
    { label: "HDMI", color: 0x2f8fff },
    { label: "USB touch", color: 0x65c38d },
  ],
};

export const COMPONENTS = {
  // Actual 145W x 180D x 130H mm.
  printer: {
    label: "Thermal printer",
    size: { width: 145, depth: 180, height: 130 },
    color: 0xf2b35f,
  },
  // Actual board face is 170W x 170H with 50D hardware depth.
  // Mounted vertically on the left plate, so top view is 50W x 170D.
  motherboard: {
    label: "Motherboard on left plate",
    size: { width: 50, depth: 170, height: 170 },
    topView: { width: 50, depth: 170 },
    color: 0x65c38d,
  },
  // Actual 143L x 80W x 40H mm.
  smps: {
    label: "SMPS",
    size: { width: 143, depth: 80, height: 40 },
    color: 0x9c85ff,
  },
  // Actual 115L x 113W x 97H mm.
  soundBox: {
    label: "Sound box",
    size: { width: 115, depth: 113, height: 97 },
    color: 0x54a7ff,
  },
  // Actual 246L x 89W x 40-60H mm, mounted on rear wall.
  // Width is horizontal, depth projects inward, height is the 40-60 mm range.
  powerStrip: {
    label: "Power strip on rear wall",
    size: { width: 246, depth: 89, height: 60 },
    actual: "246L x 89W x 40-60H mm",
    color: 0xf06f6f,
  },
  // 80 x 80 mm fan shown outside the rear/right wall.
  fan: {
    label: "External 80 mm exhaust fan",
    size: { width: 80, depth: 18, height: 80 },
    color: 0xe14b4b,
  },
};

export const COLORS = {
  box: 0x9bb4c6,
  sheetEdge: 0xd9e6ee,
  monitor: 0x28313a,
  screen: 0x1f8fe5,
  cable: 0x3b3f45,
  intake: 0x2f8fff,
  exhaust: 0xff4b42,
  label: 0xffffff,
};

export const PANEL_FEATURES = {
  frontDoor: {
    label: "Full front opening door",
    lockDiameter: 19,
  },
  powerButton: {
    label: "Power button hole",
    diameter: 19.5,
    position: { xOffsetFromRight: 42, z: 172 },
  },
  sideDoorLock: {
    label: "Front door lock",
    diameter: 19,
    position: { xOffsetFromRight: 42, z: 130 },
  },
  extensionWire: {
    label: "Extension wire grommet hole",
    diameter: 25,
    position: { xOffsetFromRight: 55, z: 45 },
  },
};
