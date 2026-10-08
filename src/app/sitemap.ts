import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";
import { NODES } from "@/content/research";

export const PAGES = ["/", "/continue", "/compose", "/research", "/ai", "/protocol", "/experiments", "/verify", "/press", "/broadcast", "/about"];
export const FILES = ["/llms.txt", "/ai.txt", "/.well-known/ai", "/research.json", "/verify/ingress.json", "/schemas/research-manifest.schema.json"];

export default function sitemap(): MetadataRoute.Sitemap {
  const at = new Date(SITE.updated + "T00:00:00Z");
  return [...PAGES, ...NODES.map((n) => `/research/${n.id}`), ...FILES].map((p) => ({ url: SITE.origin + p, lastModified: at }));
}
