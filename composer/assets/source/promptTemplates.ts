import fs from 'fs';
import path from 'path';

export type PromptTemplate = {
    id: string;
    name: string;
    description: string;
    template: string;
};

const PROMPTS_PATH = path.join(__dirname, '..', 'prompts', 'article_prompts.json');

// Load all templates from file
export function loadPromptTemplates(): PromptTemplate[] {
    const raw = fs.readFileSync(PROMPTS_PATH, 'utf-8');
    return JSON.parse(raw);
}

// Find a template by id
export function getPromptTemplateById(id: string): PromptTemplate | undefined {
    const all = loadPromptTemplates();
    return all.find(t => t.id === id);
}

// Fill in template with content.
export function fillPromptTemplate(template: PromptTemplate, vars: Record<string, string>): string {
    let prompt = template.template;
    Object.entries(vars).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return prompt;
}
