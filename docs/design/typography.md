# Typography and Unicode verification

**Why this document exists:** Yoruba tone marks and the Igbo dotted vowels are the most common way
African-language software breaks silently. The blueprint makes correct rendering a launch
acceptance gate (§2.3, §15.2), so the fonts were verified empirically rather than assumed.

---

## 1. The problem

A text that *looks* right can be wrong in three ways:

1. **Missing glyphs.** The characters `ẹ ọ ị ụ ṣ` (U+1EB8–U+1EE5) live in *Latin Extended
   Additional*, not in *Latin-1* or *Latin Extended-A*. Most web fonts ship a `latin-ext` subset that
   covers Vietnamese and Polish but **omits these six letters**. The browser then renders them from
   a fallback font, mid-word. Result: mismatched letterforms, wrong weight, wrong baseline, and
   broken `font-weight` inheritance.
2. **Missing mark positioning.** `ẹ́` and `ọ̀` combine a base letter with a tone mark. Without GPOS
   mark-attachment lookups, the mark floats or collides.
3. **Normalisation damage.** `E` + U+0323 must normalise to `Ẹ` (NFC) without losing the mark.

## 2. What was tested

Every candidate was inspected with `fontTools` for (a) presence of the required code points and
(b) GPOS `MarkBasePos` / `MarkMarkPos` lookups.

| Font / subset | Glyphs | `ẹ ọ ị ụ` present | Mark positioning | Verdict |
|---|---|---|---|---|
| Inter `latin-ext` | 733 | **no** | yes | rejected |
| Fraunces `latin-ext` | 289 | **no** | none | rejected |
| Public Sans `latin-ext` | 220 | **no** | yes | rejected |
| Source Serif 4 `latin-ext` | 276 | **no** | yes | rejected |
| Newsreader `latin-ext` | 229 | **no** | yes | rejected |
| Figtree `latin-ext` | 136 | **no** | yes | rejected |
| Gentium Plus `latin-ext` | 836 | **no** | yes | rejected |
| Charis SIL `latin-ext` | 836 | **no** | yes | rejected |
| Noto Sans **full** | 2,840 | **yes** | yes (precomposed) | **selected for UI** |
| Gentium Plus **full** | 2,783 | **yes** | yes | **selected for content** |
| Atkinson Hyperlegible | 342 | no | yes | rejected |

Note the two rows that matter: the `latin-ext` subsets of Gentium Plus and Charis SIL are **missing
the very characters their full versions contain**. Subsetting for file size is exactly how this bug
reaches production, which is why the shipped files were cut from the full faces with an explicit
Unicode range that includes U+1E00–U+1EFF.

## 3. What ships

| File | Source | Size | Role |
|---|---|---|---|
| `public/fonts/wazobia-sans.woff2` | Noto Sans variable (wght 100–900) | 251 KB | Interface chrome |
| `public/fonts/wazobia-serif.woff2` | Gentium Plus Regular | 53 KB | African-language content |
| `public/fonts/wazobia-serif-italic.woff2` | Gentium Plus Italic | 60 KB | Quotations, citations |

Subset range: `U+0020–007E, U+00A0–017F, U+0180–024F, U+0250–02FF, U+0300–036F, U+1E00–1EFF,
U+2000–206F, U+20A0–20CF, U+2190–21FF, U+2212, U+2264–2265`.

Verified after subsetting: 1,296 / 1,212 glyphs, `Ẹ ẹ Ọ ọ Ṣ ṣ Ị ị Ụ ụ` present, `ɓ ɗ ƙ ƴ` present,
combining marks U+0300/0301/0303/0323/0304 present, `₦` present, GPOS mark attachment retained.

Both faces are **SIL Open Font License 1.1**; the licence texts ship in `public/fonts/`.

## 4. Rendering rules

- African-language content is rendered in the serif, where mark positioning is strongest:
  `:lang(yo)`, `:lang(ha)`, `:lang(ig)` are set in `src/index.css`.
- Every element containing language text carries a correct `lang` attribute, so screen readers
  switch pronunciation and the browser picks the right face.
- Text is UTF-8 end to end (`<meta charset>`, JSON bodies, SQL). No `normalize()` is applied to
  stored or displayed text; normalisation is only used for *comparison* in search.
- Tone marks are authored in the data, never injected by the UI.

## 5. Runtime test coverage

`src/test/unicode.test.ts` asserts:

- `Ẹ ẹ Ọ ọ Ṣ ṣ Ị ị Ụ ụ ɓ ɗ ƙ ƴ` each have `length === 1` and survive `NFC` unchanged;
- `E` + U+0323 normalises to `Ẹ`;
- the Yoruba endonym is `Yorùbá` and is never reduced to `Yoruba`.

## 6. Replacing the fonts

If the brand later specifies a typeface, it must pass the same check before adoption:

```bash
pip install fonttools brotli
python3 - <<'PY'
from fontTools.ttLib import TTFont
t = TTFont('candidate.woff2'); c = t.getBestCmap()
need = [0x1EB8,0x1EB9,0x1ECC,0x1ECD,0x1E62,0x1E63,0x1ECA,0x1ECB,0x1EE4,0x1EE5,0x0301,0x0323]
print('missing:', [hex(n) for n in need if n not in c])
PY
```
