"use client";

import { useEffect, useSyncExternalStore } from "react";

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener("wander-theme-change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("wander-theme-change", notify);
  };
};
const darkPreference = () =>
  localStorage.getItem("wander-theme") === "dark" ||
  (localStorage.getItem("wander-theme") === null &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches);

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, darkPreference, () => false);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  const toggle = () => {
    const next = !dark;
    localStorage.setItem("wander-theme", next ? "dark" : "light");
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
