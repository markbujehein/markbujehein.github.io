import { useEffect, useState } from "preact/hooks";

type Theme = "light" | "dark";

// The inline script in Base.astro sets <html data-theme>; this button flips and remembers it.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    read();
    document.addEventListener("astro:after-swap", read);
    return () => document.removeEventListener("astro:after-swap", read);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  };

  return (
    <button
      type="button"
      data-needs-js
      onClick={toggle}
      aria-pressed={theme === "dark"}
      aria-label="Dark theme"
      class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded border border-sunlit-vellum-darker text-silverpoint transition-colors hover:text-arcane-intellect focus-visible:ring-2 focus-visible:ring-arcane-intellect dark:border-midnight-codex-lighter dark:text-lunar-vellum-darker dark:hover:text-arcane-torrent"
    >
      {/* Both icons are in the markup and CSS picks one from data-theme, so the first paint is right before any script runs. */}
      <span class="icon-[lucide--moon] size-5 dark:hidden" aria-hidden="true" />
      <span class="icon-[lucide--sun] hidden size-5 dark:inline-block" aria-hidden="true" />
    </button>
  );
}
