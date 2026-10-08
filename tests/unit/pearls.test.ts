import { test } from "node:test";
import assert from "node:assert/strict";
import { fromWords, normalize, idOf, forAI, fromReply, look } from "../../src/lib/pearls/model";
import { encode, decode } from "../../src/lib/pearls/codec";
import { seal, verify } from "../../src/lib/pearls/seal";

test("a person's own words become a Pearl without inventing anything; the link carries it whole", async () => {
  const p = fromWords("Plan for learning guitar\n\nI want to play one song by summer.\n\n1. Buy a tuner\n2. Learn three chords\n3. Practise ten minutes a day\n\nQ: What is a chord?\nA: Notes played together.")!;
  assert.equal(p.title, "Plan for learning guitar");
  assert.equal(p.kind, "plan");
  assert.deepEqual(p.blocks.map((b) => b.t), ["text", "steps", "cards"]);
  assert.equal(p.hands[0].by, "you");
  const code = await encode(p);
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(await decode(code), p);
  assert.equal(await decode(code.slice(0, -8)), null, "a cut-off link is refused, not half-read");
  assert.equal(await decode("not a pearl"), null);
  assert.ok(look(p).hue >= 0);
});

test("seals: a model contribution verifies only on exactly the content the server sealed", () => {
  process.env.PEARLS_SEAL_KEY = "test-key";
  const base = fromWords("A game that teaches multiplication")!;
  const shaped = seal({ ...base, hands: [...base.hands, { by: "model", how: "shaped", at: new Date().toISOString(), model: "claude-haiku-5-5" }] });
  assert.equal(verify(shaped), "verified");
  assert.equal(verify({ ...shaped, title: "Edited in the link" }), "unverified");
  const forged = { ...base, hands: [...base.hands, { by: "model" as const, how: "shaped" as const, at: new Date().toISOString(), model: "claude-opus-5-5", sig: "0".repeat(64) }] };
  assert.equal(verify(forged), "unverified");
  assert.equal(verify(base), "none");
});

test("give it to another AI and bring the reply back: lineage kept, the other AI's identity is only declared", () => {
  const p = fromWords("Notes for my biology exam: photosynthesis turns light into sugar.")!;
  const text = forAI(p, "https://aanebed.vercel.app/pearl/abc", "Make practice questions");
  assert.ok(text.includes("Make practice questions") && text.includes("```pearl") && text.includes(idOf(p)));
  const reply = 'Here you go!\n```pearl\n{"title":"Photosynthesis practice","kind":"study","essence":"Five questions.","blocks":[{"t":"quiz","heading":"","questions":[{"q":"What does photosynthesis make?","options":["Sugar","Salt"],"answer":0,"why":"Glucose"}]}],"by":"Gemini","note":"Added a quiz"}\n```';
  const back = fromReply(reply, p)!;
  assert.equal(back.from!.id, idOf(p));
  assert.equal(back.hands.at(-1)!.by, "another-ai");
  assert.equal(back.hands.at(-1)!.name, "Gemini");
  assert.equal(back.origin, p.origin);
  assert.equal(fromReply("no pearl here", p), null);
  assert.equal(normalize({ title: "x", blocks: [{ t: "quiz", questions: [{ q: "?", options: ["a"], answer: 3 }] }] }), null, "an unplayable quiz is dropped, and a Pearl with no blocks is refused");
});
