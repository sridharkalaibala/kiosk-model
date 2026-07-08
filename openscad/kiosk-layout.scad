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
power_strip_wall_size = [60, 246, 89]; // right-wall orientation: protrusion x length x height
fan_size = [80, 12, 80];             // 80 x 80 fan, outside rear wall
mb_plate_size = [2, 190, 190];        // sheet metal plate for motherboard fixing
monitor_mount_plate_size = [box_w, 48, 8];
front_door_lock_d = 19;               // visual lock/cam marker on right side near front edge
power_button_hole_d = 19.5;           // right side round hole near front edge
right_control_y = 28;                 // close to front corner
right_power_button_z = 172;
right_door_lock_z = 130;
extension_wire_hole_d = 50;           // plug clearance uses right-side control opening
extension_plug_head_w = 40;
extension_wire_y = right_control_y;
extension_wire_z = 82;

monitor_24_size = [420, 30, 680];    // visual reference for 24 inch portrait monitor
monitor_tilt_deg = 10;                // visual reference tilt
monitor_cable_pass_w = 50;            // wide enough for 40 mm power plug head
monitor_power_plug_head_w = 40;
monitor_cable_hole_x = box_w / 2;
monitor_cable_hole_y = 34;

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

        // 19.5 mm power button hole on right side panel near front edge.
        translate([box_w - wall / 2, right_control_y, right_power_button_z])
        rotate([0, 90, 0])
        cylinder(h = wall + 4, d = power_button_hole_d, center = true);

        // 50 mm top monitor cable pass-through hidden under monitor mount.
        translate([monitor_cable_hole_x, monitor_cable_hole_y, box_h - wall / 2])
        cylinder(h = wall + 4, d = monitor_cable_pass_w, center = true);
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
    extension_hole = [box_w + 6, extension_wire_y, extension_wire_z];

    // Printer power to right-side extension pass-through.
    wire_run([[150, 120, 78], [225, 175, 50], extension_hole], "black", 3);

    // Printer USB/control to motherboard.
    wire_run([[120, 140, 95], [85, 130, 90], [36, 150, 88]], "blue", 2.2);

    // SMPS mains/output cable to right-side extension pass-through.
    wire_run([[300, 212, 36], [318, 238, 52], extension_hole], "red", 3);

    // Monitor power/HDMI/touch bundle down to motherboard area.
    wire_run([[monitor_cable_hole_x, monitor_cable_hole_y, box_h + 70], [monitor_cable_hole_x, monitor_cable_hole_y, 155], [42, 175, 125]], "green", 2.4);
    wire_run([[monitor_cable_hole_x + 16, monitor_cable_hole_y, box_h + 70], [monitor_cable_hole_x + 12, monitor_cable_hole_y, 145], [42, 160, 105]], "blue", 2.4);
    wire_run([[monitor_cable_hole_x - 16, monitor_cable_hole_y, box_h + 70], [monitor_cable_hole_x - 12, monitor_cable_hole_y, 135], [42, 145, 85]], "red", 2.4);

    // Sound box wire to motherboard.
    wire_run([[270, 84, 72], [150, 100, 68], [46, 150, 72]], "white", 2);

    // One power extension input wire exits via the right-side opening near lock/power button.
    wire_run([[box_w - 18, 104, box_h - 78], [box_w - 8, 92, 92], [box_w - 6, right_control_y, extension_wire_z + 10], extension_hole], "black", 3);

    label3d("SIMULATED WIRE ROUTING\nTOP MONITOR HOLE + RIGHT PLUG PASS", [box_w - 70, box_d + 42, 96], 8);
}

module panel_hole_markers() {
    // Power button hole marker on right side near the front edge.
    color("black")
    translate([box_w + 1, right_control_y, right_power_button_z])
    rotate([0, 90, 0])
    cylinder(h = 2, d = power_button_hole_d);

    label3d("POWER BUTTON\n19.5mm RIGHT SIDE", [box_w + 2, right_control_y, right_power_button_z + 26], 8);

    // Door lock/key on right side near the front edge, close to power button.
    color("silver")
    translate([box_w + 1, right_control_y, right_door_lock_z])
    rotate([0, 90, 0])
    cylinder(h = 3, d = front_door_lock_d + 8);

    color("black")
    translate([box_w + 3, right_control_y, right_door_lock_z])
    rotate([0, 90, 0])
    cylinder(h = 2, d = front_door_lock_d);

    color("black")
    translate([box_w + 5, right_control_y - 1.5, right_door_lock_z - 8])
    cube([2, 3, 16]);

    label3d("FRONT DOOR LOCK\nRIGHT SIDE NEAR FRONT", [box_w + 2, right_control_y, right_door_lock_z - 30], 8);

