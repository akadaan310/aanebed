/**
 * Pearls to explore and play. Written by hand for this site and labelled as such
 * ("made by the Pearls team"); none of them is presented as an AI's output.
 * Pearls that real models made on this site are added separately, with their seals.
 */
import { FORMAT, type Pearl } from "@/lib/pearls/model";

const AT = "2026-10-08T12:00:00.000Z";
const team = [{ by: "pearls" as const, how: "made" as const, at: AT }];

export const EXAMPLES: Pearl[] = [
  {
    format: FORMAT, kind: "game", title: "The Times-Table Lighthouse",
    essence: "A lighthouse game for learning multiplication: every right answer lights one more window.",
    blocks: [
      { t: "text", heading: "How it works", body: "The keeper has to light the tower before the boats come in. Each answer you get right lights a window. Start on the low floors with the twos and fives; the top floors are where the sevens and eights live." },
      { t: "quiz", heading: "Light the tower", questions: [
        { q: "Ground floor: 2 × 4", options: ["6", "8", "10"], answer: 1, why: "Two fours: 4 + 4." },
        { q: "First floor: 5 × 3", options: ["15", "13", "18"], answer: 0, why: "Count in fives: 5, 10, 15." },
        { q: "Second floor: 3 × 6", options: ["16", "18", "21"], answer: 1, why: "6 + 6 + 6." },
        { q: "Third floor: 4 × 7", options: ["24", "28", "32"], answer: 1, why: "Double 7 is 14, double again is 28." },
        { q: "Fourth floor: 6 × 6", options: ["36", "32", "42"], answer: 0, why: "A square: six rows of six." },
        { q: "Fifth floor: 7 × 8", options: ["54", "56", "64"], answer: 1, why: "5, 6, 7, 8 → 56 = 7 × 8." },
        { q: "The lamp room: 9 × 7", options: ["63", "72", "56"], answer: 0, why: "10 × 7 = 70, minus one 7." },
      ] },
      { t: "steps", heading: "Playing it together", items: ["Read each floor out loud, like the keeper climbing the stairs.", "Let her answer before you tap.", "When a window stays dark, say the trick from the answer and try the floor again tomorrow.", "When the lamp room is lit, swap: she asks, you answer."] },
    ],
    origin: "I want to build a small game that teaches my daughter multiplication.",
    next: ["Add a floor for the twelves", "Make a version with no reading needed", "Turn wrong answers into a practice round"],
    hands: team, from: null,
  },
  {
    format: FORMAT, kind: "study", title: "Photosynthesis in five cards",
    essence: "The whole idea in five cards: what goes in, what comes out, and where it happens.",
    blocks: [
      { t: "text", heading: "", body: "Plants make their own food from light. Light energy is caught by chlorophyll, used to split water, and the energy is stored by building sugar from carbon dioxide. Oxygen is what's left over." },
      { t: "cards", heading: "Test yourself", cards: [
        { front: "What goes in?", back: "Carbon dioxide (from the air), water (from the roots) and light." },
        { front: "What comes out?", back: "Glucose (sugar) and oxygen." },
        { front: "Where does it happen?", back: "In chloroplasts, mostly in the leaves." },
        { front: "What catches the light?", back: "Chlorophyll, the green pigment." },
        { front: "The word equation?", back: "carbon dioxide + water → glucose + oxygen (with light)." },
      ] },
      { t: "list", heading: "Easy marks people drop", items: ["Saying plants get food from the soil (they get water and minerals; they make food).", "Forgetting light is an input, not a product.", "Mixing it up with respiration, which runs the other way."] },
    ],
    origin: "Help me revise photosynthesis for Friday's exam.",
    next: ["Make practice exam questions", "Compare it with respiration", "Explain it to a ten-year-old"],
    hands: team, from: null,
  },
  {
    format: FORMAT, kind: "story", title: "The Keeper's Notes",
    essence: "The opening of a story about a lighthouse keeper who leaves notes for whoever comes next.",
    blocks: [
      { t: "text", heading: "I.", body: "The first note was under the oil can. Wick trims short in wet weather. Don't trust the barometer after midnight; it lies to keep you company.\n\nMara had taken the post because nobody else wanted it, and because a lighthouse seemed like the kind of place where nothing would need her. By the third week she had found forty-one notes, in drawers and tins and once rolled inside the brass of the foghorn, each in the same small hand, each written for someone who wasn't there yet.\n\nThe forty-second was on the inside of the lamp-room door, where she couldn't have missed it before. It said: You found the others. Good. Now leave one of your own." },
    ],
    origin: "The opening of a story about a lighthouse keeper who leaves notes.",
    next: ["Write the note Mara leaves", "Tell who wrote the notes", "Write the night of the storm"],
    hands: team, from: null,
  },
  {
    format: FORMAT, kind: "plan", title: "A first month of guitar",
    essence: "Ten minutes a day, four weeks, one song you can actually play at the end.",
    blocks: [
      { t: "list", heading: "What you need", items: ["Any guitar that stays in tune", "A clip-on tuner (or a free tuner app)", "One song you love with four chords or fewer"] },
      { t: "steps", heading: "The month", items: ["Week 1 — Tune up, learn E minor and C. Switch between them slowly, ten times a day.", "Week 2 — Add G and D. Play each chord four slow strums, then change.", "Week 3 — One strumming pattern: down, down-up, up-down-up. Play it on one chord until it's boring.", "Week 4 — Put it together: your song, half speed, with the pattern. Record it on day 28."] },
      { t: "text", heading: "If you get stuck", body: "Fingertips hurting is normal for two weeks. A buzzing string usually means your finger is too far from the fret. Missing a day doesn't matter; missing a week does." },
    ],
    origin: "A plan to finally learn the guitar this autumn.",
    next: ["Pick a first song for me", "Make a checklist for today", "Add a second month"],
    hands: team, from: null,
  },
  {
    format: FORMAT, kind: "research", title: "Why there are two tides a day",
    essence: "The Moon pulls the near side of the Earth more than its centre, and the centre more than the far side; both sides bulge.",
    blocks: [
      { t: "text", heading: "The short answer", body: "Tides come from a difference in pull, not the pull itself. The ocean facing the Moon is pulled a little more than the Earth's centre, so it bulges towards the Moon. The Earth's centre is pulled more than the far ocean, so the far side is, in effect, left behind and bulges too. The Earth turns under two bulges, so most coasts get two high tides a day." },
      { t: "list", heading: "What the simple picture leaves out", items: ["The Sun does the same at about half the strength; when they line up you get spring tides.", "Continents block the bulges, so real tides slosh around ocean basins.", "Some places get one tide a day, or almost none: the shape of the coast wins."] },
      { t: "quiz", heading: "Check", questions: [
        { q: "What causes the far-side bulge?", options: ["The Sun", "The difference in the Moon's pull across the Earth", "The Earth's spin throwing water outwards"], answer: 1, why: "The far side is pulled least, so it's left behind." },
        { q: "When are spring tides?", options: ["In spring", "When Sun and Moon line up", "When the Moon is furthest away"], answer: 1, why: "Their pulls add up at new and full moon." },
      ] },
    ],
    origin: "Why are there two tides a day and not one?",
    next: ["Design a kitchen experiment for it", "Find the strongest misconception", "Explain neap tides"],
    hands: team, from: null,
  },
  {
    format: FORMAT, kind: "project", title: "The bakery's weekly order card",
    essence: "One Pearl per regular customer: their usual order, what they're allergic to, and what to suggest next.",
    blocks: [
      { t: "text", heading: "The idea", body: "A small bakery keeps a Pearl for each regular. The customer keeps the link; the bakery's AI can read it and suggest this week's order. Nothing sits in a database: whoever holds the link holds the card." },
      { t: "steps", heading: "How it would work", items: ["At the till, make a Pearl: name, usual order, allergies.", "Give the customer its link (a QR code on the receipt).", "Each week, the customer opens it and grows it with what they'd like.", "The bakery's AI reads the Pearl the customer brings and prepares the order."] },
      { t: "list", heading: "Why a Pearl and not an account", items: ["No sign-up, no password, nothing to leak.", "The customer can take it to another shop, or delete it by forgetting the link.", "Any AI can read it, so it works with whatever the bakery already uses."] },
    ],
    origin: "Could a small shop use this for its regulars?",
    next: ["Write the card for a first customer", "List what could go wrong", "Make it work for a café"],
    hands: team, from: null,
  },
];

/** Which examples are best played rather than read. */
export const PLAYABLE = ["The Times-Table Lighthouse", "Photosynthesis in five cards", "Why there are two tides a day"];

/**
 * Pearls real models made on this site, kept as their exact links (codes), with their seals.
 * Filled from the production run; empty until a real run produced them.
 */
export const MADE_BY_MODELS: { code: string; story: string }[] = [];
