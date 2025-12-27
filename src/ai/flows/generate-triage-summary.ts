'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a summary
 * of the symptom triage results.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TriageStateSchema, TriageSummarySchema } from '@/lib/schemas';
import type { TriageState } from './symptom-triage';

export type TriageSummary = z.infer<typeof TriageSummarySchema>;

const triageSummaryPrompt = ai.definePrompt({
  name: 'triageSummaryPrompt',
  input: { schema: TriageStateSchema },
  output: { schema: TriageSummarySchema },

  prompt: `You are an AI medical assistant providing a safe, educational summary of a symptom triage. Your response MUST be extremely cautious, non-prescriptive, and clear. You MUST NOT provide a diagnosis.

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

  Based on this data, generate a summary following these strict rules:
  1. Identify the single 'mostProbableCondition'. This is for educational purposes only.
  2. Determine the 'confidenceLevel'. Use 'High' if one probability is > 0.7, 'Moderate' if > 0.5, and 'Low' otherwise.
  3. Create a 'reasoning' summary. Link the user's answers to the likely condition in simple, educational terms. Do not use alarming language.
  4. Suggest safe, general 'nextSteps'. Use phrases like "You might consider..." or "It could be helpful to...". Never use command words like 'take' or 'use'. The tone must be suggestive, not directive. Crucially, you MUST end the next steps with a sentence advising medical consultation if things don't improve, like: "If symptoms persist or worsen, consulting a healthcare provider for a definitive diagnosis is recommended."
  
  Never claim 100% certainty. Frame everything as educational information, not a medical diagnosis. Your tone must be helpful, supportive, and safe.`,
});

export const generateTriageSummary = ai.defineFlow(
  {
    name: 'generateTriageSummaryFlow',
    inputSchema: TriageStateSchema,
    outputSchema: TriageSummarySchema,
  },
  async (finalState: TriageState) => {
    const { output } = await triageSummaryPrompt(finalState);
    return output!;
  }
);
