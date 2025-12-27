'use server';

import { TriageState, TriageStateSchema, symptomTriageFlow } from "@/ai/flows/symptom-triage";
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
