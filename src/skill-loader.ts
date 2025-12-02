import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface Skill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples: string[];
  inputModes: string[];
  outputModes: string[];
}

interface SkillFrontmatter {
  name: string;
  description: string;
}

function parseFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter: SkillFrontmatter = { name: '', description: '' };
  const lines = match[1].split('\n');

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      if (key.trim() === 'name') frontmatter.name = value;
      if (key.trim() === 'description') frontmatter.description = value;
    }
  }

  return frontmatter.name ? frontmatter : null;
}

function toSnakeCase(str: string): string {
  return str.toLowerCase().replace(/-/g, '_');
}

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Load skills from a directory containing skill subdirectories.
 * Each subdirectory should contain a SKILL.md file with YAML frontmatter.
 *
 * @param skillsDir - Path to skills directory
 * @param type - Optional type tag (e.g., 'user' or 'project')
 * @returns Array of loaded skills
 */
export function loadSkills(skillsDir: string, type?: string): Skill[] {
  if (!existsSync(skillsDir)) {
    return [];
  }

  const skills: Skill[] = [];
  const entries = readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillFile = join(skillsDir, entry.name, 'SKILL.md');
    if (!existsSync(skillFile)) continue;

    const content = readFileSync(skillFile, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (frontmatter) {
      const tags = [entry.name];
      if (type) tags.push(type);

      skills.push({
        id: toSnakeCase(entry.name),
        name: frontmatter.name || toTitleCase(entry.name),
        description: frontmatter.description,
        tags,
        examples: [],
        inputModes: ['text/plain'],
        outputModes: ['text/plain'],
      });
    }
  }

  return skills;
}
