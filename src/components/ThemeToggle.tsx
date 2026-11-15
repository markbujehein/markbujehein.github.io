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
      class="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded border border-paper-300 text-ink-600 transition-colors hover:text-accent-700 focus-visible:ring-2 focus-visible:ring-accent-500 dark:border-ink-700 dark:text-paper-300 dark:hover:text-accent-300"
    >
      {/* Both icons are in the markup and CSS picks one from data-theme, so the first paint is right before any script runs. */}
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
        class="dark:hidden"
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
        class="hidden dark:block"
      >
        <circle cx="12" cy="12" r="4" />
      </svg>
    </button>
  );
}
