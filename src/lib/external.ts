// Az asztali (Tauri) változatban a külső linkek a rendszer böngészőjében nyílnak meg,
// nem az alkalmazás ablakában.
export function setupExternalLinks(): void {
  const isTauri = "__TAURI_INTERNALS__" in window;
  if (!isTauri) return;
  document.addEventListener("click", async (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!a || !/^https?:/.test(a.href) || a.origin === location.origin) return;
    e.preventDefault();
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(a.href);
  });
}
