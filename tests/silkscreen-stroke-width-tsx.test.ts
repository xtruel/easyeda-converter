import { expect, test } from "bun:test"
import { convertEasyEdaJsonToCircuitJson } from "lib/convert-easyeda-json-to-tscircuit-soup-json"
import { EasyEdaJsonSchema } from "lib/schemas/easy-eda-json-schema"
import { generateFootprintTsx } from "lib/websafe/generate-footprint-tsx"
import { runTscircuitCode } from "tscircuit"
import rawEasyEdaJson from "./assets/C393941.raweasy.json"

const getStrokeWidths = (circuitJson: any[], type: string) =>
  [
    ...new Set(
      circuitJson
        .filter((element) => element.type === type)
        .map((element) => element.stroke_width),
    ),
  ].sort()

test("generated footprint TSX keeps EasyEDA silkscreen stroke widths", async () => {
  const imported = convertEasyEdaJsonToCircuitJson(
    EasyEdaJsonSchema.parse(rawEasyEdaJson),
  )
  // C393941 draws its outline and pin-1 circle with 10 mil (0.254mm) lines.
  expect(getStrokeWidths(imported, "pcb_silkscreen_path")).toEqual([0.254])
  expect(getStrokeWidths(imported, "pcb_silkscreen_circle")).toEqual([0.254])

  const footprint = generateFootprintTsx(imported)
  const circuitJson = await runTscircuitCode(`
    export default () => (
      <board width="20mm" height="20mm">
        <chip name="U1" footprint={${footprint}} />
      </board>
    )
  `)

  expect(getStrokeWidths(circuitJson, "pcb_silkscreen_path")).toEqual([0.254])
  expect(getStrokeWidths(circuitJson, "pcb_silkscreen_circle")).toEqual([0.254])
})
