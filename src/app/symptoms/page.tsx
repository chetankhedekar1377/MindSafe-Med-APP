'use client';

import React, { useState } from 'react';
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
import { PlusCircle } from 'lucide-react';
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

const symptomSchema = z.object({
  name: z.string().min(1, 'Symptom name is required.'),
  date: z.string().min(1, 'Date is required.'),
  severity: z.number().min(0).max(10),
});

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useLocalStorage<Symptom[]>('symptoms', []);

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
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Log a New Symptom</CardTitle>
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
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((symptom) => (
                    <TableRow key={symptom.id}>
                      <TableCell className="font-medium">{symptom.name}</TableCell>
                      <TableCell>
                        {format(new Date(symptom.date), 'MMMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">{symptom.severity}/10</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
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
