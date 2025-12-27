'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, AlertTriangle, PartyPopper, Download, Info, Pill, Bot, ShieldAlert } from 'lucide-react';
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
import { TriageState, TriageStateSchema } from "@/ai/flows/symptom-triage";
import type { TriageSummary } from '@/ai/flows/generate-triage-summary';
import { Skeleton } from '@/components/ui/skeleton';

export default function TriagePage() {
  const [triageState, setTriageState] = useState<TriageState | null>(null);
  const [triageSummary, setTriageSummary] = useState<TriageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primarySymptom, setPrimarySymptom] = useState('');
  
  const [refs, createRipple] = useRipple();
  const { toast } = useToast();

  useEffect(() => {
    if (triageState?.isCompleted && !triageState.redFlag && !triageSummary && !isLoadingSummary) {
      const fetchSummary = async () => {
        setIsLoadingSummary(true);
        const summary = await generateTriageSummary(triageState);
        setTriageSummary(summary);
        setIsLoadingSummary(false);
      };
      fetchSummary();
    }
  }, [triageState, triageSummary, isLoadingSummary]);

  const handlePrimarySymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primarySymptom) return;
    setIsLoading(true);
    setError(null);
    setTriageSummary(null);
    const initialState: TriageState = {
      primarySymptom,
      questionHistory: [],
      answers: [],
      isCompleted: false,
      redFlag: null,
      currentQuestion: null,
      conditionProbabilities: [],
      highestRiskLevel: null,
    };
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

  const handleBack = () => {
    if (triageState && !triageState.redFlag) {
       setTriageState(null);
       setPrimarySymptom('');
       setTriageSummary(null);
    }
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
    a.download = 'triage-results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
        title: "Results Exported",
        description: "Your triage results have been downloaded.",
    })
  }

  const cardVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  const progress = triageState ? (triageState.questionHistory.length / 5) * 100 : 0;
  const isCompleted = triageState?.isCompleted ?? false;
  const redFlagTriggered = triageState?.redFlag;
  
  const showSupportiveOptions = isCompleted && !redFlagTriggered && triageState?.highestRiskLevel === 'YELLOW';
  const showConsultDoctorWarning = isCompleted && !redFlagTriggered && triageState?.highestRiskLevel === 'RED';


  return (
    <div className="mx-auto max-w-2xl space-y-8">
       <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Health Triage</CardTitle>
           <div className="pt-4">
             <Progress value={progress} />
             <p className="text-sm text-muted-foreground pt-2">
                {triageState && !triageState.isCompleted ? `Step ${triageState.questionHistory.length + 1} of 5` : 'Step 1 of 5'}
             </p>
           </div>
        </CardHeader>
        <AnimatePresence mode="wait">
          {!triageState && !isLoading ? (
             <motion.div key="primary-symptom" variants={cardVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                <CardContent className="text-center space-y-4">
                    <h2 className="text-2xl font-semibold">What is your primary symptom?</h2>
                    <p className="text-muted-foreground">Describe the main issue you are experiencing, e.g., "headache", "sore throat".</p>
                    <form onSubmit={handlePrimarySymptomSubmit} className="flex gap-2">
                        <Input 
                            value={primarySymptom} 
                            onChange={(e) => setPrimarySymptom(e.target.value)} 
                            placeholder="e.g., Headache"
                            className="text-center"
                        />
                        <Button type="submit" disabled={!primarySymptom}>Start</Button>
                    </form>
                </CardContent>
             </motion.div>
          ) : isLoading ? (
             <CardContent key="loading">
                <div className="space-y-8">
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
                  transition={{ duration: 0.3 }}
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
                        Based on your answers, your symptoms may require immediate medical attention. {triageState.redFlag?.reason} This is not a diagnosis. Please consult a healthcare provider for any health concerns.
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
                        <PartyPopper className="h-12 w-12" />
                        <h2 className="text-2xl font-bold">Triage Complete</h2>
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
                                  <CardDescription>
                                      This is an educational summary, not a medical diagnosis.
                                  </CardDescription>
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
                                  Based on the analysis, your symptoms may indicate a condition that requires a professional medical evaluation, such as a bacterial infection. Over-the-counter options may not be appropriate. It is strongly recommended to consult a healthcare provider for an accurate diagnosis and treatment plan.
                                </p>
                              </CardContent>
                          </Card>
                        )}

                        {showSupportiveOptions && (
                          <Card className="border-accent">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">Supportive Options</CardTitle>
                               <CardDescription>
                                 For general discomfort, some over-the-counter options may be considered. This is not medical advice.
                               </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                                 <div className="flex items-center gap-4">
                                   <Pill className="h-6 w-6 text-primary" />
                                   <div>
                                     <p className="font-semibold">Paracetamol</p>
                                     <p className="text-sm text-muted-foreground">May help with pain and fever relief.</p>
                                   </div>
                                 </div>
                                 <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                              <Info className="h-5 w-5 text-muted-foreground" />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p className="max-w-xs">Always follow the instructions on the label. This information is not a substitute for medical advice.</p>
                                      </TooltipContent>
                                  </Tooltip>
                                 </TooltipProvider>
                              </div>
                               <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                                 <div className="flex items-center gap-4">
                                   <Pill className="h-6 w-6 text-primary" />
                                   <div>
                                     <p className="font-semibold">Antacid</p>
                                     <p className="text-sm text-muted-foreground">May help with relief from acidity.</p>
                                   </div>
                                 </div>
                                 <TooltipProvider>
                                  <Tooltip>
                                      <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                              <Info className="h-5 w-5 text-muted-foreground" />
                                          </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                          <p className="max-w-xs">Always follow the instructions on the label. This information is not a substitute for medical advice.</p>
                                      </TooltipContent>
                                  </Tooltip>
                                 </TooltipProvider>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                    </div>

                    <CardFooter className="flex-col gap-4 pt-6 px-6">
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
          onClick={handleBack}
          disabled={!!triageState?.redFlag}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>}
       {triageState?.redFlag && !isCompleted && (
        <p className="text-sm text-center text-destructive">
          <AlertTriangle className="inline h-4 w-4 mr-1" />
          Due to a critical answer, you cannot go back.
        </p>
      )}
    </div>
  );
}
