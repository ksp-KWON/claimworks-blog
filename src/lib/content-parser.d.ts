export function yamlSafe(str: string): string;
export function parseGeneratedContent(rawOutput: string): { summary: string; content: string };
export function buildMarkdownFrontmatter(
  topic: any,
  summary: string,
  content: string,
  additionalFrontmatter?: Record<string, string>
): string;
