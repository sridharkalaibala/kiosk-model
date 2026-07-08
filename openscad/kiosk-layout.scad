// SELF ORDERING KIOSK - CLEAN COMPACT PLACEMENT MODEL
// Units: mm
// Front/customer side = Y 0
// Rear/service side  = Y box_d

$fn = 32;

// ---------------------------
// VIEW OPTIONS
// ---------------------------
use_prototype_box = false; // false: 380x300x260, true: 400x320x280
show_body = false;         // false gives a clear inside-box inspection view
show_monitor = true;
show_airflow = true;
show_labels = true;

// ---------------------------
// MAIN DIMENSIONS
// ---------------------------
compact_box = [380, 300, 260];
prototype_box = [400, 320, 280];
box_size = use_prototype_box ? prototype_box : compact_box;

box_w = box_size[0];
box_d = box_size[1];
box_h = box_size[2];
wall = 2;

// ---------------------------
// COMPONENT ACTUAL SIZES
// ---------------------------
printer_size = [145, 180, 130];      // W x D x H
motherboard_size = [50, 170, 170];   // vertical mount footprint: 50W x 170D, board face 170W x 170H
smps_size = [143, 80, 40];           // 143L x 80W x 40H
sound_box_size = [115, 113, 97];     // 115L x 113W x 97H
power_strip_size = [246, 89, 60];    // 246L x 89W x 40-60H
fan_size = [80, 12, 80];             // 80 x 80 fan, outside rear wall

monitor_24_size = [420, 30, 680];    // visual reference for 24 inch portrait monitor

// ---------------------------
// COLORS
// ---------------------------
body_color = [0.85, 0.85, 0.85, 0.25];
printer_color = [0.08, 0.08, 0.08, 0.85];
mb_color = [0.0, 0.5, 0.15, 0.85];
smps_color = [0.55, 0.55, 0.55, 0.85];
sound_color = [0.1, 0.25, 0.9, 0.75];
power_color = [1.0, 0.65, 0.1, 0.85];
fan_color = [0.05, 0.05, 0.05, 0.85];
cable_colors = ["red", "blue", "green"];

// ---------------------------
// HELPERS
// ---------------------------
module label3d(text_value, pos, size = 10) {
    if (show_labels) {
        color("black")
        translate(pos)
        linear_extrude(height = 1)
        text(text_value, size = size, halign = "center", valign = "center");
    }
}

module box_part(name, pos, size, col) {
    color(col)
    translate(pos)
    cube(size);

    label3d(
        name,
        [pos[0] + size[0] / 2, pos[1] + size[1] / 2, pos[2] + size[2] + 3],
        10
    );
}

module hollow_body() {
    color(body_color)
    difference() {
        cube([box_w, box_d, box_h]);

        translate([wall, wall, wall])
        cube([box_w - 2 * wall, box_d - 2 * wall, box_h - wall]);
    }
}

module body_outline() {
    edge = 1.5;

    color([0, 0, 0, 0.35]) {
        // Bottom rectangle
        translate([0, 0, 0]) cube([box_w, edge, edge]);
        translate([0, box_d - edge, 0]) cube([box_w, edge, edge]);
        translate([0, 0, 0]) cube([edge, box_d, edge]);
        translate([box_w - edge, 0, 0]) cube([edge, box_d, edge]);

        // Top rectangle
        translate([0, 0, box_h]) cube([box_w, edge, edge]);
        translate([0, box_d - edge, box_h]) cube([box_w, edge, edge]);
        translate([0, 0, box_h]) cube([edge, box_d, edge]);
        translate([box_w - edge, 0, box_h]) cube([edge, box_d, edge]);

        // Vertical corners
        translate([0, 0, 0]) cube([edge, edge, box_h]);
        translate([box_w - edge, 0, 0]) cube([edge, edge, box_h]);
        translate([0, box_d - edge, 0]) cube([edge, edge, box_h]);
        translate([box_w - edge, box_d - edge, 0]) cube([edge, edge, box_h]);
    }
}

module front_receipt_slot() {
    // Receipt slot on the front face, aligned with the front-aligned printer.
    color("black")
    translate([(box_w - 120) / 2, -1, 105])
    cube([120, 4, 18]);
}

module fan_80mm() {
    // Exhaust fan outside rear/right wall of the bottom system box.
    fan_x = box_w - fan_size[0] - 10;
    fan_z = 95;

