import { state } from "./store";

export function applyTheme(): void {
  const t = state.settings.theme;
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  document.documentElement.classList.toggle("reduce-motion", state.settings.reduceMotion);
}
