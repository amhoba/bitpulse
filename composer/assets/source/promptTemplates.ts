import fs from 'fs';
import path from 'path';

export type PromptTemplate = {
    id: string;
    name: string;
    description: string;
    template: string;
};

const TITLE_PROMPTS_PATH = path.join(__dirname, '..', 'prompts', 'title');
const ARTICLE_PROMPTS_PATH = path.join(__dirname, '..', 'prompts', 'article');

function loadTemplatesFromDirectory(dirPath: string): PromptTemplate[] {
    if (!fs.existsSync(dirPath)) return [];

    return fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.json'))
        .map(file => {
            const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
            const parsed = JSON.parse(raw);
            return {
                id: parsed.id,
                name: parsed.name || path.basename(file, '.json'),
                description: parsed.description,
                template: parsed.template
            } as PromptTemplate;
        });
}

// Load title-specific prompts
export function loadTitlePromptTemplates(): PromptTemplate[] {
    return loadTemplatesFromDirectory(TITLE_PROMPTS_PATH);
}

// Load article-specific prompts
export function loadArticlePromptTemplates(): PromptTemplate[] {
    return loadTemplatesFromDirectory(ARTICLE_PROMPTS_PATH);
}

// Get title prompt by ID
export function getTitlePromptById(id: string): PromptTemplate | undefined {
    return loadTitlePromptTemplates().find(t => t.id === id);
}

// Get article prompt by ID
export function getArticlePromptById(id: string): PromptTemplate | undefined {
    return loadArticlePromptTemplates().find(t => t.id === id);
}

// Fill in template with variables
export function fillPromptTemplate(template: PromptTemplate, vars: Record<string, string>): string {
    let prompt = template.template;
    Object.entries(vars).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return prompt;
}
