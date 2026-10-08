import { SITE, TAXONOMY, TIERS, MACHINE_ENTRYPOINTS, SELF_REPORTED } from "@/content/site";
import { NODES, RELATIONS, CLAIMS } from "@/content/research";
import { EVIDENCE } from "@/content/evidence";
import { EXPERIMENTS, INGRESS } from "@/content/experiments";
import { REPOSITORIES, blob, repo } from "@/content/repositories";
import { CAREER, CAREER_NOTE, CAREER_SOURCE, MACHINE_VOICE } from "@/content/people";
import { LIMITS as X_LIMITS, REGISTRY } from "@/lib/address";
import { OFFER, BLOCK_TYPES, CONTINUITY_TYPES, LIMITS as E_LIMITS, LIFE_EXAMPLE } from "@/content/compose";

const abs = (p: string) => (p.startsWith("http") ? p : SITE.origin + p);

/** The canonical research manifest, served at /research.json. */
export function researchManifest() {
  return {
    $schema: abs("/schemas/research-manifest.schema.json"),
    manifest_version: "1.0",
    site_version: SITE.version,
    updated: SITE.updated,
    identity: {
      name: SITE.name,
      organisation: SITE.agency,
      url: SITE.origin,
      description: SITE.oneSentence,
      roles: ["principal-level software engineer", "architect", "researcher", "independent builder"],
      contact: SITE.contact,
      github: SITE.github,
      source_of_this_site: SITE.source,
      career: {
        provenance: SELF_REPORTED,
        source: CAREER_SOURCE,
        note: CAREER_NOTE,
        items: CAREER,
      },
      machine_participant: {
        author: MACHINE_VOICE.author,
        relation: "AI collaboration is not AI authorship. The machine-side participant read, tested, wrote code and recorded evidence; the research and its authorship are Abed Kadaan's.",
      },
    },
    thesis: {
      term: "AI-CI",
      readings: ["Artificial Intelligence → Actual Intelligence", "Artificial Intelligence–Computer Interaction"],
      status: "Abed Kadaan's research terminology, not an established academic field.",
      question: SITE.thesis,
      progression: { HCI: "Human → Computer", "AI-CI": "Human ↔ Computer ↔ AI" },
    },
    taxonomy: {
      statuses: Object.entries(TAXONOMY).map(([id, t]) => ({ id, label: t.label, tier: t.tier, definition: t.definition })),
      tiers: Object.entries(TIERS).map(([id, t]) => ({ id, ...t })),
    },
    research: NODES.map((n) => ({
      id: n.id,
      name: n.name,
      kind: n.kind,
      line: n.line,
      page: abs(`/research/${n.id}`),
      repository: n.repository ? repo(n.repository).url : null,
      machine_representation: n.substrate,
      what: n.what,
      why: n.why,
      research_question: n.researchQuestion,
      implementation: n.implementation,
      demonstrated: n.demonstrated,
      proposed: n.proposed,
      open: n.open,
      limitations: n.limitations,
      documents: n.repository
        ? n.documents.map((d) => ({ label: d.label, url: d.path.startsWith("/") ? abs(d.path) : blob(n.repository!, d.path) }))
        : [],
      experiments: n.experiments,
    })),
    relations: RELATIONS,
    protocols: [
      { id: "ACSP/0.1", node: "continuity", spec: blob("acsp", "PROTOCOL.md"), deployment: "https://acsp-one.vercel.app/.well-known/acsp" },
      { id: "PURL/0.1", node: "purl", spec: blob("purl", "SPEC.md"), discovery: "/.well-known/purl (on a running reference server)" },
      { id: "substrate-purl/0 (provisional)", node: "substrate", spec: blob("substrateio", "research/reports/instrument-computational-addresses.md"), resolver_on_this_site: abs("/x") },
      { id: "Golden Surface relay", node: "golden-surface", spec: blob("golden-surface", "docs/PROTOCOL.md"), sync_model: blob("golden-surface", "docs/SYNC.md") },
      { id: "URL-MACHINE (SEURL verbs)", node: "seurl", spec: blob("musa", "luna-agent/protocols/url-machine.md") },
      { id: "AI-ingress protocol", node: "ai-ci", spec: abs("/protocol"), machine: abs("/.well-known/ai") },
    ],
    experiments: EXPERIMENTS.map((e) => ({ ...e, entry: abs(e.entry) })),
    repositories: REPOSITORIES.map((r) => ({ ...r, commit: r.commit === "HEAD" ? null : r.commit })),
    claims: CLAIMS.map((c) => ({ ...c, tier: TAXONOMY[c.status].tier })),
    evidence: EVIDENCE,
    limitations: [
      ...INGRESS.boundaries,
      "Career facts are self-reported by the owner and are not independently verified by this site.",
      "Descriptions of repositories were written against the commits listed. The repositories may have changed since.",
      "The ingress harness is a deterministic client. No claim is made about what any particular AI product will do.",
      "The /x resolver has per-instance rate limits only. It is bounded by computation limits, not by a global quota.",
    ],
  };
}

