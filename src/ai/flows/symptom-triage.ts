'use server';

/**
 * @fileOverview This file defines a Genkit flow for conducting a symptom triage.
 * It takes a primary symptom and asks a series of questions to determine if a red flag condition is met.
 * It uses a Bayesian probability engine to update the likelihood of various conditions.
 *
 * - symptomTriageFlow - A function that progresses the triage state.
 * - TriageStateSchema - The Zod schema for the triage state object.
 * - TriageState - The TypeScript type for the triage state.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';


const QuestionSchema = z.object({
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

type RiskLevel = 'GREEN' | 'YELLOW' | 'RED';

export const TriageStateSchema = z.object({
  triageId: z.string().describe('Unique ID for this triage session.'),
  completedAt: z.number().nullable().describe('Timestamp when the triage was completed.'),
  primarySymptom: z.string().describe('The user-reported primary symptom.'),
  questionHistory: z.array(z.string()).describe('The text of questions that have already been asked.'),
  answers: z.array(z.enum(['Yes', 'No'])).describe('The user\'s answers to the questions in `questionHistory`.'),
  isCompleted: z.boolean().describe('Whether the triage flow has completed.'),
  redFlag: RedFlagSchema.nullable().describe('If a red flag was triggered, this contains the reason.'),
  currentQuestion: QuestionSchema.nullable().describe('The current question to be asked to the user.'),
  conditionProbabilities: z.array(ConditionProbabilitySchema).describe('The current probability distribution of possible conditions.'),
  highestRiskLevel: z.enum(['GREEN', 'YELLOW', 'RED']).nullable().describe('The risk level of the most probable condition.'),
});

export type TriageState = z.infer<typeof TriageStateSchema>;

// Simplified database of questions and symptoms.
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

// Bayesian Engine Components
const CONDITIONS = {
  VIRAL_INFECTION: 'Viral Infection',
  BACTERIAL_INFECTION: 'Bacterial Infection',
  ALLERGIES: 'Allergies',
  STRESS: 'Stress',
};

const CONDITION_RISK_LEVEL: Record<string, RiskLevel> = {
  [CONDITIONS.VIRAL_INFECTION]: 'YELLOW',
  [CONDITIONS.BACTERIAL_INFECTION]: 'RED',
  [CONDITIONS.ALLERGIES]: 'YELLOW',
  [CONDITIONS.STRESS]: 'GREEN',
};

// P(Condition) - Base probabilities for each condition
const BASE_PROBABILITIES: Record<string, number> = {
  [CONDITIONS.VIRAL_INFECTION]: 0.4,
  [CONDITIONS.BACTERIAL_INFECTION]: 0.2,
  [CONDITIONS.ALLERGIES]: 0.25,
  [CONDITIONS.STRESS]: 0.15,
};

// P(Answer=Yes | Condition) - Likelihood of a "Yes" for a question given a condition
const LIKELIHOODS: Record<string, Record<string, number>> = {
  h4: { [CONDITIONS.STRESS]: 0.6, [CONDITIONS.VIRAL_INFECTION]: 0.3 }, // visual disturbances -> stress, viral
  h5: { [CONDITIONS.VIRAL_INFECTION]: 0.5 }, // worse on position change -> viral (sinus)
  f3: { [CONDITIONS.STRESS]: 0.8 }, // sad/hopeless -> stress
  f4: { [CONDITIONS.STRESS]: 0.7, [CONDITIONS.VIRAL_INFECTION]: 0.4 }, // sleep trouble -> stress, viral
  fe4: { [CONDITIONS.VIRAL_INFECTION]: 0.8, [CONDITIONS.BACTERIAL_INFECTION]: 0.6 }, // sore throat/cough -> viral, bacterial
  fe5: { [CONDITIONS.VIRAL_INFECTION]: 0.7, [CONDITIONS.BACTERIAL_INFECTION]: 0.5 }, // contact with sick -> viral, bacterial
  pf3: { [CONDITIONS.ALLERGIES]: 0.9 }, // itchy rash/hives -> allergies
  pf5: { [CONDITIONS.ALLERGIES]: 0.7 }, // new meds/foods -> allergies
  st3: { [CONDITIONS.VIRAL_INFECTION]: 0.7, [CONDITIONS.BACTERIAL_INFECTION]: 0.8 }, // high fever -> viral, bacterial
  st4: { [CONDITIONS.BACTERIAL_INFECTION]: 0.8 }, // swollen tonsils/white spots -> bacterial (strep)
  g3: { [CONDITIONS.VIRAL_INFECTION]: 0.7, [CONDITIONS.BACTERIAL_INFECTION]: 0.8 }, // fever -> viral, bacterial
  g4: { [CONDITIONS.VIRAL_INFECTION]: 0.8, [CONDITIONS.STRESS]: 0.6 }, // fatigue -> viral, stress
};


const MAX_QUESTIONS = 5;

/**
 * Updates the probabilities of conditions based on a new answer using Bayes' theorem.
 * P(C|A) = [P(A|C) * P(C)] / P(A)
 */
