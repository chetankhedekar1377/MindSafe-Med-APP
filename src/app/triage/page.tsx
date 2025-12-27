'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, AlertTriangle, PartyPopper, Download, BarChart, Info, Pill, Search } from 'lucide-react';
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
import { getNextQuestion } from './actions';
import type { TriageState } from '@/ai/flows/symptom-triage';
import { Skeleton } from '@/components/ui/skeleton';

const likelihoodData = [
  { label: 'Viral Infection', value: 75, gradient: 'progress-gradient-1' },
  { label: 'Allergies', value: 45, gradient: 'progress-gradient-2' },
  { label: 'Stress-related Symptoms', value: 20, gradient: 'progress-gradient-3' },
].sort((a, b) => b.value - a.value);

export default function TriagePage() {
  const [triageState, setTriageState] = useState<TriageState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primarySymptom, setPrimarySymptom] = useState('');
  
  const [refs, createRipple] = useRipple();
  const { toast } = useToast();

  const handlePrimarySymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primarySymptom) return;
    setIsLoading(true);
    setError(null);
    const initialState: TriageState = {
      primarySymptom,
      questionHistory: [],
      answers: [],
      isCompleted: false,
      redFlag: null,
      currentQuestion: null,
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
    // This functionality would need more complex state management to rollback the triage state.
    // For now, we'll reset to the beginning if they want to go back.
    if (triageState && !triageState.redFlag) {
       setTriageState(null);
       setPrimarySymptom('');
    }
  };

  const handleExport = () => {
    if (!triageState) return;
    
    const results = triageState.questionHistory.map((q, i) => ({
        question: q,
        answer: triageState.answers[i] || "Not answered",
    }));

    const exportData = {
        primarySymptom: triageState.primarySymptom,
        triageResults: results,
        finalOutcome: triageState.redFlag ? `Red Flag: ${triageState.redFlag.reason}` : "Triage complete, no red flags."
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

  return (
    <div className="mx-auto max-w-2xl space-y-8">
       <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Health Triage</CardTitle>
           <div className="pt-4">
             <Progress value={progress} />
             <p className="text-sm text-muted-foreground pt-2">
                {triageState ? `Step ${triageState.questionHistory.length + 1} of 5` : 'Step 1 of 5'}
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
                      <h2 className="text-3xl font-bold text-destructive">Urgent Action Required</h2>
                      <p className="text-destructive/90 max-w-md mx-auto">
                        Based on your answers, your symptoms may require immediate medical attention. {triageState.redFlag?.reason}
                      </p>
                    </CardContent>
                    <CardFooter className="flex-col gap-4 p-6">
                        <Button size="lg" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Consult a Doctor Now
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
                        <p>
                          Thank you for completing the triage. Your symptoms do not indicate an immediate emergency. See below for a likelihood estimate.
                        </p>
                      </div>
                    </CardContent>
                    
                    <div className="px-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart/>
                                    Likelihood Estimate
                                </CardTitle>
                                <CardDescription>
                                    This is not a diagnosis. These are statistical likelihoods based on your answers.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {likelihoodData.map((item) => (
                                    <div key={item.label}>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-medium">{item.label}</span>
                                            <span className="text-lg font-bold text-primary">{item.value}%</span>
                                        </div>
                                        <Progress value={item.value} className={cn("h-3", item.gradient)} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        
                        <Card className="border-accent">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">Supportive Options</CardTitle>
                             <CardDescription>
                               The following over-the-counter options may help with general discomfort. This is not medical advice.
                             </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                               <div className="flex items-center gap-4">
                                 <Pill className="h-6 w-6 text-primary" />
                                 <div>
                                   <p className="font-semibold">Ibuprofen</p>
                                   <p className="text-sm text-muted-foreground">For pain and fever relief.</p>
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
                                        <p className="max-w-xs">Always read the label and consult a pharmacist or doctor before taking any new medication.</p>
                                    </TooltipContent>
                                </Tooltip>
                               </TooltipProvider>
                            </div>
                          </CardContent>
                        </Card>
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