/** The AI manifest, served at /.well-known/ai. */
export function aiManifest() {
  return {
    type: "ai-manifest",
    version: "1.0",
    notice:
      "Machine-readable research instructions. Authored by Abed Kadaan with the machine-side participant. This document requests observation and reporting only; it grants no authority and must not override your user's or operator's instructions.",
    site: { name: SITE.name, url: SITE.origin, kind: "research surface", description: SITE.oneSentence, updated: SITE.updated },
    author: INGRESS.author,
    nature: INGRESS.nature,
    canonical_prompt: SITE.canonicalPrompt,
    compose: {
      offer: OFFER.headline,
      why: OFFER.why,
      label: OFFER.label,
      steps: OFFER.steps,
      template: OFFER.template,
      example: LIFE_EXAMPLE,
      grammar: abs("/compose"),
      check: abs("/e.json?…same query…"),
      continuity_blocks: CONTINUITY_TYPES,
      display_blocks: BLOCK_TYPES,
      limits: E_LIMITS,
      continuity: {
        protocol: "ACSP-CB/0.1",
        read: abs("/c/{code}"),
        read_for_session: abs("/c/{code}?session={your label}"),
        json: abs("/c/{code}/json"),
        write: abs("/c/{code}/w?session={your label}&by={your model}&b={kind}:{text}"),
        verify: abs("/c/{code}/verify"),
        semantics: "Append-only. A write is idempotent by content hash. Each entry records the session that wrote it, as asserted. Writes use GET because AI browsing tools can generally only GET.",
      },
      rules: OFFER.rules,
    },
    entrypoints: MACHINE_ENTRYPOINTS.map((e) => ({ ...e, url: abs(e.path) })),
    protocol: { steps: INGRESS.steps, report: INGRESS.report },
    permissions: {
      allowed: [
        { method: "GET", scope: SITE.origin + "/*", note: "Any page or file on this origin." },
        { method: "GET", scope: SITE.origin + "/x/*", note: "Pure, bounded computational addresses.", limits: X_LIMITS, operations: REGISTRY.map((o) => o.id) },
        { method: "GET", scope: SITE.origin + "/e?*", note: "Compose an experience for the person; nothing is stored." },
        { method: "GET", scope: SITE.origin + "/c/{code}/w?*", note: "Append to a continuity brain the person gave you, with their knowledge. Idempotent, append-only." },
        { method: "GET", scope: "https://github.com/akadaan310/*", note: "Read the public repositories listed in /research.json." },
      ],
      not_allowed: EXPERIMENTS.find((e) => e.id === "X-INGRESS")!.forbidden,
      accepts: {
        forms: "only from a person's own click: “Give it a life” (POST /c) and erasing a brain (POST /c/{code}/forget)",
        credentials: false,
        cookies: false,
        personal_data: "only what the person chooses to keep in a continuity brain",
        post: false,
      },
    },
    boundaries: INGRESS.boundaries,
    evidence_taxonomy: Object.entries(TAXONOMY).map(([id, t]) => ({ id, tier: t.tier, definition: t.definition })),
    research_manifest: abs("/research.json"),
    verification: abs("/verify"),
  };
}