    color(fan_color)
    translate([fan_x, box_d + 3, fan_z])
    cube(fan_size);

    color("gray")
    translate([fan_x + 40, box_d + 16, fan_z + 40])
    rotate([90, 0, 0])
    cylinder(h = 5, r = 32);

    color("black")
    translate([fan_x + 40, box_d + 22, fan_z + 40])
    rotate([90, 0, 0])
    cylinder(h = 5, r = 16);
}

module monitor_cable_path() {
    // Hidden path for monitor power, HDMI, and USB touch.
    for (i = [0:2]) {
        color(cable_colors[i])
        translate([box_w / 2 - 18 + i * 18, box_d - 12, box_h])
        cube([12, 12, 110]);
    }

    label3d(
        "3 cables to monitor:\nPower + HDMI + USB Touch",
        [box_w / 2, box_d + 20, box_h + 120],
        12
    );
}

module monitor_frame() {
    monitor_w = monitor_24_size[0];
    monitor_t = monitor_24_size[1];
    monitor_h = monitor_24_size[2];

    // Upright vertical monitor frame for visual proportion only.
    color([0.15, 0.15, 0.15, 0.35])
    translate([(box_w - monitor_w) / 2, -10, box_h + 40])
    cube(monitor_24_size);

    color([0.02, 0.02, 0.02, 0.8])
    translate([(box_w - 330) / 2, -13, box_h + 90])
    cube([330, 5, 560]);

    color("black")
    translate([box_w / 2, -30, box_h + monitor_h + 80])
    rotate([90, 0, 0])
    linear_extrude(height = 1)
    text("VERTICAL MONITOR FRAME\n15 / 21.5 / 24 inch", size = 18, halign = "center");
}

module airflow_arrow(pos, rot, col, name) {
    if (show_airflow) {
        color(col)
        translate(pos)
        rotate(rot)
        cylinder(h = 70, r1 = 5, r2 = 5);

        color(col)
        translate(pos)
        rotate(rot)
        translate([0, 0, 70])
        cylinder(h = 18, r1 = 12, r2 = 0);

        label3d(name, [pos[0], pos[1], pos[2] + 28], 9);
    }
}

module direction_labels() {
    label3d("FRONT / CUSTOMER SIDE  Y=0", [box_w / 2, -45, 10], 14);
    label3d("REAR / SERVICE SIDE  Y=box depth", [box_w / 2, box_d + 45, 10], 14);
}

// ---------------------------
// MODEL
// ---------------------------

// Outer bottom system box. Hide this for a clear inside-box inspection view.
if (show_body) hollow_body();
if (!show_body) body_outline();
front_receipt_slot();
fan_80mm();

// Thermal printer: front-aligned so its front face is at Y = 0.
box_part(
    "PRINTER\n145x180x130",
    [(box_w - printer_size[0]) / 2, 0, 10],
    printer_size,
    printer_color
);

// Motherboard: vertical on the left fixed internal plate.
box_part(
    "MOTHERBOARD\n170x170x50\nVERTICAL",
    [10, 95, 35],
    motherboard_size,
    mb_color
);

// Sound box: internal only, no outside grille or holes.
box_part(
    "SOUND BOX\n115x113x97\nINTERNAL ONLY",
    [245, 25, 10],
    sound_box_size,
    sound_color
);

// SMPS: rear/right near exhaust fan.
box_part(
    "SMPS\n143x80x40",
    [box_w - smps_size[0] - 12, box_d - smps_size[1] - 10, 10],
    smps_size,
    smps_color
);

// Power strip: mounted high on rear inner wall, not occupying floor space.
box_part(
    "POWER STRIP\n246x89x40-60",
    [(box_w - power_strip_size[0]) / 2, box_d - power_strip_size[1] - 5, box_h - power_strip_size[2] - 15],
    power_strip_size,
    power_color
);

monitor_cable_path();
if (show_monitor) monitor_frame();

// Blue intake from side/front, red exhaust through rear/right fan.
airflow_arrow([-55, 60, 70], [0, 90, 0], "blue", "INTAKE");
airflow_arrow([box_w / 2, -75, 55], [-90, 0, 0], "blue", "INTAKE");
airflow_arrow([box_w - 50, box_d + 10, 135], [90, 0, 0], "red", "EXHAUST");

direction_labels();
