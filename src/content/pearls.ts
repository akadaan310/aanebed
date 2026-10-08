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
 * Pearls real models made on this site (production, 2026-10-08), kept as their exact links,
 * unedited, with the server's seals. Each one was made from the actual Pearl before it.
 */
export const MADE_BY_MODELS: { code: string; story: string }[] = [
  { code: "dVbbjts2EP2VAZ9l1zd5vepDkS7SpkUDFNgFCiTYhxE5MhlTpJakrKjB_nsxlPbibfJiWIJmeObMnDP8JhofWkyiEh1hsPGntShEMsmSqMQtIdxgl9A4-NjbZDprJCbjnSjEyTglKnHElkQhKEZykoPeQWzRWoiEi6SpJQXtRSxwCDQ-AEKkM7nFSBgW3qoCBk2BQPoQSCZAFwcKETTZDhDkDCWisdBgSJoCoAw-RkiawEtCtxSFqK2Xpyiqz98EV5boaxKF0ITKuKOoxAc_5IAMZPDhFDnIq1FU4k4TdBZHCmAiIIy-d8eLo407AkLtMb0-PBIu4T1K_bbaLvjaUjsXQ-qpOjtC6880Reds3hEMeM7cDBhUAegUIDTBkFN2BOVtp40DHyD1IVmCL964KYMMNAA2iQLQmcIIjTn_j8kl_BM8w5-JVR6cTxCNOz3D-HlK91SwaTs7wpESk3Ekx6dq41IBsZcaMIL0vUtMCj30aOEYfN9F8A00Juol3CYMCQaTdE68iQWUMVe2XsWC3zlApUBjUBQgYW0pcl7--uxHPBIcPUXwbikei6mlD73596Klt9h29vn7h54ik899ffnP8_Awt_i5PqIIm1x4LIC4fxlqOaPnUWnRjfkRjIPkE9pfRCF895RVXIlCrFf8sxGF2JTivhATxaJaF2LQebAGf8HNmXjANpBMSxFKnn0j9URihPVqKvYhK0oGrEFjhB1YOsZXsPiR27jN30TQeKbvoWNg660oxG77fXQ6EL3G5_ssgO2Mb_cW3-YF310WLQaCPURN1kYmKnPpGygheHmCznv7Gvj8IUexjt-CXrMPbZnTci8KsV99F_VvzOIL6Gi-MuZyxrx_g3l7wWmU2nvLYYepuXEwbYQOY5qFnN8y61cQO58u0PPzj8ZhXTLs3TP23Wvsmyfs781Rp9fg2QoZ_mGGf_UGfrlfisf7JwXERF28kMCvvbH8Fwy7nUnUZjQ32vtI7LUmSyR5b1_Ei1BjNBIGqqFj6eTp_3D38a8Cbm5vs07_xDPeymC6VEB27eyb2HVQ85EU2HNvAmHKxxDnlCeujO0rW1j2t6QxzZ43Oxz4eU4ufYrz_U6OAmcM6JRv37rqs6qhCb7l5aB9JDdTl02kgMjWw4zkojYFlLPv8AHvlLp0tAlf1H6Il1aGETojUx8o8oJygG4Gyu0a2FE54d8WRzAJkj9SXk351JGFpLA_arbmzIb60seU7U2ZpjGyt2nkNlDmY5hQEDTGqQiEcWTW2R6X4v7xvhA-mKNxohJ_wICM20-NYPLz6s39ydUkZpcitOMLhksml3CrsxNN88cA7fNa4qUmCuF4gVafpwl7maQ6-CFSgDOFyD3J9dZ9SpPxTgTzOEiejT4QBMpd592f227pTFYU4iOeeHS6YFxu3bTKn64Pr3oKkuMjJZaURqcmV69ZUKPvWQ9-EJVoUfGtJF9sNqvNfrFeLVaHu822Wl9V5dXysDt8yl6QI1uvMowpNmrsSP0g-lCtyuVhtf4kijmsEtJir2ih0Zz6Rblg9Tuf-C501wfHBTDDihCMS_5JP9I7Sd28GRF4o0G-uHA_-QaSe5FlngmrX-TNPYmGNb_ZyOtG7lDWa1rR9X6H6nrbrPf7ZnvY7uXVbrc_7FbYXNeHerW9VrIpS9WsN1var5pSNoLniRUkKtdb-_gf", story: "Claude Haiku 5.5 shaped a parent's one-line idea into this (8 s)." },
  { code: "jVfbjuO4Ef2VAl-yC6gdS5av-xDMdC6bYCcbpBsIsMEgKJMli2uK1JBUq53B_HtQpHzrnQHyYnTbYrHqnKpzSp9F43yHUexET-hN-H0pChF1NCR24okQHrGPqC18GEzUvdESo3ZWFOKorRI7ccCORCEoBLKSD72DQPgQW-pIQXd3CvhhaJwHhEAvZB9OhP7BGVXA2JInkM57khHQhpF8AInenyC2BHLKA6V3IaSvnCS0BYw6toDQolfkwdALmXTH2JKF0BLoANLZRiuyHFml2xGkJ4yDJ4gOpDOG7-VzhLLNYWaiEHvj5DGI3b8_C0Yp0msUhWgJlbYHsRM_ujElk0obnT8GPuTUSezEc0vQGzyR5xwQTm6wh0slAbXR9gAIe4fxtrBAOIM_cRpnPN7gmOGBzr1QPpEiOEsw4ktCeESviqnYxmuyypxAOdO32oLzEAcfDcGvTtscQXoaAZtIHuiF_Aka_fIbPmbwL-845Ykey49C0PZ4yeKHO7YOFLnwA1m-rdU2FhAG2QIyJ4ONDAB9GtDAwbuhD-AaaHRoZ8DgvbgTHhKBoTc6grbRZWpCLq7RVoc2o5iZJ_SWr7Q03rPM1Lbkz1RrZ2fiS5FZNTrcs_pTuiNdcQ4QbvpEFEJH6rgt8qNQFvCIpoP3eNolBKpQwDJHKOdhBo9TmB0gSONGm6oUxXS-KuDReTTwT6ImR1jk0_Wbw1xUZu96elHAzz1Z-JknIp9ehQLWOcLmTYSpDa7H6wKeovMdPBEG-O52kgoYLE8Aqes8JVI3zFQ5B68PLbceTJl8v4NOv5KCiHtDAYaecSvnBfRmCBBH9xAi9fBpoMAkvMltbDEX9t7ZIewmgi_splm3LnVSIoTp5gZzRuXsjAFLr5F_m9o6xZ6Jj2eyPw36v3dkX2vP0N3WLwpxyTSJwKdpri9TTBRglVo_FFk7UpLrqY1ZHzq0p_QvaAvRRTR_EIVw_TmqKBeiEHXFHxv-2IqPhchDJnZlIcaW5eRJv95MSRJQHo0VRN1RgDWLqJZtnqcAdZUbnDN-Z8HJ6PohQItMHvou3CTH_4JysD0_RvzgC73Ncy0KsapFIdac7Ka8zbM65_l3bekmUUodogNsp0Q3bxJd3yT6nGwAPUEN3skj9M6ZkCFdZX5DQjnP_xI65-n8vbNZPtGqm9qmH78BfcXVVFtRiMWcP5Zfhf7P2ocI9VTAiqup6oJvs4BKpWuXQK_R4_m-6HhQoNpei0uS7hpYQGh1n91NM3PJC5yfRC01Uf4msVVBj967eEvY9M03q2IbT6WlrirrrxK1OHdOqqe8ZpHqqsrp54p_rq9ZiC-XWeJRDnfD9H7Qhv8EfaeSj61zgVi-dNcb9lxnrlaAsMegJYy0h54VP_H94_OHnwp4fHpKqPwNX_BJet3HAtIGkRwX-x72fCV5Vo0kJTSp5B7lkduQTTAZYXLJ2GKcnHPySe4bunXbDBTH-wtZ8hzRo1Wuu6oWNN51ifZJ51yT9WbwnteMSTxDRJ88LhU0WQV8l82hYGf4nq95p9S9S-YsQ-vGcG-PGKDXMvtREmS8bAM6wMjuzAGfPcrjb7ap_qxqPwDGi4JPTxXpulREEtAsuAm4BJKO4UZNC_EBjwz01U4hSE9kz_tY0KZ1A8VI163qYsbWRThRhNHZAoJLtiIxqSlbQJKLELUxPEaNtopv_IfBE2iW9gNFtvJ008kNHhQOh5Z3l5Sv-nUIMVWidNNoOZh44g6jRPWYoaUUl8UknCBNmlfsEh8L4bw-aCt24q8wok1eknqMq-rQmNx6iaLIdVGA7nTN4X5Zm8FT3kGzYHOC5rK38aYnCsGA85TkPphMOZeXvTwd2_Kk_ZGCPrDlXbC8YYBn59JOk0P9LoBxB-aaIdtTiNNaFVgTWrQqG9ueFeHkBp5mN4qd6FBxsPRyUM2r1UM5f5hvnqvFrlzvluvZpt78kqQtneycSm6Zz4YWe1LfOL3ZzZezzbz8RRTTsZ2QBgdFDy3q4_CwfFgyKC7y-8Tz4C1lhdWKMO-A0_RLZyX18dxy7OyQFnamjDfvhFsSqdSE-6s4MexBs2JVldw2ska5L2lO21WNartoytWqWWwWK7mu69WmnmOz3W_288VWyWa5VE1ZLWg1b5ay-RYGB-9G-00Iqmq2XMy_AkFw1lK8x-CdUqTevuPk9vBaHjX5qzIVN0O5N3S_AOfVfhInxmboFcYJ3tzjCa28fuc5QHPew_lA3rzYoI_U36A4X6xpvZ5XaynrlZyrel2qLapFXartstwgzZuN3NBiK9W2ktWykrStNutaSZov9yUJHjwWVbH7LDS_Wfb_KbdSyUVFcl3_n6-lX778Dw", story: "Claude Sonnet 5.5 received the Pearl above and grew it: a harder level and creatures to collect." },
  { code: "nVhtj9u4Ef4rA35pAmhdvdqygaJIgx5aoGmK2xwOuENQjKmRRVgiFZLyS4P892JIadfebICiX4ysSM4888zDmWG-itbYAb3YiZHQ9u6PmUiEV74nsROPhPAeR49Kw4ep92rslUSvjBaJOCrdiJ044EAiEeQcacmH3oEjfPAdDdTAcHcKeDO0xgKCoxPphyuhfTB9k4A2Z8DeGRit0p4aQAetVc2BQKJtHDgDviM4mSvyN6O90hM5wDNeobVmCMtOWiKdwFn5DhCkJfSTJfAGWqUbMBoIZQc9nahfiUTseyOPTux-_yqYBU8XLxLRETZKH8ROfOroFgecyLpIwN4013mD47gisgRa0zfUgNLehDg9mHaOwXfooVcnYhz-yfIKPurZ_Eg2Yktg7CfHBjq01IA0fU8ysMgbVxCBGR3Mh5iCAdeZMx9rUXqO2pn-RElwtkd5nNf5T9TuTBZQN4AwKhl46tRs8MuEPRysmUa3gr-y-cFYrfQhAdcR-MlqB-ZEFsyMPQGH13vTvZma4GAwJ4pLe4M-HDnjKWjhzKhnOr4L8teONGBk5A9uZhEtAfZ9wEBNxEPIeCK_y-Yl9wxAombrZrKgPCgNxoLzSh7ZNcZ_kl2Jb0nUgfM0ujshfMCj0ocAM0gU9_0sTZEI5WlgEYlfHIHSDV1mrMbG3TFC9jfiOLMup5Ah3JvJw2ZVwf4KWb6qQA6szA94pCdyn4Wxg_fYD_AXvMKb3CVQuQSy1L1N4L2x2MPPRC28KVwCJX_8OJKGj5JQw5u1S2DjEqjd2wDg0Rs7wCOhgzeDulADISoH08jAsvQt4_jVKk9RraypJ-Wy9JSGHu2BQE_DnqxLwE2y47tbwQXWT_fQDZywkPLG4lkD-lkN3psQ7Uf9rNHzk8c7jb6mzVuH8QvvWEOrXDd7d2oY--hX6YO7p_ZecPFAyyrZmwu5JGzighUv2KyoZAbkVN-ZibwP9WWRl2Y0rMmz0g6UZ4f_wEFpnIN6VsYUWBj4jOwJLbie6MR-sWEHAx40149Zq1dw3qoxuh97lBSP3xcT8XkR8aLOZxE_YuDitrCKZN7HJTBkVexEDheo4E_wZ65zKI9iJ7J0BZ_O5obllgtZJNrY-Nfzoj-bsBav1GI3qOLebpGu4Kf7s05dmMC-d_ensxQusLk_vklX8Mi95NY3d4BeHSl2GXAe5XFZgdjo7i0XcIHyRbw511hLt8CCMvxkff-dNixfO2msXqrIYnr9PeYyX8GjuoRa6GaRBqBMWDB3b6KGC2xfhJ2v4J9KExjpzTg5mu2QOnQe0A5usfOkhi-T-s-9GJ6ufwIIXyauTrIjeRSJ-DKR42sRZfFl7nNyHgYckYN1xJ_E-IP3TUw5_M2cYUB9jQEpDd547Bm-GRerIitEIsqcf2r-2YrPiYgXXuyyRJw7bq_M040yAk2KnXs1kINNAudOyS4WBQdlHqljxO_0wg506KAOtNyACyw1BrY3JHZ4opc4NyIR61IkYsNg6-wWZ77gDMl4BhrzoBxsZ6D1C6CbG6CfOuI2ZQlKsIZ7hDH9nND1fBMCy_HmV9yKafk-X36HurmJbV78AfU5R5NvRSKKlH-qV6n_SVnnoZwDWHM0eRlGCR3qE7utgC7e4uLPGziQh3z7HFyYHUwLBbhOjaGHW8WZA4eqN9wzOKggovglZCuHEa01_jZh85cfRsWzawgtqCorX01UsSgnxJM9owhx5dm8nPNy-YyCL9LnRBirDkqLnfg7nFGH_r2fVN889bgw4oY5xHNI5GC4QoPTofNkX8zDK3jsiP1EWTMN_dOg5Ai5c2geSHe_i3-FKQK_61jegLfcNJfm5Jb-hvNASD5UKbZ50_DDLCES8S40Gn82DzzywNnwrGHNvqfhpvGhbZjMDvXcKPZM5dVMXFDMWezEgA2_A8JTIk_z9UOWPqT1p7zYZZtdtVnVZf1b0EQ4OZgmeI9nXYcjNT84Xe_SalWn2W8imY_thOxxauihQ3WcHqqHinkynl8fn8JMGIJVDeEyhYesSKMljX6ZSbgeQhj_mcSxx2vIQJj8QughsTzzxR7uFBfNPJfbVpYo9xmltF2X2GyLNluv26Iu1nJTluu6TLHd7ut9Wmwb2VZV02Z5Qeu0rWT7Iw4O1pz1DynI81VVpK9Q4IzW5O85eNfw-wOhQ9ssU2MM2lslj4osPJX35EZSYaBdhuaQ-xPZ6_IcYW6msUE_0xtlH9iKj5F4NbBfnmh8gEe2OLAfabxhMS02tNmk-UbKci3TptxkzRabosyabZXVSGlby5qKrWy2ucyrXNI2rzdlIymt9hn9fyyWxWqzfo3FV4S0kPg868eh6eH2FbhIKY74h0k1MWwXx6w46N086XiNiQgEsiaTl9cyiJK3-VtGb7l-4nC_X-d1meG2Lcq0zhrcFLhN121dyarYbLBNi6ZtsWpTKpt9ui9qLBDzss7qCos0E1zP-OEsdl-F4rf8-G_aZOt9Xe3TIpX_238EfPv2Xw", story: "Then Claude Haiku 5.5 received Sonnet's Pearl and grew it again: cards for the fridge." },
];