function updateProbabilities(
  currentProbs: Record<string, number>,
  questionId: string,
  answer: 'Yes' | 'No'
): Record<string, number> {
  const newProbs: Record<string, number> = {};
  let totalProbability = 0;

  for (const condition in currentProbs) {
    const prior = currentProbs[condition];
    
    // Likelihood P(Answer|Condition)
    // Get the likelihood of a 'Yes' answer for this question given the condition.
    const yesLikelihood = LIKELIHOODS[questionId]?.[condition] || 0.1; // Default to a small probability if not defined.
    const likelihood = answer === 'Yes' ? yesLikelihood : 1 - yesLikelihood;

    const posterior = likelihood * prior;
    newProbs[condition] = posterior;
    totalProbability += posterior;
  }

  // Normalize probabilities so they sum to 1
  if (totalProbability > 0) {
    for (const condition in newProbs) {
      newProbs[condition] /= totalProbability;
    }
  }

  return newProbs;
}


// This flow is a state machine that now incorporates a Bayesian engine.
export const symptomTriageFlow = ai.defineFlow(
  {
    name: 'symptomTriageFlow',
    inputSchema: TriageStateSchema,
    outputSchema: TriageStateSchema,
  },
  async (state) => {
    // 1. Initialize probabilities and ID if this is the first step
    if (state.questionHistory.length === 0) {
      if (!state.triageId) {
        state.triageId = uuidv4();
      }
      state.conditionProbabilities = Object.entries(BASE_PROBABILITIES).map(([condition, probability]) => ({
        condition,
        probability,
      }));
    }

    // 2. Check for red flags from the previous answer and update probabilities.
    if (state.questionHistory.length > 0) {
      const lastQuestionText = state.questionHistory[state.questionHistory.length - 1];
      const lastAnswer = state.answers[state.answers.length - 1];
      
      const allQuestions = Object.values(SYMPTOM_QUESTIONS).flat();
      const lastQuestionObject = allQuestions.find(q => q.text === lastQuestionText);

      if (lastQuestionObject) {
        // Check for red flag first. This is the highest priority.
        if (lastQuestionObject.redFlag && lastAnswer === 'Yes') {
          state.isCompleted = true;
          state.redFlag = { reason: `The user answered "Yes" to the question: "${lastQuestionText}"` };
          state.currentQuestion = null;
          state.highestRiskLevel = 'RED';
          state.completedAt = Date.now();
          return state;
        }

        // If no red flag, update probabilities.
        const currentProbsMap = state.conditionProbabilities.reduce((acc, curr) => {
          acc[curr.condition] = curr.probability;
          return acc;
        }, {} as Record<string, number>);

        const newProbsMap = updateProbabilities(currentProbsMap, lastQuestionObject.id, lastAnswer);

        state.conditionProbabilities = Object.entries(newProbsMap).map(([condition, probability]) => ({
          condition,
          probability,
        }));
      }
    }
    
    const checkCompletion = () => {
       if (state.questionHistory.length >= MAX_QUESTIONS) {
         state.isCompleted = true;
         state.currentQuestion = null;
       }
    };
    checkCompletion();

    // 3. Find the next question that hasn't been asked yet.
    const normalizedSymptom = state.primarySymptom.toLowerCase().trim();
    const questionSet = SYMPTOM_QUESTIONS[normalizedSymptom] || SYMPTOM_QUESTIONS.default;

    const nextQuestion = questionSet.find(
      (q) => !state.questionHistory.includes(q.text)
    );

    // 4. Update the state with the next question or complete the flow.
    if (nextQuestion && !state.isCompleted) {
      state.currentQuestion = nextQuestion;
    } else {
      state.isCompleted = true;
      state.currentQuestion = null;
    }
    
    // 5. If completed, determine the highest risk level and set completion time
    if (state.isCompleted) {
        if (!state.completedAt) {
          state.completedAt = Date.now();
        }
        if (state.conditionProbabilities.length > 0 && !state.redFlag) {
            const sortedConditions = [...state.conditionProbabilities].sort((a, b) => b.probability - a.probability);
            const mostLikelyCondition = sortedConditions[0].condition;
            state.highestRiskLevel = CONDITION_RISK_LEVEL[mostLikelyCondition] || 'YELLOW';
        }
    }

    return state;
  }
);
