'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, AlertTriangle, PartyPopper, Download, Info, Pill, Bot, ShieldAlert, HeartPulse, ShieldCheck } from 'lucide-react';
import useRipple from '@/hooks/use-ripple';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { getNextQuestion, generateTriageSummary } from './actions';
import type { TriageState } from "@/ai/flows/symptom-triage";
import type { TriageSummary } from '@/ai/flows/generate-triage-summary';
import { Skeleton } from '@/components/ui/skeleton';
import useLocalStorage from '@/hooks/use-local-storage';
import { useReinforcementLearning } from '@/hooks/useReinforcementLearning';

export default function TriagePage() {
  const [triageState, setTriageState] = useState<TriageState | null>(null);
  const [triageSummary, setTriageSummary] = useState<TriageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [primarySymptom, setPrimarySymptom] = useState('');
  const [ , setLastTriage] = useLocalStorage<TriageState | null>('lastTriage', null);

  const { baseProbabilities, likelihoods, INITIAL_BASE_PROBABILITIES, INITIAL_LIKELIHOODS } = useReinforcementLearning();
  
  const [refs, createRipple] = useRipple();
  const { toast } = useToast();

  useEffect(() => {
    if (triageState?.isCompleted && !triageState.redFlag && !triageSummary && !isLoadingSummary) {
      const fetchSummary = async () => {
        setIsLoadingSummary(true);
        const summary = await generateTriageSummary(triageState);
        setTriageSummary(summary);
        setIsLoadingSummary(false);
        setLastTriage(triageState); // Save completed triage state
      };
      fetchSummary();
    } else if (triageState?.isCompleted && triageState.redFlag) {
        setLastTriage(triageState); // Save completed triage state even if it's a red flag
    }
  }, [triageState, triageSummary, isLoadingSummary, setLastTriage]);

  const handlePrimarySymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primarySymptom) return;
    setIsLoading(true);
    setTriageSummary(null);
    const initialState: TriageState = {
      triageId: '', // Will be set by the flow
      primarySymptom,
      questionHistory: [],
      answers: [],
      isCompleted: false,
      redFlag: null,
      currentQuestion: null,
      conditionProbabilities: [],
      highestRiskLevel: null,
      completedAt: null,
      baseProbabilities,
      likelihoods,
    };
    
    if (JSON.stringify(baseProbabilities) === JSON.stringify(INITIAL_BASE_PROBABILITIES)) {
      delete initialState.baseProbabilities;
    }
    if (JSON.stringify(likelihoods) === JSON.stringify(INITIAL_LIKELIHOODS)) {
       delete initialState.likelihoods;
    }

    const nextState = await getNextQuestion(initialState);
    setTriageState(nextState);
    setIsLoading(false);
  };

  const handleAnswer = async (answer: 'Yes' | 'No') => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    if (!triageState) return;

    setIsLoading(true);
    const currentState = { ...triageState };
    currentState.answers.push(answer);
    if(currentState.currentQuestion){
        currentState.questionHistory.push(currentState.currentQuestion.text);
    }

    const nextState = await getNextQuestion(currentState);
    setTriageState(nextState);
    setIsLoading(false);
  };

  const handleRestart = () => {
    setTriageState(null);
    setPrimarySymptom('');
    setTriageSummary(null);
  };

  const handleExport = () => {
    if (!triageState) return;
    
    const exportData = {
        primarySymptom: triageState.primarySymptom,
        triageResults: triageState.questionHistory.map((q, i) => ({
            question: q,
            answer: triageState.answers[i] || "Not answered",
        })),
        finalOutcome: triageState.redFlag 
            ? `Red Flag: ${triageState.redFlag.reason}` 
            : triageSummary 
            ? `AI Summary: ${triageSummary.mostProbableCondition} (${triageSummary.confidenceLevel})`
            : "Triage complete, no red flags.",
        likelihoods: triageState.conditionProbabilities.map(p => ({ condition: p.condition, probability: `${(p.probability * 100).toFixed(0)}%` })),
        summaryDetails: triageSummary,
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-results-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
        title: "Results Exported",
        description: "Your triage results have been downloaded as a JSON file.",
    })
  }

  const cardVariants = {
    initial: { opacity: 0, x: 30, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -30, scale: 0.98 },
  };

  const progress = triageState ? (triageState.questionHistory.length / 5) * 100 : 0;
  const isCompleted = triageState?.isCompleted ?? false;
  const redFlagTriggered = triageState?.redFlag;
  
  const showSupportiveOptions = isCompleted && !redFlagTriggered && triageState?.highestRiskLevel === 'YELLOW';
  const showConsultDoctorWarning = isCompleted && !redFlagTriggered && triageState?.highestRiskLevel === 'RED';


  return (
    <div className="mx-auto max-w-2xl space-y-6">
       <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Health Triage</CardTitle>
           <div className="pt-4">
             <Progress value={progress} />
             <p className="text-sm text-muted-foreground pt-2">
                {triageState && !triageState.isCompleted ? `Step ${triageState.questionHistory.length + 1} of up to 5` : 'Start below'}
             </p>
           </div>
        </CardHeader>
        <AnimatePresence mode="wait">
          {!triageState && !isLoading ? (
             <motion.div key="primary-symptom" variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <CardContent className="text-center space-y-4">
                    <h2 className="text-2xl font-semibold">What is your primary symptom?</h2>
                    <p className="text-muted-foreground">Describe the main issue you're experiencing.</p>
                    <form onSubmit={handlePrimarySymptomSubmit} className="flex gap-2">
                        <Input 
                            value={primarySymptom} 
                            onChange={(e) => setPrimarySymptom(e.target.value)} 
                            placeholder="e.g., Headache, Fever, etc."
                            className="text-center"
                            aria-label="Primary symptom"
                        />
                        <Button type="submit" disabled={!primarySymptom}>Start Triage</Button>
                    </form>
                </CardContent>
             </motion.div>
          ) : isLoading ? (
             <CardContent key="loading">
                <div className="space-y-8 py-4">
                    <Skeleton className="h-20 w-full" />
                    <div className="flex justify-center gap-4">
                        <Skeleton className="h-16 w-32" />
                        <Skeleton className="h-16 w-32" />
                    </div>
                </div>
            </CardContent>
          ) : !isCompleted && triageState?.currentQuestion ? (
            <CardContent key="questions">
                <motion.div
                  key={triageState.currentQuestion.id}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="space-y-8"
                >
                  <p className="text-2xl font-semibold text-center h-20 flex items-center justify-center">
                    {triageState.currentQuestion.text}
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      ref={(el) => (refs.current['yes-btn'] = el)}
                      onClick={(e) => { createRipple(e, 'yes-btn'); handleAnswer('Yes'); }}
                      className="relative overflow-hidden w-32 h-16 text-lg"
                      size="lg"
                    >
                      Yes
                    </Button>
                    <Button
                      ref={(el) => (refs.current['no-btn'] = el)}
                      onClick={(e) => { createRipple(e, 'no-btn'); handleAnswer('No'); }}
                      className="relative overflow-hidden w-32 h-16 text-lg"
                      variant="secondary"
                      size="lg"
                    >
                      No
                    </Button>
                  </div>
                </motion.div>
            </CardContent>
          ) : (
              <motion.div
                key="completion"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {redFlagTriggered ? (
                  <>
                    <CardContent className="text-center space-y-4 bg-destructive/10 p-6">
                      <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                         <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
                      </motion.div>
                      <h2 className="text-3xl font-bold text-destructive">Urgent Action Recommended</h2>
                      <p className="text-destructive/90 max-w-md mx-auto">
                        Based on your answers, your symptoms may require immediate medical attention. This tool is not a substitute for professional medical advice.
                      </p>
                    </CardContent>
                    <CardFooter className="flex-col gap-4 p-6">
                        <Button size="lg" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Find Urgent Care
                        </Button>
                        <Button variant="outline" className="w-full" onClick={handleExport}>
                           <Download className="mr-2 h-4 w-4" />
                           Export Results
                        </Button>
                    </CardFooter>
                  </>
                ) : (
                  <div className="space-y-6">
                    <CardContent className="text-center space-y-4">
                      <div className="flex flex-col items-center gap-4 text-primary">
                        <ShieldCheck className="h-12 w-12" />
                        <h2 className="text-2xl font-bold">Triage Complete</h2>
                         <p className="text-muted-foreground max-w-md mx-auto">
                           The following is an educational summary based on your answers. It is not a medical diagnosis.
                         </p>
                      </div>
                    </CardContent>
                    
                    <div className="px-6 space-y-6">
                        {isLoadingSummary ? (
                          <Card>
                            <CardHeader>
                              <Skeleton className="h-6 w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-4/5" />
                            </CardContent>
                          </Card>
                        ) : triageSummary && (
                           <Card className="bg-secondary/30">
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      <Bot/>
                                      AI Triage Summary
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                  <div>
                                      <p className="text-sm text-muted-foreground">Most Probable Condition</p>
                                      <p className="text-lg font-semibold">{triageSummary.mostProbableCondition} ({triageSummary.confidenceLevel} Confidence)</p>
                                  </div>
                                  <div>
                                      <p className="text-sm text-muted-foreground">Reasoning</p>
                                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                          {triageSummary.reasoning.split('\n').map((item, index) => item && <li key={index}>{item.replace('-', '').trim()}</li>)}
                                      </ul>
                                  </div>
                                  <div>
                                      <p className="text-sm text-muted-foreground">Suggested Next Steps</p>
                                      <p className="text-sm">{triageSummary.nextSteps}</p>
                                  </div>
                              </CardContent>
                          </Card>
                        )}
                        
                        {showConsultDoctorWarning && (
                          <Card className="border-destructive/50 bg-destructive/10">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive">
                                  <ShieldAlert />
                                  Consult a Healthcare Provider
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-destructive/90">
                                  Based on this educational analysis, your symptoms may indicate a condition that requires professional evaluation. Supportive over-the-counter options may not be appropriate. It is strongly recommended to consult a healthcare provider for an accurate diagnosis and treatment plan.
                                </p>
                              </CardContent>
                          </Card>
                        )}

                        {showSupportiveOptions && (
                          <Card className="border-primary/20">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-primary"><HeartPulse /> Supportive Care Options</CardTitle>
                               <CardDescription>
                                 For general discomfort from mild conditions, some over-the-counter options may be considered. This is for informational purposes and is not medical advice.
                               </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-4">
                              <SupportiveOption
                                name="Pain & Fever Relief"
                                description="Paracetamol may help manage symptoms like aches and fever."
                                tooltipText="Always follow the instructions on the label. This is not medical advice or a prescription."
                              />
                               <SupportiveOption
                                name="Acidity Relief"
                                description="Antacids may help with discomfort from acidity."
                                tooltipText="Always follow the instructions on the label. This is not a substitute for medical advice."
                              />
                               <SupportiveOption
                                name="Hydration Support"
                                description="An Oral Rehydration Solution (ORS) can help restore fluids and electrolytes."
                                tooltipText="Proper hydration is key to recovery. Follow product instructions carefully."
                              />
                               <SupportiveOption
                                name="Allergy Relief"
                                description="A non-sedating antihistamine may help with allergy symptoms."
                                tooltipText="Ensure the product is non-sedating. Always follow the instructions on the label."
                              />
                            </CardContent>
                          </Card>
                        )}
                    </div>

                    <CardFooter className="flex-col gap-4 pt-6 px-6">
                       <Button className="w-full" onClick={handleRestart}>
                          Start New Triage
                       </Button>
                      <Button variant="outline" className="w-full" onClick={handleExport}>
                         <Download className="mr-2 h-4 w-4" />
                         Export Results
                      </Button>
                    </CardFooter>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      {triageState && !isCompleted && <div className="flex justify-start">
        <Button
          onClick={handleRestart}
          disabled={!!triageState?.redFlag}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Start
        </Button>
      </div>}
    </div>
  );
}

const SupportiveOption = ({ name, description, tooltipText }: { name: string, description: string, tooltipText: string }) => (
    <div className="flex items-start justify-between rounded-lg border bg-background p-4">
      <div className="flex items-start gap-4">
        <Pill className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <TooltipProvider>
      <Tooltip>
          <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Info className="h-5 w-5 text-muted-foreground" />
              </Button>
          </TooltipTrigger>
          <TooltipContent>
              <p className="max-w-xs">{tooltipText}</p>
          </TooltipContent>
      </Tooltip>
      </TooltipProvider>
  </div>
);
