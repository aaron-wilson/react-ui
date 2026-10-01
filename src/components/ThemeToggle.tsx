"use client";

import { useEffect, useSyncExternalStore } from "react";

export const THEME_KEY = "wander-theme";
/**
 * Runs in the document head before first paint. A stored choice becomes `data-theme`; without
 * one the attribute stays absent and CSS follows the system preference.
 */
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

const systemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)");
const subscribe = (notify: () => void) => {
  const system = systemDark();
  window.addEventListener("storage", notify);
  window.addEventListener("wander-theme-change", notify);
  system?.addEventListener?.("change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("wander-theme-change", notify);
    system?.removeEventListener?.("change", notify);
  };
};
const storedTheme = () => {
  const value = localStorage.getItem(THEME_KEY);
  return value === "dark" || value === "light" ? value : null;
};
const darkPreference = () =>
  (storedTheme() ?? (systemDark()?.matches ? "dark" : "light")) === "dark";

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, darkPreference, () => false);
  useEffect(() => {
    const stored = storedTheme();
    if (stored) document.documentElement.dataset.theme = stored;
    else delete document.documentElement.dataset.theme;
  }, [dark]);
  const toggle = () => {
    localStorage.setItem(THEME_KEY, dark ? "light" : "dark");
    window.dispatchEvent(new Event("wander-theme-change"));
  };
  return (
    <button
      type="button"
      className="control"
      onClick={toggle}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
    >
      {dark ? "Light" : "Dark"} theme
    </button>
  );
}
