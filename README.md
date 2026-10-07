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

## Tartalom

21 modul, 180 lecke, 5 felvonásban. Az első 27 lecke (Indulás, Rust alapok, Rozsda 0.1) teljesen kész. A többi modulonként érkezik. A leckék a [`content/lessons`](content/lessons) mappában vannak Markdownban, a tanmenet a [`content/curriculum.ts`](content/curriculum.ts) fájlban.

## Fejlesztés

```bash
npm install
npm run dev          # webes változat: http://localhost:5173
npm run check        # típusellenőrzés + leckék ellenőrzése
npm run build        # statikus build a dist/ mappába
npm run tauri dev    # asztali változat (Rust + Tauri kell hozzá)
npm run tauri build  # asztali telepítő
```

## Kiadás

- **Weboldal:** minden push automatikusan kikerül a GitHub Pages-re (`.github/workflows/pages.yml`).
- **Asztali app:** egy `v*` tag pusholása (pl. `git tag v0.2.0 && git push --tags`), vagy az *Actions → Kiadás → Run workflow* gomb Windows-telepítőt, MSI-t és portable exe-t készít, és GitHub Release-be teszi (`.github/workflows/release.yml`).

## Felépítés

```
content/            a kurzus tartalma (tanmenet, leckék, fogalomtár)
src/                a kurzus-alkalmazás (Vite + TypeScript, keretrendszer nélkül)
  lib/              tárolás, markdown-renderelő, időzítő, ikonok
  views/            kezdőlap, térkép, lecke, ismétlés, fogalomtár, beállítások
src-tauri/          az asztali változat (Tauri 2)
scripts/            tartalomellenőrző
```
