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
show_panel_markers = true;
show_simulated_wires = true;

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
mb_plate_size = [2, 190, 190];        // sheet metal plate for motherboard fixing
front_door_lock_d = 19;               // visual lock/cam marker on front/right edge
power_button_hole_d = 19.5;           // front face round hole below monitor
front_control_x = box_w - 42;         // lock and power button near right edge
front_power_button_z = 172;
front_door_lock_z = 130;
extension_wire_hole_d = 25;           // rear/right bottom cable hole with rubber grommet

monitor_24_size = [420, 30, 680];    // visual reference for 24 inch portrait monitor
monitor_tilt_deg = 10;                // visual reference tilt
monitor_cable_pass_w = 50;            // wide enough for 40 mm power plug head
monitor_cable_pass_d = 28;
monitor_power_plug_head_w = 40;

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
        difference() {
            cube([box_w, box_d, box_h]);

            translate([wall, wall, wall])
            cube([box_w - 2 * wall, box_d - 2 * wall, box_h - wall]);
        }

        // 19.5 mm power button hole on front face below monitor.
        translate([front_control_x, -wall / 2, front_power_button_z])
        rotate([90, 0, 0])
        cylinder(h = wall + 4, d = power_button_hole_d, center = true);

        // 25 mm rear/right bottom extension wire hole.
        translate([box_w - 55, box_d - wall / 2, 45])
        rotate([90, 0, 0])
        cylinder(h = wall + 4, d = extension_wire_hole_d, center = true);
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

module front_paper_loading_door() {
    seam = 2;

    // Whole front customer face opens for printer paper loading.
    color([0.70, 0.78, 0.82, 0.35])
    translate([0, -2, 0])
    cube([box_w, 2, box_h]);

    color("black") {
        translate([0, -4, 0]) cube([box_w, seam, seam]);
        translate([0, -4, box_h]) cube([box_w, seam, seam]);
        translate([0, -4, 0]) cube([seam, seam, box_h]);
        translate([box_w, -4, 0]) cube([seam, seam, box_h]);
    }

    // Hinges on left side of front door.
    color([0.25, 0.28, 0.30, 1])
    for (z = [55, box_h / 2, box_h - 55]) {
        translate([-10, -8, z])
        cube([12, 8, 34]);
    }

    color([0.15, 0.17, 0.18, 1])
    translate([box_w - 104, -10, 104])
    cube([46, 8, 10]);

    label3d(
        "WHOLE FRONT FACE OPENS\nFOR PAPER LOADING",
        [box_w / 2, -32, box_h + 18],
        9
    );
}

module wire_run(points, col, radius = 2.5) {
    color(col)
    for (i = [0 : len(points) - 2]) {
        hull() {
            translate(points[i]) sphere(r = radius);
            translate(points[i + 1]) sphere(r = radius);
        }
    }
}

module simulated_wires() {
    grommet = [box_w - 55, box_d + 6, 45];

    // Printer power to rear grommet.
    wire_run([[150, 120, 78], [225, 175, 50], grommet], "black", 3);

    // Printer USB/control to motherboard.
    wire_run([[120, 140, 95], [85, 130, 90], [36, 150, 88]], "blue", 2.2);

    // SMPS mains/output cable to grommet.
    wire_run([[300, 212, 36], [318, 260, 52], grommet], "red", 3);

    // Monitor power/HDMI/touch bundle down to motherboard area.
    wire_run([[box_w / 2, box_d - 10, box_h + 40], [box_w / 2, box_d - 20, 155], [42, 175, 125]], "green", 2.4);
    wire_run([[box_w / 2 + 18, box_d - 10, box_h + 40], [box_w / 2 + 12, box_d - 25, 145], [42, 160, 105]], "blue", 2.4);
    wire_run([[box_w / 2 - 18, box_d - 10, box_h + 40], [box_w / 2 - 12, box_d - 30, 135], [42, 145, 85]], "red", 2.4);

    // Sound box wire to motherboard.
    wire_run([[270, 84, 72], [150, 100, 68], [46, 150, 72]], "white", 2);

    label3d("SIMULATED WIRE ROUTING\nTO REAR GROMMET + MOTHERBOARD", [box_w - 70, box_d + 42, 96], 8);
}

module panel_hole_markers() {
    // Power button hole marker on front face below monitor.
    color("black")
    translate([front_control_x, -3, front_power_button_z])
    rotate([90, 0, 0])
    cylinder(h = 2, d = power_button_hole_d);

    label3d("POWER BUTTON\n19.5mm FRONT HOLE", [front_control_x, -35, front_power_button_z + 26], 8);

    // Door lock/key on front/right edge, close to power button.
    color("silver")
    translate([front_control_x, -3, front_door_lock_z])
    rotate([90, 0, 0])
    cylinder(h = 3, d = front_door_lock_d + 8);

    color("black")
    translate([front_control_x, -6, front_door_lock_z])
    rotate([90, 0, 0])
    cylinder(h = 2, d = front_door_lock_d);

