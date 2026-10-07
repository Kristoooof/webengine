import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./styles.css";
import { icon } from "./lib/icons";
import { state, subscribe, dueCards } from "./lib/store";
import { levelFor } from "./lib/content";
import { mountTimer } from "./lib/timer";
import { applyTheme } from "./lib/theme";
import { setupExternalLinks } from "./lib/external";
import { ring } from "./lib/ui";
import { renderHome } from "./views/home";
import { renderMap } from "./views/map";
import { renderLessonView } from "./views/lesson";
import { renderReview } from "./views/review";
import { renderSettings } from "./views/settings";
import { renderGlossary } from "./views/glossary";

export type Cleanup = void | (() => void);

const NAV = [
  { href: "#/", key: "home", label: "Ma", icon: "home" },
  { href: "#/terkep", key: "map", label: "Térkép", icon: "map" },
  { href: "#/ismetles", key: "review", label: "Ismétlés", icon: "review" },
  { href: "#/fogalmak", key: "glossary", label: "Fogalomtár", icon: "glossary" },
  { href: "#/beallitasok", key: "settings", label: "Beállítások", icon: "settings" },
];


const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#/">
        <img src="./logo.svg" alt="" width="36" height="36" />
        <span><strong>Rozsda</strong><small>böngészőmotor Rustban</small></span>
      </a>
      <nav class="side-nav">
        ${NAV.map((n) => `<a href="${n.href}" data-nav="${n.key}">${icon(n.icon, 18)}<span>${n.label}</span><em class="badge" data-badge="${n.key}" hidden></em></a>`).join("")}
      </nav>
      <div class="side-spacer"></div>
      <a class="side-level" href="#/" id="side-level"></a>
      <div class="timer" id="timer"></div>
    </aside>
    <main class="view" id="view" tabindex="-1"></main>
    <nav class="tabbar">
      ${NAV.slice(0, 4).map((n) => `<a href="${n.href}" data-nav="${n.key}">${icon(n.icon, 20)}<span>${n.label}</span></a>`).join("")}
      <a href="#/beallitasok" data-nav="settings">${icon("settings", 20)}<span>Több</span></a>
    </nav>
  </div>`;

const view = document.getElementById("view")!;
let cleanup: Cleanup;

function refreshChrome(): void {
  const lv = levelFor(state.xp);
  document.getElementById("side-level")!.innerHTML = `
    ${ring(lv.into / lv.need, 40, 4, String(lv.level))}
    <span><strong>${lv.title}</strong><small>${state.xp.toLocaleString("hu-HU")} XP · még ${(lv.need - lv.into).toLocaleString("hu-HU")} a szintlépésig</small></span>`;
  const due = dueCards().length;
  document.querySelectorAll<HTMLElement>('[data-badge="review"]').forEach((b) => {
    b.hidden = due === 0;
    b.textContent = String(due);
  });
}

function route(): void {
  const hash = location.hash.replace(/^#/, "") || "/";
  const [, first = "", second = ""] = hash.split("/");
  if (typeof cleanup === "function") cleanup();
  document.querySelectorAll(".modal-wrap, .confetti").forEach((m) => m.remove());
  cleanup = undefined;
  view.innerHTML = "";
  view.className = "view";

  let key = "home";
  switch (first) {
    case "":
      cleanup = renderHome(view);
      break;
    case "terkep":
      key = "map";
      cleanup = renderMap(view, second);
      break;
    case "lecke":
      key = "map";
      cleanup = renderLessonView(view, decodeURIComponent(second));
      break;
    case "ismetles":
      key = "review";
      cleanup = renderReview(view);
      break;
    case "fogalmak":
      key = "glossary";
      cleanup = renderGlossary(view);
      break;
    case "beallitasok":
      key = "settings";
      cleanup = renderSettings(view);
      break;
    default:
      cleanup = renderHome(view);
  }
  document.querySelectorAll<HTMLElement>("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === key));
  window.scrollTo({ top: 0 });
  view.focus({ preventScroll: true });
  refreshChrome();
}

applyTheme();
setupExternalLinks();
mountTimer(document.getElementById("timer")!);
subscribe(refreshChrome);
window.addEventListener("hashchange", route);
route();
