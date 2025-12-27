'use client';

import { useState, useEffect } from 'react';
import useLocalStorage from './use-local-storage';

// These are the initial, hardcoded probabilities from the triage flow.
// In a real backend, these would be the starting point in your database.
const INITIAL_BASE_PROBABILITIES = {
  'Viral Infection': 0.4,
  'Bacterial Infection': 0.2,
  'Allergies': 0.25,
  'Stress': 0.15,
};

const INITIAL_LIKELIHOODS: Record<string, Record<string, number>> = {
  h4: { 'Stress': 0.6, 'Viral Infection': 0.3 },
  h5: { 'Viral Infection': 0.5 },
  f3: { 'Stress': 0.8 },
  f4: { 'Stress': 0.7, 'Viral Infection': 0.4 },
  fe4: { 'Viral Infection': 0.8, 'Bacterial Infection': 0.6 },
  fe5: { 'Viral Infection': 0.7, 'Bacterial Infection': 0.5 },
  pf3: { 'Allergies': 0.9 },
  pf5: { 'Allergies': 0.7 },
  st3: { 'Viral Infection': 0.7, 'Bacterial Infection': 0.8 },
  st4: { 'Bacterial Infection': 0.8 },
  g3: { 'Viral Infection': 0.7, 'Bacterial Infection': 0.8 },
  g4: { 'Viral Infection': 0.8, 'Stress': 0.6 },
};

export type Feedback = 'Better' | 'Same' | 'Worse' | 'Side Effects';

export function useReinforcementLearning() {
  const [baseProbabilities, setBaseProbabilities] = useLocalStorage('rl-base-probabilities', INITIAL_BASE_PROBABILITIES);
  const [likelihoods, setLikelihoods] = useLocalStorage('rl-likelihoods', INITIAL_LIKELIHOODS);

  const updateWeights = (
    mostLikelyCondition: string,
    feedback: Feedback
  ) => {
    // Create a mutable copy of the current probabilities to update.
    const newProbs = { ...baseProbabilities };
    const mostLikelyProb = newProbs[mostLikelyCondition];
    
    if(!mostLikelyProb) return;

    let adjustment = 0;

    switch (feedback) {
      case 'Better':
        // If the outcome was good, slightly increase confidence in the likely condition.
        adjustment = 0.05;
        break;
      case 'Same':
        // If the outcome was neutral, slightly decrease confidence.
        adjustment = -0.02;
        break;
      case 'Worse':
        // If the outcome was bad, sharply decrease confidence.
        adjustment = -0.1;
        break;
      case 'Side Effects':
        // Treat side effects as a negative outcome.
        adjustment = -0.05;
        break;
    }

    // Apply the adjustment, ensuring probability stays within a valid range [0.05, 0.95].
    newProbs[mostLikelyCondition] = Math.max(0.05, Math.min(0.95, mostLikelyProb + adjustment));

    // Normalize the probabilities so they sum to 1.
    const currentSum = Object.values(newProbs).reduce((sum, prob) => sum + prob, 0);
    const normalizationFactor = 1 / currentSum;
    for (const condition in newProbs) {
      newProbs[condition] *= normalizationFactor;
    }

    // In a real application, this updated `newProbs` object would be sent to your backend
    // to update the values in your database. Here, we simulate it with local storage.
    setBaseProbabilities(newProbs);
    
    console.log('--- Reinforcement Learning Simulation ---');
    console.log('Feedback:', feedback);
    console.log('Most Likely Condition:', mostLikelyCondition);
    console.log('Old Probabilities:', baseProbabilities);
    console.log('New Probabilities:', newProbs);
    console.log('------------------------------------');
  };

  return { baseProbabilities, likelihoods, updateWeights, INITIAL_BASE_PROBABILITIES, INITIAL_LIKELIHOODS };
}