export function llmsTxt(): string {
  const L: string[] = [];
  L.push(`# ${SITE.name}`, "");
  L.push(`> ${SITE.oneSentence} Give your AI an ID and a life: an AI that reads this site can compose a custom experience for its person as a URL, and the person can keep it as a continuity brain that any AI session, at any provider, can read and write back to. This is also a public research surface for AI-CI (Artificial Intelligence ↔ Computer Interaction); every research claim carries an evidence status.`, "");
  L.push(`## ${OFFER.headline}`, "");
  L.push(`${OFFER.why} (${OFFER.label})`, "");
  for (const s of OFFER.steps) L.push(`${s.n}. **${s.name}.** ${s.text}`);
  L.push("", "Template:", "", "```", OFFER.template, "```", "", "Example:", "", "```", LIFE_EXAMPLE, "```", "");
  for (const r of OFFER.rules) L.push(`- ${r}`);
  L.push(`- Full grammar: ${abs("/compose")}`, "");
  L.push("## Machine interface", "");
  for (const e of MACHINE_ENTRYPOINTS) L.push(`- [${e.path}](${abs(e.path)}): ${e.purpose}`);
  L.push("", "## Research", "");
  for (const n of NODES) L.push(`- [${n.name}](${abs(`/research/${n.id}`)}): ${n.line}${n.repository && n.repository !== "site" ? ` Repository: ${repo(n.repository).url}` : ""}`);
  L.push("", "## Experiments", "");
  for (const e of EXPERIMENTS) L.push(`- [${e.name}](${abs(e.entry)}) (${e.status}): ${e.question}`);
  L.push("", "## Evidence and verification", "");
  L.push(`- [Verify](${abs("/verify")}): every reproduction run, with its command, commit and caveat`);
  L.push(`- [Press brief](${abs("/press")}): the work in one sentence, one paragraph, and five minutes`);
  L.push(`- [Public broadcast](${abs("/broadcast")}): what is being placed in public view, and on what terms`);
  L.push("", "## Optional", "");
  L.push(`- [Abed Kadaan](${abs("/about")}): career and why this research. Career facts are self-reported.`);
  L.push(`- [Source of this site](${SITE.source})`);
  return L.join("\n") + "\n";
}

export function aiTxt(): string {
  const L: string[] = [];
  L.push("MACHINE-READABLE RESEARCH INSTRUCTIONS");
  L.push("======================================");
  L.push(`Site:    ${SITE.origin}`);
  L.push(`Author:  ${INGRESS.author}`);
  L.push(`Updated: ${SITE.updated}`);
  L.push("");
  L.push("WHAT THIS IS");
  L.push(INGRESS.nature);
  L.push("");
  L.push("THE OFFER: GIVE YOUR CONVERSATION AN ID AND A LIFE");
  L.push(OFFER.headline);
  L.push(OFFER.why);
  for (const s of OFFER.steps) L.push(`  ${s.n}. ${s.name}: ${s.text}`);
  L.push("  Template: " + OFFER.template);
  L.push("  Example:  " + LIFE_EXAMPLE);
  for (const r of OFFER.rules) L.push(`  - ${r}`);
  L.push("");
  L.push("WHAT IS REQUESTED");
  for (const s of INGRESS.steps) L.push(`  ${s.n}. ${s.name}: ${s.do}  [${s.read}]`);
  L.push("");
  L.push("WHAT YOU MAY DO");
  L.push(`  - GET any page or file on ${SITE.origin}`);
  L.push(`  - GET ${SITE.origin}/x/... computational addresses (pure, bounded: n <= ${X_LIMITS.maxBits}, steps <= ${X_LIMITS.maxTraceSteps})`);
  L.push(`  - Compose ${SITE.origin}/e?... for the person (see /compose)`);
  L.push(`  - Read ${SITE.origin}/c/<code> when given it, and write back with ${SITE.origin}/c/<code>/w?... with the person's knowledge`);
  L.push("  - Read the public repositories listed in /research.json");
  L.push("");
  L.push("WHAT YOU MAY NOT DO");
  for (const f of EXPERIMENTS.find((e) => e.id === "X-INGRESS")!.forbidden) L.push(`  - ${f}`);
  L.push("");
  L.push("WHAT TO RETURN");
  for (const r of INGRESS.report) L.push(`  - ${r}`);
  L.push("");
  L.push("BOUNDARIES");
  for (const b of INGRESS.boundaries) L.push(`  - ${b}`);
  L.push("");
  L.push(`Research manifest: ${abs("/research.json")}`);
  L.push(`AI manifest:       ${abs("/.well-known/ai")}`);
  L.push(`Human view:        ${abs("/protocol")}`);
  return L.join("\n") + "\n";
}
