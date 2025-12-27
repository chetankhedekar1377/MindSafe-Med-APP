'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Meh, Frown, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { TriageState } from '@/ai/flows/symptom-triage';
import { useReinforcementLearning, Feedback } from '@/hooks/useReinforcementLearning';
import { Button } from './ui/button';

const feedbackOptions = [
  { label: 'Better', icon: Smile, color: 'text-green-500' },
  { label: 'Same', icon: Meh, color: 'text-yellow-500' },
  { label: 'Worse', icon: Frown, color: 'text-red-500' },
  { label: 'Side Effects', icon: AlertCircle, color: 'text-purple-500' },
];

export function TriageFeedback() {
  const [lastTriage, setLastTriage] = useLocalStorage<TriageState | null>('lastTriage', null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selected, setSelected] = useState<Feedback | null>(null);
  
  const { updateWeights } = useReinforcementLearning();

  useEffect(() => {
    if (lastTriage && lastTriage.completedAt) {
      const now = Date.now();
      const timeSinceCompletion = now - lastTriage.completedAt;
      const hoursSinceCompletion = timeSinceCompletion / (1000 * 60 * 60);
      
      // Show feedback card between 24 and 72 hours after triage completion
      if (hoursSinceCompletion >= 24 && hoursSinceCompletion <= 72) {
        setShowFeedback(true);
      } else {
        setShowFeedback(false);
      }
    }
  }, [lastTriage]);

  const handleSelect = (label: Feedback) => {
    setSelected(label);

    if (lastTriage) {
      const sortedConditions = [...lastTriage.conditionProbabilities].sort((a, b) => b.probability - a.probability);
      const mostLikelyCondition = sortedConditions[0]?.condition;

      if (mostLikelyCondition) {
        // This is where the "learning" happens.
        updateWeights(mostLikelyCondition, label);
      }
    }
    
    // If the user feels worse or had side effects, don't hide the card immediately.
    // Otherwise, hide it after the thank you message.
    if (label !== 'Worse' && label !== 'Side Effects') {
      setTimeout(() => {
          setLastTriage(null);
          setShowFeedback(false);
      }, 3000);
    }
  };
  
  const handleClose = () => {
    setLastTriage(null);
    setShowFeedback(false);
  }

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

  const renderContent = () => {
    if (!selected) {
      return (
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
              onClick={() => handleSelect(option.label as Feedback)}
            >
              <Card className="cursor-pointer text-center hover:bg-accent transition-colors h-full">
                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center gap-2">
                  <option.icon className={`h-8 w-8 sm:h-10 sm:w-10 ${option.color}`} />
                  <span className="text-sm font-medium">{option.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      );
    }

    if (selected === 'Worse' || selected === 'Side Effects') {
      return (
        <motion.div
          key="escalation"
          variants={thankYouVariants}
          initial="initial"
          animate="animate"
          className="text-center"
        >
          <Card className="border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-destructive">
                <ShieldAlert />
                Important: Please Seek Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive/90">
                Thank you for your feedback. Since you are feeling worse or experiencing side effects, it is strongly recommended that you consult a healthcare provider for a professional evaluation.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleClose}>Okay, I Understand</Button>
            </CardFooter>
          </Card>
        </motion.div>
      );
    }
    
    return (
       <motion.div
        key="thank-you"
        variants={thankYouVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col items-center justify-center space-y-4 text-center h-36"
        >
        <CheckCircle className="h-12 w-12 text-primary" />
        <h3 className="text-xl font-semibold">Thank you for your feedback!</h3>
        <p className="text-muted-foreground">Your response helps us improve.</p>
      </motion.div>
    );
  };


  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={containerVariants}>
        <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
            <CardTitle>How are you feeling now?</CardTitle>
            <CardDescription>Your feedback helps us improve our recommendations. This is related to your recent triage for "{lastTriage?.primarySymptom}".</CardDescription>
        </CardHeader>
        <CardContent>
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
        </CardContent>
        </Card>
    </motion.div>
  );
}
