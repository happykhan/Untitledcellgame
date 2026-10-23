const SCORE_KEY = "ucg_scores";
const NAME_KEY = "ucg_last_name";

function isScore(entry) {
  return (
    entry &&
    typeof entry.name === "string" &&
    Number.isFinite(entry.score) &&
    Number.isFinite(entry.elapsed) &&
    Number.isFinite(entry.kills)
  );
}

export function loadScoreboard(storage) {
  try {
    const store = storage ?? globalThis.localStorage;
    const entries = JSON.parse(store.getItem(SCORE_KEY) || "[]");
    return {
      scores: Array.isArray(entries)
        ? entries
            .filter(isScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20)
        : [],
      lastName: store.getItem(NAME_KEY) || "",
    };
  } catch {
    return { scores: [], lastName: "" };
  }
}

export function saveRunScore(result, storage) {
  const scores = [...loadScoreboard(storage).scores, result].sort((a, b) => b.score - a.score).slice(0, 20);
  try {
    const store = storage ?? globalThis.localStorage;
    store.setItem(NAME_KEY, result.name);
    store.setItem(SCORE_KEY, JSON.stringify(scores));
  } catch {
    // Storage may be unavailable; the player can still start another run.
  }
}
