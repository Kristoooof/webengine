// A téma beállítása még az első rajzolás előtt, hogy ne villanjon fel rossz színnel.
try {
  var s = JSON.parse(localStorage.getItem("rozsda.v1") || "{}");
  var t = s.settings && s.settings.theme;
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
