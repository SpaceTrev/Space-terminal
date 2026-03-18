// ── Confluence Scoring ──────────────────────────────────────────────

export interface ScoreParams {
  structureAligned: boolean;  // 30 pts
  biasConfluence: boolean;    // 25 pts
  fvgProximity: boolean;      // 20 pts
  momentumShift: boolean;     // 15 pts
  sessionStrength: number;    // 0-10 pts
}

export type Grade = "A+" | "A" | "B" | "C";

export interface ScoreResult {
  score: number;
  grade: Grade;
}

export function scoreSignal(params: ScoreParams): ScoreResult {
  let score = 0;

  if (params.structureAligned) score += 30;
  if (params.biasConfluence) score += 25;
  if (params.fvgProximity) score += 20;
  if (params.momentumShift) score += 15;
  score += Math.max(0, Math.min(10, params.sessionStrength));

  let grade: Grade;
  if (score >= 90) grade = "A+";
  else if (score >= 75) grade = "A";
  else if (score >= 50) grade = "B";
  else grade = "C";

  return { score, grade };
}
