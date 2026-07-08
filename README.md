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
- Right-side door lock marker near the front edge and power button.
- Simulated internal wire routing to motherboard, monitor cable hole, and right-side control opening.
- Vertical motherboard on the left fixed internal plate.
- Sheet-metal motherboard mounting plate with indicative M3 standoff/screw points.
- Rear/right SMPS near the right-side exhaust fan.
- Internal sound box with no exterior grille.
- Right inner wall-mounted power strip, not occupying floor space.
- Sound box below/front-right area, internal only, with no outside sound holes.
- External right-side 80 mm exhaust fan near SMPS; rear wall mostly remains plain.
- 19.5 mm round power-button hole on the right side panel near the front edge.
- Extension/power-strip cable uses the right-side control opening area; 40 mm plug-head clearance is shown.
- Upright vertical monitor reference frame above the bottom box.
- Hidden 50 mm round top monitor cable pass-through from monitor into bottom box.
- Flat front-aligned monitor mounting plate screwed to the bottom box so both sections read as one body.
- 40 mm monitor power plug head clearance reference.
- 10 degree monitor tilt visual reference.
- Direction labels and intake/exhaust airflow arrows.
- Viewer toggles for 3D labels, airflow/wire routes, and measurements list.
- Orbit pad controls: click or hold arrows for horizontal/vertical rotation, reset view, and continuous 360 auto-rotate.

## Edit Dimensions

Most dimensions and placements live in `src/config.js`.

The component actual measurements are kept separate from placement values so the real hardware sizes remain unchanged while the layout can be adjusted.

## Fabrication Notes

The motherboard plate and screw/standoff points are visual communication features, not final drill drawings. Confirm the exact motherboard hole pattern from the real board before fabricating the plate.

Panel openings currently shown:

- Front/customer panel: full-face paper-loading access door with hinges.
- Right side near front edge: front-door lock/key marker.
- Right side near front edge: 19.5 mm round power-button hole near the lock.
- Right side panel: extension/power-strip plug-head clearance shown at the existing control opening area.

Wire routing is visual only. Confirm actual cable bend radius, connector clearance, and tie-down locations during fabrication.

Placement notes:

- Power strip/extension box is on the right inner wall near the right-side control opening; no extra side hole near SMPS.
- Sound box remains internal below/front-right and has no outside grille or hole.
- Monitor bottom has a flat mounting plate aligned to the bottom-box front corners; it is visually continuous outside and screwed internally.

Cable pass-through notes:

- Use a 50 mm round top hole below the monitor so a monitor power plug head of about 40 mm can pass into the box.
- Route three monitor cables through this hidden top path: monitor power, HDMI, and USB touch.
- Use the right-side control opening area for the extension/power-strip plug head, assuming about 40 mm plug width.
- The 10 degree monitor tilt is shown as a visual reference for clearance discussion.
