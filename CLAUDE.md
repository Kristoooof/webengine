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

A blokkon belül `@@ szakasz` sorok tagolnak: `feladat` (Markdown), `kód` (kezdő kód), `megoldás` (minta), `magyarázat` (akkor látszik, ha a tanulóé helyes, de 1,3–2× lassabb), `adott` (közös típusok, mindkét oldal látja), `esetek` (soronként egy Rust-kifejezés, `{:?}`-vel hasonlítjuk össze), `mérés` (előkészítés, `---`, mért kifejezés), `teszt-rossz` és `teszt-lassú` (csak a `npm run test:exercises` használja). A bíró a `src/lib/harness.ts`. A feladat a lecke utolsó `:::steps` blokkja elé kerül, „## Próbáld ki itt, a kurzusban” címmel. Új feladat után futtasd: `npm run test:exercises`.

## Stílus

- Magyar, tegező, barátságos, rövid mondatok. A szakszavak angolul is szerepeljenek (pl. „kölcsönzés (borrowing)”).
- Minden lecke 15–25 perc. Az első lépés legyen nagyon kicsi. A végén legyen valami, ami működik.
- A felépítés: cél → magyarázat (összehasonlítás C#/C++/Python/érettségi) → feladat → tesztek → tippek → megoldás → (mélyvíz) → lépések (a végén commit) → kvíz → 2–3 kártya → win → next.
- Mindig a böngészőhöz kötve tanítunk: minden példa HTML/CSS/layout/hálózat/JS-motor témájú.
- Nem csak másolásra tanítunk: a tesztek másolhatók, a megoldást a tanuló írja meg. A hibaüzenetek olvasását tanítjuk.
- Ne legyél bántóan szigorú ADHD-ügyben. A „soha ne hagyj ki kétszer” és a „egy lépés is számít” elv a lényeg.

## Architektúra (a tanuló `rozsda` repója, nem ez a repó)

`rozsda/` Cargo workspace: `crates/rozsda-core` (közös típusok, traitek: `HtmlParser` stb., `Implementation { Own, Pro }`), `crates/rozsda-html`, `crates/rozsda-browser` (minifb ablak, `Canvas`, bitmap font8x8, `layout::Line` display list), és a `gyakorlo/` az 1. modulból. A 3. modul után: `rozsda-core::dom` (arénás `Document`, `NodeId`, `NodeData`, `dump()` html5lib formátumban), a `HtmlParser::parse` `Document`-et ad; `rozsda-html::lexer` (WHATWG-állapotgép, ~20 állapot) és `rozsda-html::tree_builder` (nyitott elemek verme, hatókör, implicit zárások, adoption agency nélkül); a browserben `flatten.rs` alakítja a DOM-ot a 0.1-es `Page` blokklistává, amíg az 5. modulban el nem készül az igazi layout; `--dom` kapcsoló. A 6. modulban a minifb helyére winit + softbuffer jön.

## Az alkalmazás

Vite + TypeScript, keretrendszer nélkül, hash-router (`#/lecke/01-03`). Tárolás: `localStorage` (`rozsda.v1`), exportálható. Asztali változat: Tauri 2 (`src-tauri`). Ha a fájlnévben benne van a `portable`, az adatok az exe melletti `Rozsda-adatok` mappába kerülnek.
