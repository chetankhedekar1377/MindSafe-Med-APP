'use server';

import { TriageState, TriageStateSchema, symptomTriageFlow } from "@/ai/flows/symptom-triage";
import { generateTriageSummary as generateTriageSummaryFlow, TriageSummary, TriageSummarySchema } from "@/ai/flows/generate-triage-summary";
import { z } from "zod";


export async function getNextQuestion(currentState: TriageState): Promise<TriageState> {
  try {
    // Validate input against the Zod schema
    const validatedState = TriageStateSchema.parse(currentState);
    
    // Call the Genkit flow
    const nextState = await symptomTriageFlow(validatedState);
    
    // Validate output
    return TriageStateSchema.parse(nextState);

  } catch (error) {
    console.error("Error in triage action:", error);
    if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
    }
    // Return a default error state or re-throw
    const errorState: TriageState = {
        ...currentState,
        isCompleted: true,
        redFlag: { reason: "An unexpected system error occurred." },
        currentQuestion: null,
    };
    return errorState;
  }
}

export async function generateTriageSummary(finalState: TriageState): Promise<TriageSummary> {
  try {
    const validatedState = TriageStateSchema.parse(finalState);
    const summary = await generateTriageSummaryFlow(validatedState);
    return TriageSummarySchema.parse(summary);
  } catch (error) {
    console.error("Error in summary generation action:", error);
    if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
    }
    return {
        mostProbableCondition: "Unavailable",
        confidenceLevel: "Low",
        reasoning: "Could not generate summary due to an unexpected error.",
        nextSteps: "Please consult a healthcare provider for any health concerns."
    }
  }
}
