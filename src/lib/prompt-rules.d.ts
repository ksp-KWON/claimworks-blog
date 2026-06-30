export const STRICT_RULES: string;

export interface Angle {
  id: string;
  name: string;
  instruction: string;
}

export function getRandomAngle(): Angle;

export function getBlogRole(): string;
export function getPrecedentRole(): string;
export function getBlogObjective(keywords: string): string;
export function getPrecedentObjective(): string;
export function getBlogMetaFirstLine(): string;
export function getPrecedentMetaFirstLine(): string;
export function getBlogLengthRulesManual(): string;
export function getBlogLengthRulesSemiAuto(): string;
export function getBlogFrontmatter(titleGuide: string, currentDate: string): string;
export function getTopicPlanningPrompt(keyword: string, trendTitle: string, existingPosts: string): string;
export function getPrecedentPlanningPrompt(
  detail: { courtName: string; caseName: string; caseNo: string; judgmentDate: string; judgmentSummary: string },
  existingPosts: string
): string;
export function getBlogSkeleton(angle: Angle, calcTag: string, postsCtx: string): string;
export function getPrecedentSkeleton(
  detail: { caseNo: string; caseName: string; courtName: string },
  angle: Angle,
  calcTag: string,
  postsCtx: string
): string;

export function calculateModelCapacity(maxTokens: number): string;
export function cleanAnalysisBlock(text: string): string;
export function getRenewalPrompt(currentTitle: string, query: string): string;
