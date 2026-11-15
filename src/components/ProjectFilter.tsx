import { useLayoutEffect, useState } from "preact/hooks";
import { filterProjects } from "../utils/filter";

interface Props {
  // One entry per project; the server-rendered list carries matching data-project attributes.
  items: { id: string; data: { category: string } }[];
  categories: { id: string; label: string }[];
}

// Progressive enhancement: the full list is already in the HTML; this only hides non-matching cards.
export default function ProjectFilter({ items, categories }: Props) {
  const [active, setActive] = useState("all");
  const visible = filterProjects(items, active);

  useLayoutEffect(() => {
    const shown = new Set(visible.map((i) => i.id));
    for (const el of document.querySelectorAll<HTMLElement>("[data-project]")) {
      el.hidden = !shown.has(el.dataset.project ?? "");
    }
  }, [active]);

  const options = [
    { id: "all", label: "All", count: items.length },
    ...categories.map((c) => ({
      ...c,
      count: filterProjects(items, c.id).length,
    })),
  ];

  return (
    <div role="group" aria-label="Filter projects" class="flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.id}
          aria-pressed={active === o.id}
          onClick={() => setActive(o.id)}
          class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded border border-paper-300 px-3.5 text-sm font-semibold text-ink-700 transition-colors hover:border-accent-500 aria-pressed:border-accent-400 aria-pressed:bg-accent-400 aria-pressed:text-ink-950 dark:border-ink-700 dark:text-paper-300 dark:hover:border-accent-400 dark:aria-pressed:border-accent-400 dark:aria-pressed:text-ink-950"
        >
          <span class="capitalize">{o.label}</span>
          <span
            class={`font-mono text-xs ${active === o.id ? "text-ink-950" : "text-accent-700 dark:text-accent-300"}`}
          >
            {o.count}
          </span>
        </button>
      ))}
      <p class="sr-only" aria-live="polite">
        Showing {visible.length} of {items.length} projects
      </p>
    </div>
  );
}
