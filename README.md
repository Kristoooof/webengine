# Rozsda: építs saját böngészőmotort Rustban

ADHD-barát, magyar nyelvű kurzus. Nulláról, saját kézzel építesz egy böngészőmotort Rustban: HTML-parsert, CSS-motort, layoutot, raszterizálót, betűkezelést, hálózatot, TLS-t és JavaScript-motort. Utána mindegyik mellé bekötünk egy profi, iparban használt crate-et, és a böngészőben egy **kapcsolóval** választhatsz a saját és a profi megoldás között. A végén bővítmények, DevTools és telepítő jön.

- **Weboldal:** a GitHub Pages-en (a repó *About* részében található link)
- **Asztali app:** a [Releases](../../releases) oldalon: telepítő (`setup.exe`, `.msi`) és hordozható (`portable.exe`) változat Windowsra

## Mitől jó ADHD-val?

- 15–25 perces leckék, mindegyik végén van valami, ami működik
- **Folytatom** gomb és **Csak 5 perc** mód: a kezdés szinte semmibe nem kerül
- Kipipálható lépések, és egy *üzenet a jövőbeli önmagadnak* minden lecke végén
- Fókusz-időzítő, Ötletparkoló, sorozat, XP, aktivitás-térkép
- Lépcsőzetes tippek, elrejtett megoldás, ismétlőkártyák (Leitner-rendszer)
- C#, C++ és Python összehasonlítások ott, ahol a Rust más
- **Beépített kódolós feladatok:** a leckében írod meg a kódot, a kurzus lefordítja, sok bemenettel összeveti a mintamegoldással, és megméri a sebességét is. Nem a kód szövegét nézi, hanem azt, hogy ugyanazt csinálja-e
- A kurzus megjegyzi, hol jártál a leckében, és ott folytatod

## Tartalom

21 modul, 186 lecke, 5 felvonásban. Az első 60 lecke (Indulás, Rust alapok, Rozsda 0.1, szabványkövető HTML-parser és DOM, saját CSS-motor, saját layout-motor) teljesen kész. A többi modulonként érkezik. A leckék a [`content/lessons`](content/lessons) mappában vannak Markdownban, a tanmenet a [`content/curriculum.ts`](content/curriculum.ts) fájlban.

## Fejlesztés

```bash
npm install
npm run dev          # webes változat: http://localhost:5173
npm run check        # típusellenőrzés + leckék ellenőrzése
npm run test:exercises  # a beépített feladatok ellenőrzése (rustc kell hozzá)
npm run build        # statikus build a dist/ mappába
npm run tauri dev    # asztali változat (Rust + Tauri kell hozzá)
npm run tauri build  # asztali telepítő
```

## Kiadás

- **Weboldal:** minden push automatikusan kikerül a GitHub Pages-re (`.github/workflows/pages.yml`).
- **Asztali app:** egy `v*` tag pusholása (pl. `git tag v0.2.0 && git push --tags`), vagy az *Actions → Kiadás → Run workflow* gomb Windows-telepítőt, MSI-t és portable exe-t készít, és GitHub Release-be teszi (`.github/workflows/release.yml`).

## A beépített feladatok

Az asztali app a gépen lévő `rustc`-vel fordít (ha nincs, a Rust Playgroundot használja), a weboldal a [Rust Playgroundon](https://play.rust-lang.org) futtat. A bírálat:

| Eredmény | Mikor |
|---|---|
| Helyes megoldás | minden eset egyezik, és legfeljebb 1,3× lassabb a mintánál |
| Helyes, de van optimálisabb | minden eset egyezik, 1,3–2× lassabb; ilyenkor a kurzus elmagyarázza a mintát |
| Nem jó megoldás | valamelyik eset eltér, vagy több mint 2× lassabb |

## Felépítés

```
content/            a kurzus tartalma (tanmenet, leckék, fogalomtár)
src/                a kurzus-alkalmazás (Vite + TypeScript, keretrendszer nélkül)
  lib/              tárolás, markdown-renderelő, időzítő, ikonok,
                    feladat-bíráló (harness.ts), futtató (runner.ts), szerkesztő (editor.ts)
  views/            kezdőlap, térkép, lecke, ismétlés, fogalomtár, beállítások
src-tauri/          az asztali változat (Tauri 2)
scripts/            tartalomellenőrző, feladat-tesztelő
```
