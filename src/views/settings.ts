import { icon } from "../lib/icons";
import { exportJson, importJson, resetAll, save, state, type Theme } from "../lib/store";
import { modal, toast } from "../lib/ui";
import { applyTheme } from "../lib/theme";

export function renderSettings(el: HTMLElement): void {
  const s = state.settings;
  const themeBtn = (t: Theme, label: string, ic: string) =>
    `<button type="button" class="seg ${s.theme === t ? "active" : ""}" data-theme="${t}">${icon(ic, 15)}<span>${label}</span></button>`;

  el.innerHTML = `
    <div class="page page-settings">
      <header class="page-head">
        <p class="eyebrow">Beállítások</p>
        <h1>Igazítsd magadhoz</h1>
      </header>

      <section class="panel settings-group">
        <div class="setting">
          <div><strong>Megjelenés</strong><small>Világos, sötét, vagy kövesse a rendszert</small></div>
          <div class="segmented">${themeBtn("system", "Rendszer", "layers")}${themeBtn("light", "Világos", "sun")}${themeBtn("dark", "Sötét", "moon")}</div>
        </div>
        <div class="setting">
          <div><strong>Fókuszkör hossza</strong><small>Pomodoro-szerű időzítő. ADHD mellett sokszor a rövidebb kör működik jobban.</small></div>
          <div class="segmented" data-group="focus">${[10, 15, 25, 45].map((m) => `<button type="button" class="seg ${s.focusMinutes === m ? "active" : ""}" data-focus="${m}">${m} perc</button>`).join("")}</div>
        </div>
        <div class="setting">
          <div><strong>Szünet hossza</strong><small>Ennyi ideig pihensz egy fókuszkör után</small></div>
          <div class="segmented">${[3, 5, 10].map((m) => `<button type="button" class="seg ${s.breakMinutes === m ? "active" : ""}" data-break="${m}">${m} perc</button>`).join("")}</div>
        </div>
        <label class="setting">
          <div><strong>Hangjelzés</strong><small>Halk csengő, amikor lejár az időzítő</small></div>
          <input type="checkbox" class="switch" id="sound" ${s.sound ? "checked" : ""}/>
        </label>
        <label class="setting">
          <div><strong>Kevesebb animáció</strong><small>Kikapcsolja a konfettit és a mozgó átmeneteket</small></div>
          <input type="checkbox" class="switch" id="motion" ${s.reduceMotion ? "checked" : ""}/>
        </label>
      </section>

      <section class="panel settings-group">
        <div class="setting">
          <div><strong>Haladás mentése</strong><small>A haladásod ezen az eszközön tárolódik. Exportáld, ha át akarod vinni a webes és az asztali verzió között, vagy biztonsági mentést akarsz.</small></div>
          <div class="btn-row">
            <button type="button" class="btn btn-soft" id="export">${icon("download", 15)}<span>Exportálás</span></button>
            <label class="btn btn-soft">${icon("upload", 15)}<span>Importálás</span><input type="file" accept="application/json,.json" id="import" hidden/></label>
          </div>
        </div>
        <div class="setting danger">
          <div><strong>Újrakezdés</strong><small>Minden haladás, jegyzet és kártya törlődik</small></div>
          <button type="button" class="btn btn-ghost danger" id="reset">${icon("x", 15)}<span>Törlés</span></button>
        </div>
      </section>

      <section class="panel about">
        <h3>A kurzusról</h3>
        <p><strong>Rozsda</strong>: egy saját böngészőmotor építése Rustban, nulláról, a mai webig. A kurzus anyaga és az alkalmazás forráskódja a <a href="https://github.com/Kristoooof/webengine" target="_blank" rel="noopener">GitHub-repóban</a> található.</p>
        <p class="muted small">Az alkalmazás nem gyűjt adatot, és nem küld semmit sehova. Minden a te gépeden marad.</p>
      </section>
    </div>`;

  const rerender = () => renderSettings(el);

  el.querySelectorAll<HTMLButtonElement>("[data-theme]").forEach((b) =>
    b.addEventListener("click", () => {
      s.theme = b.dataset.theme as Theme;
      save();
      applyTheme();
      rerender();
    }),
  );
  el.querySelectorAll<HTMLButtonElement>("[data-focus]").forEach((b) =>
    b.addEventListener("click", () => {
      s.focusMinutes = Number(b.dataset.focus);
      save();
      rerender();
    }),
  );
  el.querySelectorAll<HTMLButtonElement>("[data-break]").forEach((b) =>
    b.addEventListener("click", () => {
      s.breakMinutes = Number(b.dataset.break);
      save();
      rerender();
    }),
  );
  el.querySelector<HTMLInputElement>("#sound")!.addEventListener("change", (e) => {
    s.sound = (e.target as HTMLInputElement).checked;
    save();
  });
  el.querySelector<HTMLInputElement>("#motion")!.addEventListener("change", (e) => {
    s.reduceMotion = (e.target as HTMLInputElement).checked;
    save();
    applyTheme();
  });

  el.querySelector("#export")!.addEventListener("click", () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rozsda-haladas-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Haladás exportálva", "ok");
  });

  el.querySelector<HTMLInputElement>("#import")!.addEventListener("change", async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      importJson(await f.text());
      applyTheme();
      toast("Haladás betöltve", "ok");
      rerender();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Nem sikerült beolvasni a fájlt", "warn");
    }
  });

  el.querySelector("#reset")!.addEventListener("click", () =>
    modal({
      icon: "alert",
      title: "Biztosan mindent törölsz?",
      body: "<p>Minden kész lecke, jegyzet, kártya és a sorozatod is elveszik. Előtte érdemes exportálni.</p>",
      actions: [
        { label: "Igen, törlöm", kind: "primary", run: () => { resetAll(); applyTheme(); rerender(); toast("Minden törölve. Új kezdet!", "info"); } },
        { label: "Mégsem", kind: "ghost" },
      ],
    }),
  );
}
