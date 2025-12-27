'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing personalized health insights
 * based on the user's tracked symptoms and medications.
 *
 * - getPersonalizedHealthInsights - A function that generates personalized health insights.
 * - HealthInsightsInput - The input type for the getPersonalizedHealthInsights function.
 * - HealthInsightsOutput - The return type for the getPersonalizedHealthInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HealthInsightsInputSchema = z.object({
  symptoms: z.string().describe('A list of symptoms the user has experienced.'),
  medications: z.string().describe('A list of medications the user is taking.'),
});
export type HealthInsightsInput = z.infer<typeof HealthInsightsInputSchema>;

const HealthInsightsOutputSchema = z.object({
  insights: z.string().describe('Personalized health insights based on the provided data.'),
  suggestedQuestions: z
    .string()
    .describe('Suggested questions for the user to ask their doctor.'),
});
export type HealthInsightsOutput = z.infer<typeof HealthInsightsOutputSchema>;

export async function getPersonalizedHealthInsights(input: HealthInsightsInput): Promise<HealthInsightsOutput> {
  return personalizedHealthInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedHealthInsightsPrompt',
  input: {schema: HealthInsightsInputSchema},
  output: {schema: HealthInsightsOutputSchema},
  prompt: `You are an AI health assistant. Your goal is to provide personalized health insights to the user based on their tracked symptoms and medications.

  Analyze the following data and provide insights:
  Symptoms: {{{symptoms}}}
  Medications: {{{medications}}}

  Based on this data, generate personalized health insights that correlate symptoms and medications, offering potential explanations and suggesting questions for the next doctor's visit.

  Output the insights in a clear and concise manner. Also suggest some questions that user should ask their doctor during the next visit. Make sure the questions are relevant to the user's situation.
  `,
});

const personalizedHealthInsightsFlow = ai.defineFlow(
  {
    name: 'personalizedHealthInsightsFlow',
    inputSchema: HealthInsightsInputSchema,
    outputSchema: HealthInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
