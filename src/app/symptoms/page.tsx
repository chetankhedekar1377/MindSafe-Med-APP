'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PlusCircle,
  Search,
  Frown as HeadacheIcon,
  Thermometer,
  Wind,
  CircleAlert as NauseaIcon,
  Heart,
  Smile,
  CheckCircle,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Symptom } from '@/lib/types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { MotionCard } from '@/components/PageTransition';

const symptomSchema = z.object({
  name: z.string().min(1, 'Symptom name is required.'),
  date: z.string().min(1, 'Date is required.'),
  severity: z.number().min(0).max(10),
});

const commonSymptoms = [
  { name: 'Headache', icon: HeadacheIcon },
  { name: 'Fever', icon: Thermometer },
  { name: 'Cough', icon: Wind },
  { name: 'Nausea', icon: NauseaIcon },
  { name: 'Fatigue', icon: Heart }, // Using Heart as a proxy for energy/fatigue
  { name: 'Dizziness', icon: Smile }, // Using Smile as a proxy for feeling woozy
];

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useLocalStorage<Symptom[]>('symptoms', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof symptomSchema>>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      severity: 5,
    },
  });

  function onSubmit(values: z.infer<typeof symptomSchema>) {
    const newSymptom: Symptom = {
      id: new Date().toISOString(),
      ...values,
    };
    setSymptoms([...symptoms, newSymptom]);
    form.reset({
      name: '',
      date: new Date().toISOString().split('T')[0],
      severity: 5,
    });
    setShowConfirmation(true);
  }

  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => setShowConfirmation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation]);


  const filteredSymptoms = useMemo(() => {
    return commonSymptoms.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSymptomSelect = (name: string) => {
    form.setValue('name', name);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };
  
  const confirmationVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } },
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            variants={confirmationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6" />
                <p className="font-semibold">Symptom Logged</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle>Select a Symptom</CardTitle>
          <CardDescription>
            Choose a common symptom or search to log it quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for a symptom..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredSymptoms.map((symptom, index) => (
              <MotionCard
                key={symptom.name}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                whileTap="tap"
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="cursor-pointer"
                onClick={() => handleSymptomSelect(symptom.name)}
              >
                <CardContent className="flex flex-col items-center justify-center p-4 aspect-square">
                  <symptom.icon className="h-8 w-8 mb-2 text-primary" />
                  <p className="text-sm font-medium text-center">{symptom.name}</p>
                </CardContent>
              </MotionCard>
            ))}
          </div>
        </CardContent>
      </Card>

      <div ref={formRef} />

      <Card>
        <CardHeader>
          <CardTitle>Log a New or Custom Symptom</CardTitle>
          <CardDescription>
            Record how you're feeling. Consistent tracking helps reveal patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symptom</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Headache" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Controller
                  control={form.control}
                  name="severity"
                  render={({ field: { value, onChange } }) => (
                    <FormItem>
                      <FormLabel>Severity: {value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        0 (mild) to 10 (severe)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                Log Symptom
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Symptom History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symptom</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {symptoms.length > 0 ? (
                [...symptoms]
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map((symptom) => (
                    <TableRow key={symptom.id}>
                      <TableCell className="font-medium">
                        {symptom.name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(symptom.date), 'MMMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {symptom.severity}/10
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No symptoms logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
