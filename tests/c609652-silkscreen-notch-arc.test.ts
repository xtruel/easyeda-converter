import { expect, test } from "bun:test"
import { convertEasyEdaJsonToCircuitJson } from "lib/convert-easyeda-json-to-tscircuit-soup-json"
import { EasyEdaJsonSchema } from "lib/schemas/easy-eda-json-schema"
import rawEasyEdaJson from "./assets/C609652.raweasy.json"

// C609652's SOIC-20 body outline has a pin-1 notch drawn as
// "M 3981.0133 3000.1912 A 3.25 3.25 0 0 1 3980.9133 3006.6912". The endpoints
// are 1 mil apart in x, so the chord (6.5008) is slightly longer than 2r. SVG
// (and EasyEDA) scale such radii up and draw a semicircle; it must not
// collapse into a straight line.
test("C609652 pin-1 notch arc is drawn as a semicircle, not a flat chord", () => {
  const circuitJson = convertEasyEdaJsonToCircuitJson(
    EasyEdaJsonSchema.parse(rawEasyEdaJson),
  )
  const notchArcs = circuitJson.filter(
    (e) =>
      e.type === "pcb_silkscreen_path" &&
      e.pcb_silkscreen_path_id.startsWith("pcb_silkscreen_arc_") &&
      e.route.length >= 2 &&
      Math.abs(e.route[0]!.y - e.route.at(-1)!.y) > 1.6,
  )
  expect(notchArcs).toHaveLength(1)
  const route =
    notchArcs[0]!.type === "pcb_silkscreen_path" ? notchArcs[0]!.route : []

  expect(route.length).toBeGreaterThan(2)
  const xs = route.map((p) => p.x)
  // A semicircle of radius 3.25 x 10 mil bulges ~0.8255mm from its chord.
  expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.8)
  // The notch bows into the package body (towards the footprint center).
  expect(Math.max(...xs)).toBeGreaterThan(route[0]!.x + 0.7)
})
