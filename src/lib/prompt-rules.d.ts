export const STRICT_RULES: string;

export interface Angle {
  id: string;
  name: string;
  instruction: string;
}

export function getRandomAngle(): Angle;

export function getTopicPlanningPrompt(keyword: string, trendTitle: string, existingPosts: string, targetCategory: string, planFeedback?: string): string;
export function getPrecedentPlanningPrompt(
  courtCase: any,
  existingPosts: string,
  targetCategory?: string,
  planFeedback?: string
): string;
export function getQueryGenerationPrompt(targetCategory: string, existingTitles: string): string;
export function getKeywordExtractionPrompt(targetCategory: string, existingTitles: string, headlines: string[]): string;
export function getNovelTopicPrompt(targetCategory: string, existingTitles: string, retryFeedback?: string): string;
export function getManualPlanningPrompt(arg1: any, arg2?: any, arg3?: any, arg4?: any): string;
export function getRenewalPrompt(currentTitle: string, query: string): string;
export const TOPIC_SCHEMA: any;
export const CONTENT_SCHEMA: any;
export function buildArticlePrompt(topic: any, angle: Angle, existingPosts: any[], precedentDetail?: any): string;
export function buildManualPrompt(mode: string, aiInput: string, angle: Angle, existingPosts: any[]): string;
export function getFssEvaluationPrompt(fssTitle: string, fssContent: string): string;