    label3d("EXTENSION CABLE\nUSES RIGHT CONTROL OPENING\n40mm PLUG CLEARANCE", [box_w + 2, extension_wire_y, extension_wire_z + 72], 8);
}

module fan_80mm() {
    // Exhaust fan outside right wall near SMPS.
    fan_x = box_w + 3;
    fan_y = box_d - 120;
    fan_z = 95;

    color(fan_color)
    translate([fan_x, fan_y, fan_z])
    cube([12, 80, 80]);

    color("gray")
    translate([fan_x + 16, fan_y + 40, fan_z + 40])
    rotate([0, 90, 0])
    cylinder(h = 5, r = 32);

    color("black")
    translate([fan_x + 22, fan_y + 40, fan_z + 40])
    rotate([0, 90, 0])
    cylinder(h = 5, r = 16);
}

module monitor_cable_path() {
    // 50 mm round top pass-through for monitor power, HDMI, and USB touch.
    color([0.20, 0.22, 0.25, 0.7])
    translate([monitor_cable_hole_x, monitor_cable_hole_y, box_h + 1])
    cylinder(h = 4, d = monitor_cable_pass_w + 8);

    color("black")
    translate([monitor_cable_hole_x, monitor_cable_hole_y, box_h + 4])
    cylinder(h = 3, d = monitor_cable_pass_w);

    // Visual 40 mm power plug head clearance.
    color("red")
    translate([monitor_cable_hole_x - monitor_power_plug_head_w / 2 - 18, monitor_cable_hole_y - 9, box_h + 18])
    cube([monitor_power_plug_head_w, 18, 24]);

    // Three actual cable routes: power, HDMI, USB touch.
    for (i = [0:2]) {
        color(cable_colors[i])
        translate([monitor_cable_hole_x - 16 + i * 16, monitor_cable_hole_y - 4, box_h])
        cube([7, 7, 135]);
    }

    label3d(
        "50mm ROUND TOP MONITOR CABLE HOLE\n40mm POWER PLUG CLEARANCE\nPOWER + HDMI + USB TOUCH",
        [monitor_cable_hole_x, monitor_cable_hole_y - 40, box_h + 142],
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

module monitor_mounting_plate() {
    // Flat plate: front aligned with bottom box so monitor section reads as one body.
    color([0.55, 0.62, 0.66, 0.78])
    translate([0, 0, box_h])
    cube(monitor_mount_plate_size);

    color("black")
    for (x = [34, box_w - 34]) {
        for (y = [10, 38]) {
            translate([x, y, box_h + 8])
            cylinder(h = 3, r = 4);
        }
    }

    label3d("FLAT MONITOR MOUNTING PLATE\nFRONT CORNERS MATCH BOTTOM BOX\nINTERNAL SCREWS", [box_w / 2, 24, box_h + 26], 8);
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
    "MOTHERBOARD\nFACE 170x170\n50D VERTICAL",
    [10, 95, 35],
    motherboard_size,
    mb_color
);

color([0.45, 1.0, 0.62, 0.32])
translate([10 + motherboard_size[0] + 3, 95, 35])
cube([3, 170, 170]);

label3d(
    "MB FACE IS 170 x 170 mm\nBIGGER THAN PRINTER WIDTH 145 mm\nFLOOR FOOTPRINT ONLY 50 x 170",
    [82, 180, 225],
    8
);

// Sound box: internal only, no outside grille or holes.
box_part(
    "SOUND BOX\n115x113x97\nINTERNAL ONLY",
    [245, 25, 10],
    sound_box_size,
    sound_color
);

// SMPS: rear/right near right-side exhaust fan.
box_part(
    "SMPS\n143x80x40",
    [box_w - smps_size[0] - 12, box_d - smps_size[1] - 10, 10],
    smps_size,
    smps_color
);

// Power strip: mounted on right inner wall near plug pass-through, not occupying floor space.
box_part(
    "POWER STRIP\n246x89x40-60",
    [box_w - power_strip_wall_size[0] - 6, 43, box_h - power_strip_wall_size[2] - 18],
    power_strip_wall_size,
    power_color
);

monitor_mounting_plate();
monitor_cable_path();
if (show_monitor) monitor_frame();

// Blue intake from side/front, red exhaust through rear/right fan.
airflow_arrow([-55, 60, 70], [0, 90, 0], "blue", "INTAKE");
airflow_arrow([box_w / 2, -75, 55], [-90, 0, 0], "blue", "INTAKE");
airflow_arrow([box_w + 10, box_d - 80, 135], [0, 90, 0], "red", "EXHAUST");

direction_labels();
