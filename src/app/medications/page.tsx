'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Pill, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Medication } from '@/lib/types';
import { cn } from '@/lib/utils';


const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required.'),
  dosage: z.string().min(1, 'Dosage is required.'),
  frequency: z.string().min(1, 'Frequency is required.'),
  time: z.string().min(1, 'Time is required.')
});

export default function MedicationsPage() {
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof medicationSchema>>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      dosage: '',
      frequency: 'Daily',
      time: '',
    },
  });

  function onSubmit(values: z.infer<typeof medicationSchema>) {
    const newMedication: Medication = {
      id: new Date().toISOString(),
      ...values,
      takenToday: false,
    };
    setMedications([...medications, newMedication]);
    form.reset();
    setIsDialogOpen(false);
  }

  const toggleTaken = (id: string) => {
    setMedications(
      medications.map((med) =>
        med.id === id ? { ...med, takenToday: !med.takenToday } : med
      )
    );
  };
  
  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
            <DialogDescription>
              Enter the details of your medication.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Paracetamol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 500mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Daily" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                 <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Medication</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {medications.length === 0 ? (
        <Card>
            <CardHeader>
                <CardTitle>Your Medication Log</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">You haven't added any medications yet. Click "Add Medication" to start.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {medications.map((med) => (
            <Card key={med.id} className={cn("transition-all flex flex-col", med.takenToday && "bg-accent/50")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill /> {med.name}
                </CardTitle>
                <CardDescription>{med.dosage}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{med.frequency} at {med.time}</span>
              </CardContent>
              <CardFooter>
                 <div className="flex items-center space-x-2">
                    <Switch
                        id={`taken-${med.id}`}
                        checked={med.takenToday}
                        onCheckedChange={() => toggleTaken(med.id)}
                        aria-label={`Mark ${med.name} as taken`}
                    />
                    <Label htmlFor={`taken-${med.id}`} className="cursor-pointer text-sm">
                        {med.takenToday ? 'Taken Today' : 'Mark as Taken'}
                    </Label>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
