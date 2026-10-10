// A teljes tanmenet. A leckék szövege a content/lessons/<id>.md fájlokban van;
// ha egy leckéhez még nincs fájl, a térképen "Hamarosan" jelzéssel látszik.

export interface LessonMeta {
  id: string; // "MM-LL"
  title: string;
  minutes: number;
}

export interface ModuleMeta {
  id: string; // "MM"
  act: number;
  title: string;
  tagline: string;
  outcomes: string[];
  lessons: LessonMeta[];
}

export interface Act {
  n: number;
  title: string;
  subtitle: string;
}

export const ACTS: Act[] = [
  { n: 1, title: "Alapozás", subtitle: "Rust, eszközök és egy apró, de működő böngésző" },
  { n: 2, title: "Saját motor", subtitle: "HTML, CSS, layout, rajzolás és betűk, mind nulláról" },
  { n: 3, title: "Saját hálózat és JavaScript", subtitle: "TCP-től TLS-ig, lexertől a szemétgyűjtőig" },
  { n: 4, title: "Az igazi web", subtitle: "Modern CSS, képek, és a nagy kapcsoló a profi crate-ekre" },
  { n: 5, title: "Bővítmények és kiadás", subtitle: "Extension API, DevTools és a Rozsda 1.0" },
];

type L = [string, string, number];

function mod(
  id: string,
  act: number,
  title: string,
  tagline: string,
  outcomes: string[],
  lessons: L[],
): ModuleMeta {
  return {
    id,
    act,
    title,
    tagline,
    outcomes,
    lessons: lessons.map(([n, t, m]) => ({ id: `${id}-${n}`, title: t, minutes: m })),
  };
}

