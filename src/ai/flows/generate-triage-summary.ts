'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a summary
 * of the symptom triage results.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TriageStateSchema } from './symptom-triage';

export const TriageSummarySchema = z.object({
  mostProbableCondition: z.string().describe('The single most probable condition based on the triage. If probabilities are very close, choose the one that is slightly more common or benign.'),
  confidenceLevel: z.enum(['Low', 'Moderate', 'High']).describe('An assessment of the confidence in the most probable condition, based on the final probabilities.'),
  reasoning: z.string().describe('A brief, bulleted list explaining why this condition is likely, referencing specific answers. E.g., "- Fever and cough are common in viral infections."'),
  nextSteps: z.string().describe('A safe, non-prescriptive next step for the user. E.g., "Rest and hydrate. You can use over-the-counter pain relievers if needed." Do not suggest specific medications unless they are extremely common and safe like Ibuprofen or Paracetamol for general discomfort.'),
});

export type TriageSummary = z.infer<typeof TriageSummarySchema>;

const triageSummaryPrompt = ai.definePrompt({
  name: 'triageSummaryPrompt',
  input: { schema: TriageStateSchema },
  output: { schema: TriageSummarySchema },

  prompt: `You are an AI medical assistant providing a safe, educational summary of a symptom triage. Your response must be cautious and clear. Do not provide a diagnosis.

  Analyze the following triage data. The user has completed a series of questions and no red flags were detected.
  
  Primary Symptom: {{{primarySymptom}}}
  
  Questions and Answers:
  {{#each questionHistory}}
  - Q: {{this}}
  - A: {{lookup ../answers @index}}
  {{/each}}
  
  Final Condition Probabilities:
  {{#each conditionProbabilities}}
  - {{condition}}: {{probability}}
  {{/each}}

  Based on this data, generate a summary.
  1. Identify the single 'mostProbableCondition'.
  2. Determine the 'confidenceLevel'. Use 'High' if one probability is > 0.7, 'Moderate' if > 0.5, and 'Low' otherwise.
  3. Create a 'reasoning' summary. Link the user's answers to the likely condition in simple terms.
  4. Suggest safe, general 'nextSteps'. Focus on self-care. Do not use prescriptive language.
  
  Never claim 100% certainty. Your tone should be helpful and educational, not clinical or diagnostic.`,
});

export const generateTriageSummary = ai.defineFlow(
  {
    name: 'generateTriageSummaryFlow',
    inputSchema: TriageStateSchema,
    outputSchema: TriageSummarySchema,
  },
  async (finalState) => {
    const { output } = await triageSummaryPrompt(finalState);
    return output!;
  }
);
