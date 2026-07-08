# Kiosk Internal Layout Viewer

Static Three.js viewer for checking a compact self-ordering kiosk enclosure before sheet metal detailing.

## Run

Open `index.html` directly in a browser, or serve the folder locally:

```powershell
py -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## OpenSCAD

A cleaned OpenSCAD version is also included at:

```text
openscad/kiosk-layout.scad
```

Open it in OpenSCAD and press F5 to preview. Toggle `use_prototype_box`, `show_monitor`, `show_airflow`, `show_labels`, `show_panel_markers`, and `show_simulated_wires` near the top of the file.

## What It Shows

- Bottom system box in millimeters, with compact and safer prototype size presets.
- Front/customer side at `Y = 0`; rear/service side at `Y = box depth`.
- Front-aligned thermal printer with receipt slot on the front face.
- Full front-face paper-loading access door with hinge markers.
- Front/right-edge door lock marker near the power button, below the monitor.
- Simulated internal wire routing to motherboard, cable path, and rear grommet.
- Vertical motherboard on the left fixed internal plate.
- Sheet-metal motherboard mounting plate with indicative M3 standoff/screw points.
- Rear/right SMPS near the exhaust fan.
- Internal sound box with no exterior grille.
- Rear upper wall-mounted power strip, not occupying floor space.
- External rear/right 80 mm exhaust fan.
- 19.5 mm round power-button hole on the front face below the monitor.
- 25 mm rear/right lower extension-wire hole with rubber grommet.
- Upright vertical monitor reference frame above the bottom box.
- Monitor cable path from monitor to bottom box.
- 50 mm monitor cable pass-through for power, HDMI, and USB touch cables.
- 40 mm monitor power plug head clearance reference.
- 10 degree monitor tilt visual reference.
- Direction labels and intake/exhaust airflow arrows.
- Viewer toggles for 3D labels, door/hole markers, and airflow/wire routes.
- Click controls for 45 degree left/right rotation and continuous 360 auto-rotate.

## Edit Dimensions

Most dimensions and placements live in `src/config.js`.

The component actual measurements are kept separate from placement values so the real hardware sizes remain unchanged while the layout can be adjusted.

## Fabrication Notes

The motherboard plate and screw/standoff points are visual communication features, not final drill drawings. Confirm the exact motherboard hole pattern from the real board before fabricating the plate.

Panel openings currently shown:

- Front/customer panel: full-face paper-loading access door with hinges.
- Front/right edge: front-door lock/key marker below the monitor.
- Front face below monitor: 19.5 mm round power-button hole near the lock.
- Rear/right bottom area: 25 mm round extension-wire hole with rubber grommet.

Wire routing is visual only. Confirm actual cable bend radius, connector clearance, and tie-down locations during fabrication.

Monitor cable pass-through notes:

- Use 50 mm width so a monitor power plug head of about 40 mm can pass through.
- Route three cables through this path: monitor power, HDMI, and USB touch.
- The 10 degree monitor tilt is shown as a visual reference for clearance discussion.
