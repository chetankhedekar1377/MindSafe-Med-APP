'use server';

import { symptomTriageFlow, type TriageState } from "@/ai/flows/symptom-triage";
import { generateTriageSummary as generateTriageSummaryFlow, type TriageSummary } from "@/ai/flows/generate-triage-summary";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { TriageStateSchema, TriageSummarySchema } from "@/lib/schemas";
import { initializeFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

async function saveTriageSession(sessionData: TriageState) {
    if (!sessionData.triageId) {
        console.error("Cannot save session without a triageId.");
        return;
    }
    const { firestore } = initializeFirebase();
    const sessionRef = doc(firestore, 'triageSessions', sessionData.triageId);

    // Create a version of the state without the RL-specific fields for saving.
    const { baseProbabilities, likelihoods, ...stateToSave } = sessionData;

    setDocumentNonBlocking(sessionRef, stateToSave, { merge: true });
}

export async function getNextQuestion(currentState: TriageState): Promise<TriageState> {
  try {
    // Ensure a unique ID is set for new triages
    if (!currentState.triageId) {
      currentState.triageId = uuidv4();
    }
    
    // Validate input against the Zod schema
    const validatedState = TriageStateSchema.parse(currentState);
    
    // Call the Genkit flow
    const nextState = await symptomTriageFlow(validatedState);
    
    // If the triage is completed, save it to Firestore
    if (nextState.isCompleted) {
        await saveTriageSession(nextState);
    }
    
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
        highestRiskLevel: 'RED',
        completedAt: Date.now(),
    };
    await saveTriageSession(errorState); // Save error state as well
    return errorState;
  }
}

export async function generateTriageSummary(finalState: TriageState): Promise<TriageSummary> {
  try {
    const validatedState = TriageStateSchema.parse(finalState);
    const summary = await generateTriageSummaryFlow(validatedState);
    
    // Save the summary to the existing Firestore document
    if (finalState.triageId) {
        const { firestore } = initializeFirebase();
        const sessionRef = doc(firestore, 'triageSessions', finalState.triageId);
        updateDocumentNonBlocking(sessionRef, { finalVerdict: summary });
    }

    return TriageSummarySchema.parse(summary);
  } catch (error) {
    console.error("Error in summary generation action:", error);
    if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
    }
    const errorSummary = {
        mostProbableCondition: "Unavailable",
        confidenceLevel: "Low",
        reasoning: "Could not generate summary due to an unexpected error.",
        nextSteps: "Please consult a healthcare provider for any health concerns."
    };

    // Attempt to save the error summary
    if (finalState.triageId) {
        const { firestore } = initializeFirebase();
        const sessionRef = doc(firestore, 'triageSessions', finalState.triageId);
        updateDocumentNonBlocking(sessionRef, { finalVerdict: errorSummary });
    }

    return errorSummary;
  }
}

export async function saveFeedbackAction(triageId: string, feedback: 'Better' | 'Same' | 'Worse' | 'Side Effects') {
    if (!triageId) return;
    const { firestore } = initializeFirebase();
    const sessionRef = doc(firestore, 'triageSessions', triageId);

    const feedbackData = {
        feedback: {
            outcome: feedback,
            feedbackAt: Date.now(),
        }
    };
    updateDocumentNonBlocking(sessionRef, feedbackData);
}
