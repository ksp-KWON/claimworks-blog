export const STRICT_RULES: string;

export interface Angle {
  id: string;
  name: string;
  instruction: string;
}

export function getRandomAngle(): Angle;

export function getTopicPlanningPrompt(keyword: string, trendTitle: string, existingPosts: string, targetCategory: string): string;
export function getPrecedentPlanningPrompt(
  detail: { courtName: string; caseName: string; caseNo: string; judgmentDate: string; judgmentSummary: string },
  existingPosts: string,
  targetCategory: string
): string;
export function getQueryGenerationPrompt(targetCategory: string, existingTitles: string): string;
export function getKeywordExtractionPrompt(targetCategory: string, existingTitles: string, headlines: string[]): string;
export function getHealingPrompt(keywords: string): string;
export function getManualPlanningPrompt(aiInput: string, existingPosts: string): string;

export function cleanAnalysisBlock(text: string): string;
export function getRenewalPrompt(currentTitle: string, query: string): string;

export const TOPIC_SCHEMA: any;
export function buildArticlePrompt(topic: any, angle: Angle, existingPosts: any[], precedentDetail?: any): string;
export function buildManualPrompt(mode: string, aiInput: string, angle: Angle, existingPosts: any[]): string;
export function getFssEvaluationPrompt(fssTitle: string, fssContent: string): string;
export function getFallbackLegalKeywordPrompt(targetCategory: string, context: string): string;
