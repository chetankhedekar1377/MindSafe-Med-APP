'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, AlertTriangle, PartyPopper, Download, BarChart } from 'lucide-react';
import useRipple from '@/hooks/use-ripple';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const triageQuestions = [
  { id: 1, text: 'Are you experiencing severe difficulty breathing?', redFlag: true },
  { id: 2, text: 'Have you experienced any chest pain or pressure in the last 24 hours?', redFlag: true },
  { id: 3, text: 'Do you have a fever over 101°F (38.3°C)?', redFlag: false },
  { id: 4, text: 'Have you had a persistent cough for more than a week?', redFlag: false },
  { id: 5, text: 'Are you feeling unusually fatigued or weak?', redFlag: false },
  { id: 6, text: 'Have you lost your sense of taste or smell?', redFlag: false },
];

const likelihoodData = [
  { label: 'Viral Infection', value: 75, gradient: 'progress-gradient-1' },
  { label: 'Allergies', value: 45, gradient: 'progress-gradient-2' },
  { label: 'Stress-related Symptoms', value: 20, gradient: 'progress-gradient-3' },
].sort((a, b) => b.value - a.value);

type Answer = 'Yes' | 'No' | null;

export default function TriagePage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(Array(triageQuestions.length).fill(null));
  const [backtrackingDisabled, setBacktrackingDisabled] = useState(false);
  const [refs, createRipple] = useRipple();
  const { toast } = useToast();

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);

    const currentQuestion = triageQuestions[currentQuestionIndex];
    if (answer === 'Yes' && currentQuestion.redFlag) {
      setBacktrackingDisabled(true);
    }

    if (currentQuestionIndex < triageQuestions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0 && !backtrackingDisabled) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleExport = () => {
    const results = triageQuestions.map((q, i) => ({
        question: q.text,
        answer: answers[i] || "Not answered",
    }));
    
    const blob = new Blob([JSON.stringify({ triageResults: results }, null, 2)], { type: 'application/json' });
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

  const progress = (currentQuestionIndex / triageQuestions.length) * 100;
  const isCompleted = currentQuestionIndex === triageQuestions.length;

  const redFlagTriggered = answers.some(
    (ans, i) => ans === 'Yes' && triageQuestions[i].redFlag
  );

  const cardVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
       <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Health Triage</CardTitle>
           <div className="pt-4">
             <Progress value={progress} />
             <p className="text-sm text-muted-foreground pt-2">
                Step {Math.min(currentQuestionIndex + 1, triageQuestions.length)} of {triageQuestions.length}
             </p>
           </div>
        </CardHeader>
        <AnimatePresence mode="wait">
          {!isCompleted ? (
            <CardContent key="questions">
                <motion.div
                  key={currentQuestionIndex}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <p className="text-2xl font-semibold text-center h-20 flex items-center justify-center">
                    {triageQuestions[currentQuestionIndex].text}
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
                className="space-y-6"
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
                        Based on your answers, your symptoms may require immediate medical attention. Please consult a healthcare professional without delay.
                      </p>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
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
                  <>
                    <CardContent className="text-center space-y-4">
                      <div className="flex flex-col items-center gap-4 text-primary">
                        <PartyPopper className="h-12 w-12" />
                        <h2 className="text-2xl font-bold">Triage Complete</h2>
                        <p>
                          Thank you for completing the triage. Your symptoms do not indicate an immediate emergency, but please continue to monitor your health and consult a doctor if you have concerns.
                        </p>
                      </div>
                    </CardContent>
                    
                    <div className="px-6">
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
                    </div>

                    <CardFooter className="flex-col gap-4 pt-6">
                      <Button variant="outline" className="w-full" onClick={handleExport}>
                         <Download className="mr-2 h-4 w-4" />
                         Export Results
                      </Button>
                    </CardFooter>
                  </>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      {!isCompleted && <div className="flex justify-start">
        <Button
          onClick={handleBack}
          disabled={currentQuestionIndex === 0 || backtrackingDisabled}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>}
       {backtrackingDisabled && !isCompleted && (
        <p className="text-sm text-center text-destructive">
          <AlertTriangle className="inline h-4 w-4 mr-1" />
          Due to a critical answer, you cannot go back.
        </p>
      )}
    </div>
  );
}
