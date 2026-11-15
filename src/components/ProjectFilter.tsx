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
          class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded border border-sunlit-vellum-darker px-3.5 text-sm font-semibold text-lampblack-ink-lighter transition-colors hover:border-arcane-intellect aria-pressed:border-spice-melange aria-pressed:bg-spice-melange aria-pressed:text-sunlit-vellum dark:aria-pressed:bg-gravity-gun dark:border-midnight-codex-lighter dark:text-lunar-vellum-darker dark:hover:border-arcane-torrent dark:aria-pressed:border-gravity-gun dark:aria-pressed:text-iron-gall"
        >
          <span class="capitalize">{o.label}</span>
          <span
            class={`font-mono text-xs ${active === o.id ? "text-sunlit-vellum dark:text-iron-gall" : "text-spice-melange dark:text-gravity-gun"}`}
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
