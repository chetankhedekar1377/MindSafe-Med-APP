'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, PlusCircle, Clock } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Appointment } from '@/lib/types';
import { format, isPast, parseISO } from 'date-fns';

const appointmentSchema = z.object({
  provider: z.string().min(1, 'Provider name is required.'),
  dateTime: z.string().min(1, 'Date and time are required.'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>(
    'appointments',
    []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      provider: '',
      dateTime: '',
      location: '',
      notes: '',
    },
  });

  function onSubmit(values: z.infer<typeof appointmentSchema>) {
    const newAppointment: Appointment = {
      id: new Date().toISOString(),
      ...values,
    };
    setAppointments([...appointments, newAppointment]);
    form.reset();
    setIsDialogOpen(false);
  }

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const sorted = [...appointments].sort(
      (a, b) => parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime()
    );
    return {
      upcomingAppointments: sorted.filter((a) => !isPast(parseISO(a.dateTime))),
      pastAppointments: sorted.filter((a) => isPast(parseISO(a.dateTime))).reverse(),
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription>
              Add a new doctor's appointment to your schedule.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Healthcare Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dr. Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date and Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., City Clinic, 123 Health St." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Discuss recent headaches"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Appointment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <AppointmentList appointments={upcomingAppointments} title="Upcoming Appointments" />
        </TabsContent>
        <TabsContent value="past">
          <AppointmentList appointments={pastAppointments} title="Past Appointments" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppointmentList({ appointments, title }: { appointments: Appointment[], title: string }) {
  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No appointments here. Click "Schedule Appointment" to add one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="transition-all hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle>{appointment.provider}</CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-2">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(parseISO(appointment.dateTime), 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(parseISO(appointment.dateTime), 'h:mm a')}
              </span>
            </CardDescription>
          </CardHeader>
          {(appointment.location || appointment.notes) && (
            <CardContent className="space-y-2">
              {appointment.location && <p className="text-sm"><strong className="font-medium">Location:</strong> {appointment.location}</p>}
              {appointment.notes && <p className="text-sm"><strong className="font-medium">Notes:</strong> {appointment.notes}</p>}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