    color("black")
    translate([front_control_x - 1.5, -10, front_door_lock_z - 8])
    cube([3, 2, 16]);

    label3d("FRONT DOOR LOCK\nFRONT/RIGHT EDGE", [front_control_x, -35, front_door_lock_z - 30], 8);

    // Rear/right bottom extension wire hole with rubber grommet.
    color("black")
    translate([box_w - 55, box_d + 1, 45])
    rotate([90, 0, 0])
    cylinder(h = 2, d = extension_wire_hole_d + 8);

    color([0.05, 0.05, 0.05, 1])
    translate([box_w - 55, box_d + 3, 45])
    rotate([90, 0, 0])
    difference() {
        cylinder(h = 4, d = extension_wire_hole_d + 8);
        translate([0, 0, -1])
        cylinder(h = 6, d = extension_wire_hole_d);
    }

    label3d("EXTENSION WIRE\n25mm GROMMET HOLE", [box_w - 55, box_d + 35, 74], 8);
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
    // 50 mm pass-through for monitor power, HDMI, and USB touch.
    color([0.20, 0.22, 0.25, 0.7])
    translate([box_w / 2 - monitor_cable_pass_w / 2, box_d - 14, box_h])
    cube([monitor_cable_pass_w, monitor_cable_pass_d, 120]);

    // Visual 40 mm power plug head clearance.
    color("red")
    translate([box_w / 2 - monitor_power_plug_head_w / 2 - 18, box_d - 18, box_h + 18])
    cube([monitor_power_plug_head_w, 18, 24]);

    // Three actual cable routes: power, HDMI, USB touch.
    for (i = [0:2]) {
        color(cable_colors[i])
        translate([box_w / 2 - 16 + i * 16, box_d - 20, box_h])
        cube([7, 7, 135]);
    }

    label3d(
        "50mm MONITOR CABLE PASS\n40mm POWER PLUG CLEARANCE\nPOWER + HDMI + USB TOUCH",
        [box_w / 2, box_d + 24, box_h + 142],
        12
    );
}

module monitor_frame() {
    monitor_w = monitor_24_size[0];
    monitor_t = monitor_24_size[1];
    monitor_h = monitor_24_size[2];

    // Monitor frame with 10 degree visual tilt for clearance/reference.
    translate([box_w / 2, -10, box_h + 40])
    rotate([monitor_tilt_deg, 0, 0]) {
        color([0.15, 0.15, 0.15, 0.35])
        translate([-monitor_w / 2, 0, 0])
        cube(monitor_24_size);

        color([0.02, 0.02, 0.02, 0.8])
        translate([-330 / 2, -3, 50])
        cube([330, 5, 560]);
    }

    color("black")
    translate([box_w / 2, -30, box_h + monitor_h + 80])
    rotate([90, 0, 0])
    linear_extrude(height = 1)
    text("MONITOR FRAME\n10 DEGREE TILT VISUAL\n15 / 21.5 / 24 inch", size = 18, halign = "center");
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

module motherboard_mount_plate() {
    plate_pos = [8, 85, 25];

    // Fixed internal sheet-metal plate. Motherboard is screwed to this plate.
    color([0.35, 0.38, 0.40, 0.75])
    translate(plate_pos)
    cube(mb_plate_size);

    label3d(
        "SHEET METAL MB PLATE\nM3 STANDOFFS",
        [plate_pos[0] + 8, plate_pos[1] + mb_plate_size[1] / 2, plate_pos[2] + mb_plate_size[2] + 14],
        9
    );

    // Four visual standoffs/screw heads. Positions are indicative, not a drill template.
    for (y = [plate_pos[1] + 22, plate_pos[1] + 168]) {
        for (z = [plate_pos[2] + 24, plate_pos[2] + 166]) {
            color("silver")
            translate([plate_pos[0] + mb_plate_size[0] + 4, y, z])
            rotate([0, 90, 0])
            cylinder(h = 8, r = 5);

            color("black")
            translate([plate_pos[0] + mb_plate_size[0] + 12, y, z])
            rotate([0, 90, 0])
            cylinder(h = 2, r = 3);
        }
    }
}

// ---------------------------
// MODEL
// ---------------------------

// Outer bottom system box. Hide this for a clear inside-box inspection view.
if (show_body) hollow_body();
if (!show_body) body_outline();
if (show_panel_markers) front_paper_loading_door();
front_receipt_slot();
if (show_panel_markers) panel_hole_markers();
fan_80mm();
if (show_simulated_wires) simulated_wires();

// Thermal printer: front-aligned so its front face is at Y = 0.
box_part(
    "PRINTER\n145x180x130",
    [(box_w - printer_size[0]) / 2, 0, 10],
    printer_size,
    printer_color
);

// Motherboard fixing sheet: fabricate this plate, then screw motherboard onto it.
motherboard_mount_plate();

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
