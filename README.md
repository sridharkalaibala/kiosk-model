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

Open it in OpenSCAD and press F5 to preview. Toggle `use_prototype_box`, `show_monitor`, `show_airflow`, and `show_labels` near the top of the file.

## What It Shows

- Bottom system box in millimeters, with compact and safer prototype size presets.
- Front/customer side at `Y = 0`; rear/service side at `Y = box depth`.
- Front-aligned thermal printer with receipt slot on the front face.
- Vertical motherboard on the left fixed internal plate.
- Sheet-metal motherboard mounting plate with indicative M3 standoff/screw points.
- Rear/right SMPS near the exhaust fan.
- Internal sound box with no exterior grille.
- Rear upper wall-mounted power strip, not occupying floor space.
- External rear/right 80 mm exhaust fan.
- Upright vertical monitor reference frame above the bottom box.
- Hidden cable path from monitor to bottom box.
- Direction labels and intake/exhaust airflow arrows.

## Edit Dimensions

Most dimensions and placements live in `src/config.js`.

The component actual measurements are kept separate from placement values so the real hardware sizes remain unchanged while the layout can be adjusted.

## Fabrication Notes

The motherboard plate and screw/standoff points are visual communication features, not final drill drawings. Confirm the exact motherboard hole pattern from the real board before fabricating the plate.

## Online Image References

The browser viewer overlays representative Wikimedia Commons photos on the exact-size component blocks. These images are for recognition only and are not exact product models.

- Receipt printer: https://commons.wikimedia.org/wiki/File:Twitter_receipt_printer.jpg
- Motherboard: https://commons.wikimedia.org/wiki/File:Computer-motherboard.jpg
- SMPS: https://commons.wikimedia.org/wiki/File:Switch_Mode_Power_Supply.jpg
- Sound box: https://commons.wikimedia.org/wiki/File:Loudspeaker_enclosure.jpg
- Power strip: https://commons.wikimedia.org/wiki/File:Italian_power_strip.jpg
