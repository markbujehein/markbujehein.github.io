export const site = {
  title: "Mark Buje Hein",
  author: "Mark Buje Hein",
  url: "https://markbujehein.github.io",
  description:
    "Personal academic website of Mark Buje Hein: neutron and X-ray scattering, computational materials science and nanoscience.",
  nav: [
    { label: "about", href: "/" },
    { label: "projects", href: "/projects/" },
    { label: "cv", href: "/cv/" },
  ],
  // Profile ids carried over from the Pelican site (_archive/pelican/content/config.yml).
  profiles: [
    { label: "ORCID", icon: "orcid", href: "https://orcid.org/0009-0004-3811-8976" },
    {
      label: "ResearchGate",
      icon: "researchgate",
      href: "https://www.researchgate.net/profile/Mark-Sorensen-4",
    },
    { label: "GitHub", icon: "github", href: "https://github.com/markbujehein" },
    { label: "Kaggle", icon: "kaggle", href: "https://www.kaggle.com/markbujeheinsrensen" },
    { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/in/mbhs%C3%B8rensen" },
  ],
  footer: "Built with Astro.",
} as const;
