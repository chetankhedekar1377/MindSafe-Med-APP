'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Meh, Frown, CheckCircle } from 'lucide-react';

const feedbackOptions = [
  { label: 'Better', icon: Smile, color: 'text-green-500' },
  { label: 'Same', icon: Meh, color: 'text-yellow-500' },
  { label: 'Worse', icon: Frown, color: 'text-red-500' },
];

export function Feedback() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (label: string) => {
    setSelected(label);
  };

  const containerVariants = {
    initial: { height: 'auto' },
    animate: { height: 'auto' },
    exit: { height: 0, opacity: 0 },
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
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling today?</CardTitle>
        <CardDescription>Your feedback helps track your progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="options"
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ staggerChildren: 0.1 }}
                className="grid grid-cols-3 gap-4"
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
                <p className="text-muted-foreground">Your check-in has been logged.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </CardContent>
    </Card>
  );
}
