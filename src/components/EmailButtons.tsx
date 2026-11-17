import { useState } from "preact/hooks";

// The address is served in pieces: the button text is drawn by CSS from data-p (see Hero.astro), never DOM text.
// It is joined only inside click handlers.
const USER = "mark.sorensen";
const DOMAIN = "nbi.ku.dk";
const address = () => `${USER}@${DOMAIN}`;

export default function EmailButtons() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {} // clipboard blocked: "Email me" still works
  };

  return (
    <span class="hero-email" data-needs-js>
      <button
        type="button"
        class="hero-btn"
        aria-label="Email me"
        onClick={() => (location.href = `mailto:${address()}`)}
      >
        <span class="eb" data-p={USER} />
        <span class="eb eb-at" />
        <span class="eb" data-p={DOMAIN} />
      </button>
      <button
        type="button"
        class="hero-btn hero-btn-icon"
        onClick={copy}
        aria-label="Copy email address"
        title="Copy email address"
      >
        <span
          class={copied ? "icon-[lucide--check] size-4" : "icon-[lucide--copy] size-4"}
          aria-hidden="true"
        />
      </button>
      <span class="sr-only" role="status">
        {copied ? "Email address copied" : ""}
      </span>
    </span>
  );
}
