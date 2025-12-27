
import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  redFlag: z.boolean().describe('Whether a "Yes" answer to this question constitutes a red flag.'),
});

const RedFlagSchema = z.object({
  reason: z.string(),
});

const ConditionProbabilitySchema = z.object({
  condition: z.string(),
  probability: z.number(),
});

export const TriageStateSchema = z.object({
  triageId: z.string().describe('Unique ID for this triage session.'),
  completedAt: z.number().nullable().describe('Timestamp when the triage was completed.'),
  primarySymptom: z.string().describe('The user-reported primary symptom.'),
  questionHistory: z.array(z.string()).describe('The text of questions that have already been asked.'),
  answers: z.array(z.enum(['Yes', 'No'])).describe("The user's answers to the questions in `questionHistory`."),
  isCompleted: z.boolean().describe('Whether the triage flow has completed.'),
  redFlag: RedFlagSchema.nullable().describe('If a red flag was triggered, this contains the reason.'),
  currentQuestion: QuestionSchema.nullable().describe('The current question to be asked to the user.'),
  conditionProbabilities: z.array(ConditionProbabilitySchema).describe('The current probability distribution of possible conditions.'),
  highestRiskLevel: z.enum(['GREEN', 'YELLOW', 'RED']).nullable().describe('The risk level of the most probable condition.'),
  baseProbabilities: z.record(z.number()).optional(),
  likelihoods: z.record(z.record(z.number())).optional(),
});

export const TriageSummarySchema = z.object({
  mostProbableCondition: z.string().describe('The single most probable condition based on the triage. If probabilities are very close, choose the one that is slightly more common or benign.'),
  confidenceLevel: z.enum(['Low', 'Moderate', 'High']).describe('An assessment of the confidence in the most probable condition, based on the final probabilities.'),
  reasoning: z.string().describe('A brief, bulleted list explaining why this condition is likely, referencing specific answers. E.g., "- Fever and cough are common in viral infections." Keep it simple and educational.'),
  nextSteps: z.string().describe('A safe, non-prescriptive next step for the user. Frame it as a gentle suggestion. E.g., "For general comfort, you might consider resting and hydrating. An over-the-counter pain reliever may help with discomfort." Always end with a sentence like "If your symptoms persist or worsen, it is always a good idea to consult a healthcare provider for an accurate diagnosis."'),
});
