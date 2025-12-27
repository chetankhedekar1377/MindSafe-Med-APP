'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Meh, Frown, AlertCircle, CheckCircle } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { TriageState } from '@/ai/flows/symptom-triage';

const feedbackOptions = [
  { label: 'Better', icon: Smile, color: 'text-green-500' },
  { label: 'Same', icon: Meh, color: 'text-yellow-500' },
  { label: 'Worse', icon: Frown, color: 'text-red-500' },
  { label: 'Side Effects', icon: AlertCircle, color: 'text-purple-500' },
];

export function TriageFeedback() {
  const [lastTriage, setLastTriage] = useLocalStorage<TriageState | null>('lastTriage', null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (lastTriage && lastTriage.completedAt) {
      const now = Date.now();
      const timeSinceCompletion = now - lastTriage.completedAt;
      const hoursSinceCompletion = timeSinceCompletion / (1000 * 60 * 60);
      
      // Show feedback card between 24 and 72 hours after triage
      if (hoursSinceCompletion >= 24 && hoursSinceCompletion <= 72) {
        setShowFeedback(true);
      } else {
        setShowFeedback(false);
      }
    }
  }, [lastTriage]);

  const handleSelect = (label: string) => {
    setSelected(label);
    
    // In a real application, you would send this feedback to your backend
    // to feed into a reinforcement learning model.
    console.log({
      triageId: lastTriage?.triageId,
      primarySymptom: lastTriage?.primarySymptom,
      outcome: label
    });

    // After a short delay, remove the triage data to hide the card
    setTimeout(() => {
        setLastTriage(null);
        setShowFeedback(false);
    }, 2000);
  };
  
  if (!showFeedback) {
      return null;
  }

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const optionVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    exit: { scale: 0.9, opacity: 0, transition: { duration: 0.2 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  const thankYouVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { delay: 0.3, type: 'spring' } },
  };

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={containerVariants}>
        <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
            <CardTitle>How are you feeling now?</CardTitle>
            <CardDescription>Your feedback helps us improve our recommendations. This is related to your triage for "{lastTriage?.primarySymptom}".</CardDescription>
        </CardHeader>
        <CardContent>
            <AnimatePresence mode="wait">
            {!selected ? (
                <motion.div
                key="options"
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ staggerChildren: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                {feedbackOptions.map((option) => (
                    <motion.div
                    key={option.label}
                    variants={optionVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => handleSelect(option.label)}
                    >
                    <Card className="cursor-pointer text-center hover:bg-accent transition-colors">
                        <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-2">
                        <option.icon className={`h-8 w-8 sm:h-10 sm:w-10 ${option.color}`} />
                        <span className="text-sm font-medium">{option.label}</span>
                        </CardContent>
                    </Card>
                    </motion.div>
                ))}
                </motion.div>
            ) : (
                <motion.div
                key="thank-you"
                variants={thankYouVariants}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center justify-center space-y-4 text-center h-36"
                >
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-semibold">Thank you for your feedback!</h3>
                <p className="text-muted-foreground">Your response has been recorded.</p>
                </motion.div>
            )}
            </AnimatePresence>
        </CardContent>
        </Card>
    </motion.div>
  );
}
