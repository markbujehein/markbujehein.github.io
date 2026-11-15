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
          class="chip group"
        >
          <span class="capitalize">{o.label}</span>
          <span class="font-mono text-xs text-spice-melange group-aria-pressed:text-sunlit-vellum dark:text-gravity-gun dark:group-aria-pressed:text-iron-gall">
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
