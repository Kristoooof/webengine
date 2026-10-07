# Rozsda kurzus: útmutató Claude-nak

A repó egy magyar nyelvű, ADHD-barát kurzus. A tanuló (Windows, inattentív ADHD, tud Pythont, C#-ot és egy kis C++-t, emelt infós érettségi szintű) egy saját böngészőmotort épít Rustban. Először minden alrendszert nulláról ír meg, a JS-motort és a hálózatot is. Később profi crate-ek jönnek, és a böngésző UI-jában egy kapcsolóval lehet váltani a saját és a profi implementáció között.

## Ha a tanuló a következő modult kéri

1. Nézd meg a `content/curriculum.ts` fájlban a modul leckéit (id, cím, perc). A címeket és a sorrendet módosíthatod, ha jobb lesz tőle, de az id-k formátuma `MM-LL` marad.
2. Írd meg a leckéket `content/lessons/MM-LL.md` néven, a meglévő leckék stílusában (lásd lent).
3. **Minden kódot ellenőrizz.** Építs egy referencia-crate-et a scratchpadben, amiben a leckék megoldásai *pontosan úgy* szerepelnek, ahogy a leckében, és futtasd le rajta a leckék tesztjeit (`cargo test`, `cargo clippy`). A checkpoint-kimeneteket valódi futásból másold.
4. `npm run check` (típusellenőrzés + `scripts/check-content.mjs`), majd `npm run build`.
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

Kódblokkok: a ` ```rust test ` blokk másolható tesztet jelent. A `bash`, `powershell`, `toml`, `json`, `html` és `css` is másolható. A sima ` ```rust ` blokkon „gépeld be” jelzés van, mert a megoldás-kódot a tanulónak be kell gépelnie.

## Stílus

- Magyar, tegező, barátságos, rövid mondatok. A szakszavak angolul is szerepeljenek (pl. „kölcsönzés (borrowing)”).
- Minden lecke 15–25 perc. Az első lépés legyen nagyon kicsi. A végén legyen valami, ami működik.
- A felépítés: cél → magyarázat (összehasonlítás C#/C++/Python/érettségi) → feladat → tesztek → tippek → megoldás → (mélyvíz) → lépések (a végén commit) → kvíz → 2–3 kártya → win → next.
- Mindig a böngészőhöz kötve tanítunk: minden példa HTML/CSS/layout/hálózat/JS-motor témájú.
- Nem csak másolásra tanítunk: a tesztek másolhatók, a megoldást a tanuló írja meg. A hibaüzenetek olvasását tanítjuk.
- Ne legyél bántóan szigorú ADHD-ügyben. A „soha ne hagyj ki kétszer” és a „egy lépés is számít” elv a lényeg.

## Architektúra (a tanuló `rozsda` repója, nem ez a repó)

`rozsda/` Cargo workspace: `crates/rozsda-core` (közös típusok, traitek: `HtmlParser` stb., `Implementation { Own, Pro }`), `crates/rozsda-html`, `crates/rozsda-browser` (minifb ablak, `Canvas`, bitmap font8x8, `layout::Line` display list), és a `gyakorlo/` az 1. modulból. A 3. modulban a `Page`-et egy DOM (`Document`, arénás `NodeId`) váltja fel. A 6. modulban a minifb helyére winit + softbuffer jön.

## Az alkalmazás

Vite + TypeScript, keretrendszer nélkül, hash-router (`#/lecke/01-03`). Tárolás: `localStorage` (`rozsda.v1`), exportálható. Asztali változat: Tauri 2 (`src-tauri`). Ha a fájlnévben benne van a `portable`, az adatok az exe melletti `Rozsda-adatok` mappába kerülnek.
