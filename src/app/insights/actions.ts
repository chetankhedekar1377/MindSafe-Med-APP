'use server';

import { getPersonalizedHealthInsights } from '@/ai/flows/personalized-health-insights';
import type { Medication, Symptom } from '@/lib/types';
import { format } from 'date-fns';

type InsightData = {
  symptoms: Symptom[];
  medications: Medication[];
};

export async function generateInsightsAction(data: InsightData) {
  try {
    const symptomsString =
      data.symptoms
        .map(
          (s) =>
            `- ${s.name} (Severity: ${s.severity}/10) on ${format(
              new Date(s.date),
              'PPP'
            )}`
        )
        .join('\n') || 'No symptoms tracked.';

    const medicationsString =
      data.medications
        .map(
          (m) =>
            `- ${m.name} (${m.dosage}) - ${m.frequency}`
        )
        .join('\n') || 'No medications tracked.';

    const insights = await getPersonalizedHealthInsights({
      symptoms: symptomsString,
      medications: medicationsString,
    });

    return { success: true, data: insights };
  } catch (error) {
    console.error('Error generating health insights:', error);
    return { success: false, error: 'Failed to generate insights.' };
  }
}