export const MODULES: ModuleMeta[] = [
  mod("00", 1, "Indulás", "Felállítjuk a műhelyt, és megérted, mit fogunk építeni.", [
    "Működő Rust fejlesztőkörnyezet Windowson",
    "Git + GitHub mentés, hogy semmi ne vesszen el",
    "Érted, hogyan lesz egy URL-ből kép a képernyőn",
  ], [
    ["01", "Hogyan működik ez a kurzus?", 10],
    ["02", "Rust telepítése Windowsra", 20],
    ["03", "VS Code, rust-analyzer és az első program", 15],
    ["04", "Git és GitHub: soha ne veszítsd el a munkád", 20],
    ["05", "Hogyan működik egy böngésző? A nagy kép", 20],
    ["06", "A Rozsda terve: modulok és a nagy kapcsoló", 15],
  ]),
  mod("01", 1, "Rust alapok, böngészős szemmel", "A nyelv, amit tanulsz, mindig a motorhoz kötve.", [
    "Ownership és borrowing: ahol a Rust más, mint a C++ vagy a C#",
    "Struct, enum, match, Option, Result",
    "Traitek: erre épül később a saját/profi kapcsoló",
    "Egy saját mini tokenizer tesztekkel",
  ], [
    ["01", "Változók és típusok: a fordító mint tanár", 20],
    ["02", "Függvények, kifejezések és az első teszted", 20],
    ["03", "Vezérlés: if, loop, while, for", 20],
    ["04", "Ownership: kié a String?", 25],
    ["05", "Kölcsönzés: &str, &String és &mut", 25],
    ["06", "Struct és impl: az első Token", 20],
    ["07", "Enum és match: minden tokenfajta egy helyen", 25],
    ["08", "Option és Result: hibák pánik nélkül", 25],
    ["09", "Vec, slice-ok és karakterek", 25],
    ["10", "Iterátorok és closure-ök", 25],
    ["11", "Modulok, crate-ek és a Cargo", 20],
    ["12", "Traitek: a nagy kapcsoló alapja", 25],
    ["13", "Főnöki pálya: szövegből tagek és szavak", 25],
  ]),
  mod("02", 1, "Gyors győzelem: Rozsda 0.1", "Egy délután alatt egy apró, de igazi ablakban futó böngésző.", [
    "Cargo workspace több crate-tel",
    "Saját ablak, pixelek, bitmap betűk",
    "Sortörés és görgetés",
    "Az első kiadott verziód (git tag)",
  ], [
    ["01", "Cargo workspace: a Rozsda váza", 20],
    ["02", "A core crate: traitek a kapcsolóhoz", 25],
    ["03", "Fájl beolvasása és naiv tag-eltávolítás", 20],
    ["04", "Ablak nyitása: pixelek a képernyőn", 25],
    ["05", "Betűk rajzolása bitmap fonttal", 25],
    ["06", "Sortörés és görgetés", 25],
    ["07", "Parancssori argumentumok és rendes hibakezelés", 20],
    ["08", "Mérföldkő: Rozsda 0.1", 20],
  ]),
  mod("03", 2, "HTML: tokenizer és DOM", "A szabvány szerinti állapotgéptől a hibatűrő DOM-fáig.", [
    "WHATWG-szabvány olvasása túlélőként",
    "Állapotgép-alapú tokenizer attribútumokkal és karakterhivatkozásokkal",
    "DOM-fa arénával és NodeId-kkal",
    "Hibatűrő fa-építés, html5lib-formátumú snapshot tesztek",
  ], [
    ["01", "Mit mond a szabvány? A WHATWG HTML olvasása", 20],
    ["02", "Állapotgép: a tokenizer szíve", 25],
    ["03", "Kezdő- és zárótagek", 25],
    ["04", "Attribútumok", 25],
    ["05", "Kommentek és DOCTYPE", 20],
    ["06", "Karakterhivatkozások és nyers szöveg", 25],
    ["07", "DOM: fa Rustban, aréna és NodeId", 25],
    ["08", "A DOM kiírása és snapshot tesztek", 20],
    ["09", "Fa-építés: a nyitott elemek verme", 25],
    ["10", "Hibatűrés: amikor a HTML rossz", 25],
    ["11", "Bekötés a kapcsolóba: Rozsda 0.1.5", 25],
  ]),
  mod("04", 2, "CSS: parser és kaszkád", "Szabályokból végső, számított értékek minden elemre.", [
    "CSS-tokenizer és -parser hibatűréssel",
    "Szelektorok, specificitás, illesztés jobbról balra",
    "Kaszkád, öröklődés, számított értékek, user-agent stíluslap",
    "A böngésző a CSS alapján színez: Rozsda 0.1.6",
  ], [
    ["01", "A CSS nyelvtana dióhéjban", 20],
    ["02", "CSS-tokenizer I: szavak és jelek", 25],
    ["03", "CSS-tokenizer II: számok és stringek", 25],
    ["04", "Szelektorok parse-olása", 25],
    ["05", "Szabályok és deklarációk", 25],
    ["06", "Értékek: hosszok, kulcsszavak, színek", 25],
    ["07", "Specificitás", 20],
    ["08", "Szelektor-illesztés a DOM-ra", 25],
    ["09", "Kaszkád: honnan jön a végső érték?", 25],
    ["10", "Öröklődés és számított értékek", 25],
    ["11", "User-agent stíluslap és a stílusfa", 20],
    ["12", "Bekötés: színes Rozsda 0.1.6", 25],
  ]),
  mod("05", 2, "Layout: dobozok a térben", "Hol legyen és mekkora legyen minden doboz.", [
    "Doboz-modell, margó, keret, kitöltés, rövidítések",
    "Layout-fa névtelen blokkokkal",
    "Blokkok szélessége, magassága, összeomló margók",
    "Inline formázás: szavak, sortörés, vegyes stílusú sorok",
    "Rozsda 0.1.7: hátterek, keretek, félkövér szavak a sorokban",
  ], [
    ["01", "A doboz-modell: margin, border, padding", 20],
    ["02", "Doboz-tulajdonságok és egységek", 25],
    ["03", "Rövidítések: margin, padding, border", 20],
    ["04", "A layout-fa: block, inline, névtelen", 25],
    ["05", "Blokkok szélessége", 25],
    ["06", "Magasság, pozíció és összeomló margók", 25],
    ["07", "Inline formázás: szavak és darabok", 25],
    ["08", "Szövegmérés és sortörés", 25],
    ["09", "Layout-kiírás és snapshot tesztek", 20],
    ["10", "Bekötés: dobozok a képernyőn (Rozsda 0.1.7)", 25],
  ]),
  mod("06", 2, "Rajzolás és ablak", "Display list, saját raszterizáló, igazi ablak, kattintható linkek.", [
    "Display list és saját szoftveres raszterizáló",
    "Alpha blending, szegélyek, lekerekítés",
    "winit + softbuffer ablak, görgetés, hit testing",
    "Saját PNG-író a képernyőkép-tesztekhez",
  ], [
    ["01", "Display list: mit kell kirajzolni?", 20],
    ["02", "Saját raszterizáló: téglalapok és átlátszóság", 25],
    ["03", "Szegélyek és lekerekített sarkok", 25],
    ["04", "winit + softbuffer: igazi ablak", 25],
    ["05", "Görgetés és újrarajzolás", 20],
    ["06", "Linkek kattintása: hit testing", 25],
    ["07", "Képernyőkép-tesztek saját PNG-íróval", 25],
    ["08", "Mérföldkő: Rozsda 0.2", 20],
  ]),
  mod("07", 2, "Betűk és szöveg", "TrueType-olvasó és élsimított glif-raszterizálás nulláról.", [
    "TrueType fájlok felépítése",
    "Bézier-görbék raszterizálása élsimítással",
    "Unicode, UTF-8, ékezetek",
  ], [
    ["01", "Hogyan működnek a betűtípusok?", 20],
    ["02", "TTF fájl olvasása: táblák", 25],
    ["03", "Glifek kontúrjai: glyf és loca", 25],
    ["04", "Bézier-görbék: kontúrból egyenesek", 25],
    ["05", "Raszterizálás élsimítással", 25],
    ["06", "cmap: karakterből glif", 20],
    ["07", "Ékezetek: összetett glifek és UTF-8", 25],
    ["08", "Szélesség és kerning", 20],
    ["09", "Alapvonal: a layout megkapja a betűtípust", 25],
    ["10", "Glifek a vásznon", 20],
    ["11", "Bekötés: igazi betűk a böngészőben", 25],
    ["12", "Éles betűk nagyított kijelzőn (Rozsda 0.2.1)", 20],
  ]),
  mod("08", 3, "Hálózat nulláról", "URL-től a gzip-elt HTTP-válaszig, mind saját kód.", [
    "WHATWG URL parser",
    "Saját DNS-kliens UDP felett",
    "HTTP/1.1 kliens, chunked, átirányítás",
    "Saját DEFLATE-dekóder",
  ], [
    ["01", "Hogyan utazik egy weboldal? TCP/IP dióhéjban", 20],
    ["02", "URL parser a szabvány szerint", 25],
    ["03", "DNS: névből IP-cím, saját klienssel", 25],
    ["04", "TCP kapcsolat std::net-tel", 20],
    ["05", "HTTP/1.1 kérés kézzel", 20],
    ["06", "Válasz: státusz, fejlécek, törzs", 25],
    ["07", "Chunked transfer encoding", 20],
    ["08", "Átirányítás és sütik", 25],
    ["09", "gzip: saját DEFLATE-dekóder", 25],
    ["10", "file:// és data: URL-ek", 20],
  ]),
  mod("09", 3, "Kriptográfia és TLS (tanulási célra)", "HTTPS belülről: SHA-256-tól a TLS 1.3 kézfogásig.", [
    "SHA-256, HMAC, HKDF nulláról",
    "X25519 és ChaCha20-Poly1305",
    "TLS 1.3 kézfogás lépésről lépésre",
  ], [
    ["01", "Miért kell a HTTPS? Kriptó alapfogalmak", 20],
    ["02", "SHA-256 nulláról", 25],
    ["03", "HMAC és HKDF", 20],
    ["04", "X25519 kulcscsere", 25],
    ["05", "ChaCha20-Poly1305", 25],
    ["06", "TLS 1.3 kézfogás lépésről lépésre", 25],
    ["07", "Tanúsítványok: X.509 és ASN.1", 25],
    ["08", "Az első HTTPS-oldal saját TLS-sel", 25],
  ]),
  mod("10", 3, "Böngésző-héj", "Címsor, fülek, előzmények, és a kapcsoló a felületen.", [
    "Saját UI-réteg",
    "Navigáció, előzmények, fülek",
    "Szálak és csatornák a betöltéshez",
  ], [
    ["01", "Saját UI-réteg: gombok és szövegmező", 25],
    ["02", "Címsor és navigáció", 20],
    ["03", "Előzmények: vissza és előre", 20],
    ["04", "Fülek", 25],
    ["05", "Billentyűzet és fókusz", 20],
    ["06", "Betöltés közben: szálak és csatornák", 25],
    ["07", "Hibaoldalak és állapotjelzés", 20],
    ["08", "Beállítások panel: a nagy kapcsoló a UI-ban", 25],
    ["09", "Mérföldkő: Rozsda 0.3", 20],
  ]),
  mod("11", 3, "JavaScript motor I: nyelvtan", "Lexer, Pratt parser, fa-bejáró interpreter.", [
    "JS lexer és AST",
    "Pratt parser kifejezésekhez",
    "Hatókörök és környezetek",
  ], [
    ["01", "Hogyan fut a JavaScript? Motorok anatómiája", 20],
    ["02", "JS lexer", 25],
    ["03", "AST: a program fája", 20],
    ["04", "Kifejezések: Pratt parser", 25],
    ["05", "Utasítások: let, const, if, while, for", 25],
    ["06", "Függvények parse-olása", 25],
    ["07", "Fa-bejáró interpreter", 25],
    ["08", "Hatókörök és környezetek", 25],
    ["09", "console.log és az első JS program", 20],
  ]),
  mod("12", 3, "JavaScript motor II: objektumok és memória", "Prototípusok, closure-ök, GC és bytecode VM.", [
    "Objektumok és prototípus-lánc",
    "Closure-ök, this, osztályok",
    "Mark & sweep szemétgyűjtő",
    "Bytecode és virtuális gép",
  ], [
    ["01", "Értékek ábrázolása", 20],
    ["02", "Objektumok és property-k", 25],
    ["03", "Prototípus-lánc", 25],
    ["04", "Closure-ök", 25],
    ["05", "this, new és osztályok", 25],
    ["06", "Beépített tömb- és string-metódusok", 25],
    ["07", "Kivételek: try, catch, throw", 20],
    ["08", "Szemétgyűjtő: mark & sweep", 25],
    ["09", "Bytecode és virtuális gép", 25],
    ["10", "Promise-ok és async alapok", 25],
  ]),
  mod("13", 3, "DOM a JavaScriptben", "Eseményhurok, querySelector, események, fetch.", [
    "Event loop",
    "DOM API JS-ből, újra-layout",
    "Események és időzítők",
  ], [
    ["01", "Az eseményhurok", 25],
    ["02", "document és querySelector", 25],
    ["03", "DOM módosítása JS-ből és újra-layout", 25],
    ["04", "Események: click, input, bubbling", 25],
    ["05", "setTimeout, setInterval, requestAnimationFrame", 20],
    ["06", "A <script> betöltése és futtatása", 20],
    ["07", "fetch() a saját hálózati réteggel", 25],
    ["08", "Mérföldkő: Rozsda 0.4, interaktív oldalak", 20],
  ]),
  mod("14", 4, "Modern CSS", "Pozicionálás, flexbox, grid, változók, transzformációk.", [
    "position, z-index, overflow",
    "Flexbox és grid",
    "Media query, változók, calc()",
  ], [
    ["01", "position: relative, absolute, fixed", 25],
    ["02", "z-index és rétegek", 20],
    ["03", "overflow és görgethető dobozok", 25],
    ["04", "Flexbox I: tengelyek", 25],
    ["05", "Flexbox II: grow, shrink, wrap", 25],
    ["06", "Grid alapok", 25],
    ["07", "Media query-k és viewport", 20],
    ["08", "CSS-változók és calc()", 20],
    ["09", "Transzformációk és átmenetek", 25],
    ["10", "Kódblokkok: white-space és monospace betűk", 20],
  ]),
  mod("15", 4, "Képek", "Saját PNG-dekóder a saját inflate-re építve.", [
    "PNG-dekóder nulláról",
    "Képskálázás",
    "JPEG áttekintés",
  ], [
    ["01", "Az <img> és a betöltés folyamata", 20],
    ["02", "A PNG fájl felépítése", 20],
    ["03", "PNG dekódolása", 25],
    ["04", "Szűrők és interlacing", 25],
    ["05", "Képek skálázása", 20],
    ["06", "JPEG: a DCT dióhéjban", 25],
    ["07", "Favicon és háttérképek", 20],
  ]),
  mod("16", 4, "A nagy kapcsoló: profi crate-ek", "Minden saját alrendszer mellé egy profi, és egy kapcsoló köztük.", [
    "html5ever, Stylo, Taffy, Parley",
    "Vello/wgpu GPU-s rajzolás",
    "reqwest + rustls, Boa vagy V8",
    "Mérések: saját vs. profi",
  ], [
    ["01", "Feature flagek és futásidejű váltás", 25],
    ["02", "html5ever", 20],
    ["03", "cssparser és selectors", 25],
    ["04", "Stylo, a Firefox stílusmotorja", 25],
    ["05", "Taffy: flex és grid layout", 25],
    ["06", "Parley és cosmic-text: profi szöveg", 25],
    ["07", "Vello és wgpu: GPU-s rajzolás", 25],
    ["08", "reqwest és rustls: profi hálózat", 20],
    ["09", "Boa vagy V8: profi JavaScript", 25],
    ["10", "Mérések: saját vs. profi", 20],
  ]),
  mod("17", 4, "Teljesítmény és kompatibilitás", "WPT, profilozás, több szál, cache, biztonság.", [
    "Web Platform Tests",
    "Profilozás és inkrementális layout",
    "Párhuzamosság, cache, same-origin policy",
  ], [
    ["01", "Web Platform Tests futtatása", 25],
    ["02", "Profilozás és flamegraph", 20],
    ["03", "Inkrementális layout és dirty flagek", 25],
    ["04", "Több szál: hálózat, parse, layout, rajz", 25],
    ["05", "HTTP cache", 20],
    ["06", "Formok és POST", 25],
    ["07", "Biztonság: same-origin policy és CSP", 25],
    ["08", "Folyamatszeparáció és sandbox", 20],
  ]),
  mod("18", 5, "Bővítmények", "WebExtensions-szerű API: content scriptek, storage, popup.", [
    "manifest.json és bővítmény-betöltés",
    "Content scriptek és üzenetküldés",
    "Saját reklámblokkoló",
  ], [
    ["01", "Hogyan működnek a WebExtensions?", 20],
    ["02", "A manifest.json betöltése", 20],
    ["03", "Content scriptek injektálása", 25],
    ["04", "Bővítmény-API: storage és tabs", 25],
    ["05", "Üzenetküldés a háttér és az oldal között", 25],
    ["06", "Jogosultságok és biztonság", 20],
    ["07", "Saját reklámblokkoló", 25],
    ["08", "Bővítmény-UI: ikon és popup", 25],
    ["09", "Bővítménykezelő oldal", 20],
  ]),
  mod("19", 5, "DevTools", "Saját elemvizsgáló, konzol és hálózati panel.", [
    "DOM-fa és stílus panel",
    "Konzol és hálózati panel",
    "Box-model overlay",
  ], [
    ["01", "Elemvizsgáló: DOM-fa panel", 25],
    ["02", "A kiválasztott elem kiemelése", 20],
    ["03", "Számított stílusok panel", 20],
    ["04", "Konzol", 25],
    ["05", "Hálózati panel", 20],
    ["06", "Layout overlay: a doboz-modell", 20],
  ]),
  mod("20", 5, "Kiadás: Rozsda 1.0", "Könyvjelzők, profilok, telepítő, frissítés, és ami utána jön.", [
    "Könyvjelzők, profilok, letöltések",
    "Windows telepítő és portable build",
    "Automatikus frissítés",
  ], [
    ["01", "Könyvjelzők és kezdőlap", 20],
    ["02", "Profilok és adatmentés", 20],
    ["03", "Letöltések", 20],
    ["04", "Ikon, név, arculat", 15],
    ["05", "Windows telepítő és portable build", 25],
    ["06", "Automatikus frissítés", 25],
    ["07", "Rozsda 1.0, és hogyan tovább", 15],
  ]),
];
