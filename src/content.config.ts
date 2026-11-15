import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { decodeEntities } from "./utils/cv";

const text = z.string().transform(decodeEntities);
const section = { order: z.number().int(), title: text };

const projects = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(["research", "software"]),
    importance: z.number().int(),
    img: z.string().nullish(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/news" }),
  schema: z.object({
    date: z.coerce.date(),
    monthOnly: z.boolean().default(false),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: "index.md", base: "./src/content/home" }),
  schema: z.object({
    subtitle: z.string(),
    hero: z.object({
      headline: z.string(),
      detail: z.string(),
      start: z.string().optional(),
      contact: z.string().optional(),
      linkedin: z.url({ protocol: /^https$/ }).optional(),
    }),
  }),
});

const cv = defineCollection({
  loader: file("src/data/cv.yml"),
  schema: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("map"),
      ...section,
      contents: z.array(z.object({ name: text, value: text })),
    }),
    z.object({
      type: z.literal("nested_list"),
      ...section,
      contents: z.array(z.object({ title: text, elements: z.array(text) })),
    }),
    z.object({
      type: z.literal("time_table"),
      ...section,
      contents: z.array(
        z.object({
          title: text,
          year: text,
          institution: text.optional(),
          description: z.array(text).default([]),
        }),
      ),
    }),
    z.object({ type: z.literal("list"), ...section, contents: z.array(text) }),
  ]),
});

// Glossary of technical terms: the term as written in the CV, a one-line explanation and the projects that show it.
const skills = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/skills" }),
  schema: z.object({
    term: z.string(),
    name: z.string(),
    projects: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, news, home, cv, skills };
