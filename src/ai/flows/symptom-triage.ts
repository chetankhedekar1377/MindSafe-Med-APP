'use server';

/**
 * @fileOverview This file defines a Genkit flow for conducting a symptom triage.
 * It takes a primary symptom and asks a series of questions to determine if a red flag condition is met.
 *
 * - symptomTriageFlow - A function that progresses the triage state.
 * - TriageStateSchema - The Zod schema for the triage state object.
 * - TriageState - The TypeScript type for the triage state.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  redFlag: z.boolean().describe('Whether a "Yes" answer to this question constitutes a red flag.'),
});

const RedFlagSchema = z.object({
  reason: z.string(),
});

export const TriageStateSchema = z.object({
  primarySymptom: z.string().describe('The user-reported primary symptom.'),
  questionHistory: z.array(z.string()).describe('The text of questions that have already been asked.'),
  answers: z.array(z.enum(['Yes', 'No'])).describe('The user\'s answers to the questions in `questionHistory`.'),
  isCompleted: z.boolean().describe('Whether the triage flow has completed.'),
  redFlag: RedFlagSchema.nullable().describe('If a red flag was triggered, this contains the reason.'),
  currentQuestion: QuestionSchema.nullable().describe('The current question to be asked to the user.'),
});

export type TriageState = z.infer<typeof TriageStateSchema>;

// This is a simplified database of questions and symptoms.
// In a real application, this would be more complex, likely in a database.
const SYMPTOM_QUESTIONS: Record<string, z.infer<typeof QuestionSchema>[]> = {
  headache: [
    { id: 'h1', text: 'Is your headache severe and sudden, like a thunderclap?', redFlag: true },
    { id: 'h2', text: 'Are you also experiencing a stiff neck, fever, or confusion?', redFlag: true },
    { id: 'h3', text: 'Have you recently had a head injury?', redFlag: true },
    { id: 'h4', text: 'Is the headache accompanied by visual disturbances?', redFlag: false },
    { id: 'h5', text: 'Does the headache feel worse when you change position?', redFlag: false },
  ],
  fatigue: [
    { id: 'f1', text: 'Are you feeling so tired that you cannot manage your daily activities?', redFlag: true },
    { id: 'f2', text: 'Are you also experiencing unexplained weight loss?', redFlag: true },
    { id: 'f3', text: 'Do you feel persistently sad or hopeless?', redFlag: false },
    { id: 'f4', text: 'Are you having trouble sleeping or sleeping too much?', redFlag: false },
    { id: 'f5', text: 'Have you noticed any unusual swelling or lumps?', redFlag: false },
  ],
  fever: [
    { id: 'fe1', text: 'Is your temperature over 103°F (39.4°C)?', redFlag: true },
    { id: 'fe2', text: 'Are you experiencing a severe headache or a stiff neck with your fever?', redFlag: true },
    { id: 'fe3', text: 'Do you have a rash that is spreading rapidly?', redFlag: true },
    { id: 'fe4', text: 'Are you also experiencing a sore throat or cough?', redFlag: false },
    { id: 'fe5', text: 'Have you been in contact with anyone who has been sick?', redFlag: false },
  ],
  'puffy face': [
    { id: 'pf1', text: 'Are you having difficulty breathing or swallowing?', redFlag: true },
    { id: 'pf2', text: 'Did the swelling appear suddenly and rapidly?', redFlag: true },
    { id: 'pf3', text: 'Is the swelling accompanied by an itchy rash or hives?', redFlag: false },
    { id: 'pf4', text: 'Have you noticed swelling in other parts of your body, like your ankles?', redFlag: false },
    { id: 'pf5', text: 'Have you recently started any new medications or tried new foods?', redFlag: false },
  ],
  acidity: [
    { id: 'ac1', text: 'Are you experiencing severe chest pain, possibly spreading to your arm or jaw?', redFlag: true },
    { id: 'ac2', text: 'Are you having difficulty or pain when swallowing?', redFlag: true },
    { id: 'ac3', text: 'Have you noticed black, tarry stools?', redFlag: true },
    { id: 'ac4', text: 'Does the discomfort get worse when you lie down or bend over?', redFlag: false },
    { id: 'ac5', text: 'Does an over-the-counter antacid provide any relief?', redFlag: false },
  ],
  'sore throat': [
    { id: 'st1', text: 'Are you having severe difficulty swallowing or breathing?', redFlag: true },
    { id: 'st2', text: 'Are you drooling?', redFlag: true },
    { id: 'st3', text: 'Do you have a high fever accompanying the sore throat?', redFlag: false },
    { id: 'st4', text: 'Are your tonsils swollen or do they have white spots?', redFlag: false },
    { id: 'st5', text: 'Do you also have a rash?', redFlag: false },
  ],
  default: [
    { id: 'g1', text: 'Are you experiencing severe difficulty breathing?', redFlag: true },
    { id: 'g2', text: 'Have you experienced any chest pain or pressure in the last 24 hours?', redFlag: true },
    { id: 'g3', text: 'Do you have a fever over 101°F (38.3°C)?', redFlag: false },
    { id: 'g4', text: 'Are you feeling unusually fatigued or weak?', redFlag: false },
    { id: 'g5', text: 'Are you feeling confused or having trouble staying awake?', redFlag: true },
  ]
};

const MAX_QUESTIONS = 5;

// This flow is a simple state machine. It's not using an LLM for now,
// but is structured to allow for more intelligent question selection in the future.
export const symptomTriageFlow = ai.defineFlow(
  {
    name: 'symptomTriageFlow',
    inputSchema: TriageStateSchema,
    outputSchema: TriageStateSchema,
  },
  async (state) => {
    // 1. Check for immediate red flags from the previous answer.
    if (state.questionHistory.length > 0) {
      const lastQuestionText = state.questionHistory[state.questionHistory.length - 1];
      const lastAnswer = state.answers[state.answers.length - 1];
      
      const allQuestions = Object.values(SYMPTOM_QUESTIONS).flat();
      const lastQuestionObject = allQuestions.find(q => q.text === lastQuestionText);

      if (lastQuestionObject && lastQuestionObject.redFlag && lastAnswer === 'Yes') {
        state.isCompleted = true;
        state.redFlag = { reason: `The user answered "Yes" to the question: "${lastQuestionText}"` };
        state.currentQuestion = null;
        return state;
      }
    }

    // 2. Check if we've reached the maximum number of questions.
    if (state.questionHistory.length >= MAX_QUESTIONS) {
      state.isCompleted = true;
      state.currentQuestion = null;
      return state;
    }

    // 3. Determine which set of questions to use.
    const normalizedSymptom = state.primarySymptom.toLowerCase().trim();
    const questionSet = SYMPTOM_QUESTIONS[normalizedSymptom] || SYMPTOM_QUESTIONS.default;

    // 4. Find the next question that hasn't been asked yet.
    const nextQuestion = questionSet.find(
      (q) => !state.questionHistory.includes(q.text)
    );

    // 5. Update the state with the next question or complete the flow.
    if (nextQuestion) {
      state.currentQuestion = nextQuestion;
    } else {
      state.isCompleted = true;
      state.currentQuestion = null;
    }

    return state;
  }
);
