import { ContentItem } from '../types';

export const modulesData: ContentItem[] = [
  {
    id: 'self-correction',
    title: 'Self-Correction Module',
    category: 'module',
    description: 'Reflect on and iterate on AI outputs to improve quality and accuracy.',
    isPro: true,
    tags: ['iteration', 'quality', 'reflection', 'advanced'],
    content: `
# Self-Correction Module

This module helps you refine AI outputs by forcing a reflection step. It is essential for complex reasoning tasks where the first attempt might contain logical fallacies or missed constraints.

## When to use
- When the accuracy of the output is critical.
- For complex coding, mathematical, or logic tasks.
- To reduce hallucinations in factual queries.

## Prompt Template

\`\`\`markdown
# Role
Quality Assurance Specialist & Critical Thinker

# Task
Review the previous output provided above. Your goal is to identify any logical fallacies, factual errors, missing constraints, or areas for improvement.

# Steps
1. **Analyze**: Break down the previous output sentence by sentence.
2. **Critique**: List specific errors or weaknesses. If the output is perfect, state why.
3. **Refine**: Rewrite the output, incorporating the corrections.

# Output Format
## Critique
- [Error/Weakness 1]
- [Error/Weakness 2]

## Refined Output
[The improved version of the content]
\`\`\`
    `
  }
];