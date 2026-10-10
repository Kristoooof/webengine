# Rozsda kurzus: útmutató Claude-nak

A repó egy magyar nyelvű, ADHD-barát kurzus. A tanuló (Windows, inattentív ADHD, tud Pythont, C#-ot és egy kis C++-t, emelt infós érettségi szintű) egy saját böngészőmotort épít Rustban. Először minden alrendszert nulláról ír meg, a JS-motort és a hálózatot is. Később profi crate-ek jönnek, és a böngésző UI-jában egy kapcsolóval lehet váltani a saját és a profi implementáció között.

## Ha a tanuló a következő modult kéri

1. Nézd meg a `content/curriculum.ts` fájlban a modul leckéit (id, cím, perc). A címeket és a sorrendet módosíthatod, ha jobb lesz tőle, de az id-k formátuma `MM-LL` marad.
2. Írd meg a leckéket `content/lessons/MM-LL.md` néven, a meglévő leckék stílusában (lásd lent).
3. **Minden kódot ellenőrizz.** Építs egy referencia-crate-et a scratchpadben, amiben a leckék megoldásai *pontosan úgy* szerepelnek, ahogy a leckében, és futtasd le rajta a leckék tesztjeit (`cargo test`, `cargo clippy`). A checkpoint-kimeneteket valódi futásból másold.
4. `npm run check` (típusellenőrzés + `scripts/check-content.mjs`), `npm run test:exercises`, majd `npm run build`.
5. Commit, push. A Pages magától frissül. Új asztali kiadáshoz: tag (`vX.Y.Z`) vagy a Kiadás workflow kézi indítása.

## A leckék formátuma

Markdown, plusz `:::típus [cím]` … `:::` blokkok (nem ágyazhatók egymásba, de kódblokk lehet bennük):

| Blokk | Mire |
|---|---|
| `goal` | A lecke elején: 1–2 mondat, mi lesz a végére |
| `steps` | Kipipálható lista (`- ` sorok). A haladás mentődik |
| `task` | „Te jössz” feladat |
| `hint` | Lépcsőzetes tippek, `---` sorral elválasztva, egyre konkrétabbak |
| `solution` | Elrejtett megoldás |
| `quiz` | Kérdés, aztán `- [ ]` / `- [x]` opciók (pontosan egy helyes), és `> ` magyarázat |
| `card` | Ismétlőkártya: `K: kérdés` és `V: válasz` |
| `compare` | Fülek `@@ C#`, `@@ C++`, `@@ Python`, `@@ Rust`, `@@ Érettségi` címkékkel |
| `why` | „Mélyvíz”: opcionális háttér, összecsukva |
| `note`, `tip`, `warn`, `adhd`, `checkpoint` | Kiemelt dobozok |
| `win`, `next` | A lecke végén: mit építettél, mi jön |
| `exercise` | Beépített kódolós feladat (lásd lent) |

Kódblokkok: a ` ```rust test ` blokk másolható tesztet jelent. A `bash`, `powershell`, `toml`, `json`, `html` és `css` is másolható. A sima ` ```rust ` blokkon „gépeld be” jelzés van, mert a megoldás-kódot a tanulónak be kell gépelnie.

## Beépített feladatok (`:::exercise Cím`)

A blokkon belül `@@ szakasz` sorok tagolnak: `feladat` (Markdown), `kód` (kezdő kód), `megoldás` (minta), `magyarázat` (akkor látszik, ha a tanulóé helyes, de 1,3–2× lassabb), `adott` (közös típusok és segédfüggvények, `pub` elemekkel; a tanuló is látja „Adott kód” néven, az esetek és a mérés is használhatja), `esetek` (soronként egy Rust-kifejezés, `{:?}`-vel hasonlítjuk össze), `mérés` (előkészítés, `---`, mért kifejezés), `teszt-rossz` és `teszt-lassú` (csak a `npm run test:exercises` használja). A bíró a `src/lib/harness.ts`. A feladat a lecke utolsó `:::steps` blokkja elé kerül, „## Próbáld ki itt, a kurzusban” címmel. Új feladat után futtasd: `npm run test:exercises`.

## Stílus

- Magyar, tegező, barátságos, rövid mondatok. A szakszavak angolul is szerepeljenek (pl. „kölcsönzés (borrowing)”).
- Minden lecke 15–25 perc. Az első lépés legyen nagyon kicsi. A végén legyen valami, ami működik.
- A felépítés: cél → magyarázat (összehasonlítás C#/C++/Python/érettségi) → feladat → tesztek → tippek → megoldás → (mélyvíz) → lépések (a végén commit) → kvíz → 2–3 kártya → win → next.
- Mindig a böngészőhöz kötve tanítunk: minden példa HTML/CSS/layout/hálózat/JS-motor témájú.
- Nem csak másolásra tanítunk: a tesztek másolhatók, a megoldást a tanuló írja meg. A hibaüzenetek olvasását tanítjuk.
- Ne legyél bántóan szigorú ADHD-ügyben. A „soha ne hagyj ki kétszer” és a „egy lépés is számít” elv a lényeg.

## Architektúra (a tanuló `rozsda` repója, nem ez a repó)

`rozsda/` Cargo workspace: `crates/rozsda-core` (közös típusok, traitek: `HtmlParser` stb., `Implementation { Own, Pro }`), `crates/rozsda-html`, `crates/rozsda-browser` (minifb ablak, `Canvas`, bitmap font8x8, `layout::Line` display list), és a `gyakorlo/` az 1. modulból. A 3. modul után: `rozsda-core::dom` (arénás `Document`, `NodeId`, `NodeData`, `dump()` html5lib formátumban), a `HtmlParser::parse` `Document`-et ad; `rozsda-html::lexer` (WHATWG-állapotgép, ~20 állapot) és `rozsda-html::tree_builder` (nyitott elemek verme, hatókör, implicit zárások, adoption agency nélkül); a browserben `flatten.rs` alakítja a DOM-ot a 0.1-es `Page` blokklistává, amíg az 5. modulban el nem készül az igazi layout; `--dom` kapcsoló. A 4. modul után: `crates/rozsda-css` (`tokenizer`, `selector` (parse, `Specificity`, jobbról balra illesztés), `parser` (`Stylesheet`/`Rule`/`Declaration`, az érték nyers `Vec<Token>`), `value` (`Value`, `Unit`), `cascade` (`Origin`, kulcs: (szint, inline, specificitás, sorrend), csak `display`, `color`, `background-color`, `font-size`, `font-weight` és a `background` rövidítés), `computed`, `ua.css` + `style_document`, `dump_styles`, `OwnStyleEngine`); a core-ban `style` (`Color`, `Display`, `ComputedStyle`, `StyleMap`) és `StyleEngine` trait; a `Block` stílust kap, a `BlockKind` csak `Paragraph`/`ListItem`; a `flatten` a `display` alapján dönt; `--css=sajat|profi` és `--stilus` kapcsoló; tag: `v0.1.6`. Az 5. modul után: a core-ban `layout` (`Rect`, `Sides<T>`, `Dimensions`, `BoxKind { Block(NodeId), Anonymous }`, `TextFragment`, `LineBox`, `LayoutBox`) és `LayoutEngine` trait; a `Page`/`Block`/`BlockKind` törölve; a `ComputedStyle` kapott `margin`/`padding` (`Sides<Size>`, `Size` = `Px`/`Percent`/`Auto`), `border_width`, `border_style`, `border_color`, `width`, `height` mezőt; `rozsda-css::shorthand` (`margin`, `padding`, `border` rövidítések, a kaszkád `expand`-ja), 17 UA-szabály; `crates/rozsda-layout` (`text` (8×8-as metrika: `glyph_scale = round(font_size/8)`, karakter 8×, sor 12×), `tree` (névtelen blokkok, csak-szóköz inline futam eldobva), `block` (CSS 2.1 10.3.3 szélesség, csak a pozitív testvérmargók omlanak össze, szülő-gyerek nem), `inline` (futamok → szavak darabokkal → mohó `LineBuilder`, strut, alulra igazítás, hosszú szó kilóg), `dump` (`--dobozok` formátum), `layout_document`, `OwnLayoutEngine`); a browserben a `flatten.rs` és a `layout.rs` helyett `paint.rs` (html/body háttér a vásznon, keret 4 téglalap, `»` jel); `--layout=sajat|profi`, `--dobozok`, `--keretek`; tag: `v0.1.7`. A 6. modul után: a core-ban `display` (`DisplayItem { Rect, Border, Text }` a `radius`-szal, `bounds()`), a `ComputedStyle` kapott `border_radius` és `underline` (`text-decoration`, öröklődőnek véve) mezőt, a UA-ban `a { … text-decoration: underline }`; a `Document::add_missing_attrs`, és a fa-építő megőrzi a `<html>`/`<body>` attribútumait; a browserben a minifb helyett winit 0.30 + softbuffer 0.4 (`app.rs`: `ApplicationHandler`, `Rc<Window>`, eseményvezérelt rajzolás), `page.rs` (`Engines`, `Page::open/load/resize`, `resolve_link`), `paint.rs` (layout-fa → rajzlista, aláhúzás), `raster.rs` (alpha blending, nem fedő keretcsíkok, `inside_rounded` + 4×4 szupermintavételezés, culling), `canvas.rs` (`blend`, `fill_rect(Color)`, a `put_pixel` törölve), `scroll.rs`, `hit.rs` (`hit_test`, `link_at`), `png.rs` (CRC-32, Adler-32, tárolt deflate-blokkok); `--lista`, `--kep=fajl.png`, linkek kattintása, Backspace = vissza; képernyőkép-teszt: `tests/kepek/kartya.png`; tag: `v0.2.0`. A 7. modul után: `crates/rozsda-font` (DejaVu Sans 2.37 a `fonts/` mappában, `include_bytes!`, `DEJAVU_SANS`; `reader` (big-endian `Reader`), `table_directory`, `Font::parse` + `FontError`, `glyf` (loca, egyszerű és összetett glifek, mélységkorlát 8), `outline` (`Transform` y-tükrözéssel, kimondatlan pontok, `flatten_quad` n = ⌈√|p0−2c+p1|⌉), `raster` (4 alsor/pixel, vízszintesen pontos lefedettség, nemnulla szabály, prefix sum, `GlyphBitmap`), `cmap` (4-es formátum, bináris keresés, range offset), `metrics` (`hmtx`, `kern` 0-s formátum, `impl FontMetrics for Font`)); a core-ban `text::FontMetrics` (`text_width`, `ascent`, `descent`, alapértelmezett `line_height`, `underline`), a `LayoutEngine::layout` `fonts` paramétert kap; a layoutban `BitmapFont` (8×8: ascent 9×, descent 3×) és alapvonal-igazítás a `finish_line`-ban; a `DisplayItem::Text` `scale` helyett `baseline` és `size`, a `DisplayItem::scaled(zoom)`; a browserben `fonts.rs` (`Typeface { Bitmap, Vector(Font) }`, `draw_text`, `blit`, glif-gyorsítótár nincs), `Engines::font` és `Engines::zoom`, `Page::zoom` (a layout CSS-pixelben, a rajzlista fizikai pixelben), `LogicalSize`, `scale_factor`, `ScaleFactorChanged`, a `fill` az éleket kerekíti; `--betu=vektor|bitkep`, `--nagyitas=1.5`; reftestek a `page.rs`-ben; a `kartya.png` vektoros betűkkel; tag: `v0.2.1`. A `white-space: pre` és a monospace font a 14-10-ben jön.

## Graphify: kérdezd a gráfot, ne olvass végig mindent

- A kódról (app, `src-tauri`, szkriptek) **előbb a gráftól kérdezz**: `graphify query "<kérdés>" --budget 800`, `graphify explain "<név>"`, `graphify path "A" "B"` (a bináris: `graphify` vagy `/home/user/.venvs/graphify/bin/graphify`). Csak azt a fájlrészt olvasd be utána, amire a válasz mutat.
- A gráf (`graphify-out/`, nincs a gitben) minden kör végén magától frissül: a `.claude/settings.json` Stop hookja lefuttatja a `graphify update .`-et. Ha a gráf hiányzik (új konténer), előbb: `graphify update .`.
- A leckék (`content/lessons/*.md`) nincsenek a kódgráfban: ott `grep`-pel keresd meg a kellő részt, és csak azt olvasd be.

## Az alkalmazás

Vite + TypeScript, keretrendszer nélkül, hash-router (`#/lecke/01-03`). Tárolás: `localStorage` (`rozsda.v1`), exportálható. Asztali változat: Tauri 2 (`src-tauri`). Ha a fájlnévben benne van a `portable`, az adatok az exe melletti `Rozsda-adatok` mappába kerülnek.
