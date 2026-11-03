# Portrait pipeline

Dev-only scripts that turned a photo into Oh Scarrr's 32×32 portrait in
[ohScarrr.ts](../../src/content/characters/ohScarrr.ts). Nothing here is bundled
into the game, and **the source photo is deliberately not stored in the repo**.
Keep photos outside the project folder.

`downscale.ps1` uses Windows' built-in System.Drawing. The other scripts need
only Node (no npm packages).

## Steps

Run from any folder outside the repo, for example a temp folder:

```bash
# 1. Crop a square around the head and shrink it to 32×32 pixels ("r,g,b" per pixel).
powershell -File tools/portrait/downscale.ps1 -Src photo.png -Out face32.txt -X 28 -Y 8 -Size 236 -W 32 -H 32

# 2. Reduce to 9 colours with k-means, sorted dark to light as a..i.
node tools/portrait/quantize.mjs face32.txt 9            # writes face32.txt.json

# 3. Swap those colours for the game palette by region (face vs shirt below row 26),
#    and make background colours touching the edge transparent.
node tools/portrait/stylize.mjs face32.txt.json face32s.json 26

# 4. Remove light fringe pixels on the outline and add a dark outline.
node tools/portrait/cleanup.mjs face32s.json face32c.json 2

# 5. Apply the hand fixes (outline gap, white collar) and print the rows to paste into ohScarrr.ts.
node tools/portrait/emit-portrait.mjs face32c.json face32f.json > rows.txt

# Any step: render one or more results side by side, scaled up, to check by eye.
node tools/portrait/preview.mjs compare.png 10 face32.txt.json face32f.json
```

## Things to know

- **Crop values:** the crop (`-X -Y -Size`) and the shirt row (`26`) were chosen for this one photo. A new photo needs new values; check each step with `preview.mjs`.
- **Hand fixes:** `emit-portrait.mjs` contains fixes for specific pixels in this portrait. Edit or remove them for another image.
- **Palette:** the colours in `stylize.mjs` match the skin, hair and shirt entries in [palette.ts](../../src/graphics/palette.ts). In the game, the palette letters are mapped to `COLORS`, so change colours there, not here.
- **Game sprite:** the 16×16 in-game sprite was drawn by hand in the same palette. The pipeline loses the eyes and headphones at that size.
