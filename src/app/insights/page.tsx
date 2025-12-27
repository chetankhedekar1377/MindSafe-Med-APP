'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';
import type { HealthInsightsOutput } from '@/ai/flows/personalized-health-insights';
import { generateInsightsAction } from './actions';
import type { Appointment, Medication, Symptom } from '@/lib/types';

export default function InsightsPage() {
  const [insights, setInsights] = useState<HealthInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  useEffect(() => {
    try {
      const storedSymptoms = localStorage.getItem('symptoms');
      const storedMeds = localStorage.getItem('medications');
      const storedAppointments = localStorage.getItem('appointments');

      if(storedSymptoms) setSymptoms(JSON.parse(storedSymptoms));
      if(storedMeds) setMedications(JSON.parse(storedMeds));
      if(storedAppointments) setAppointments(JSON.parse(storedAppointments));
    } catch (e) {
      console.error("Failed to parse data from localStorage", e);
    }
  }, []);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    
    const result = await generateInsightsAction({ symptoms, medications, appointments });

    if (result.success && result.data) {
      setInsights(result.data);
    } else {
      setError(result.error || 'An unknown error occurred.');
    }
    setIsLoading(false);
  };
  
  const canGenerate = symptoms.length > 0 || medications.length > 0 || appointments.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            Personalized Health Insights
          </CardTitle>
          <CardDescription>
            Use AI to analyze your tracked health data to discover potential patterns and insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            By analyzing your symptoms, medications, and appointments, our AI can help you better understand your health and prepare for doctor visits.
          </p>
          <Button onClick={handleGenerateInsights} disabled={isLoading || !canGenerate}>
            {isLoading ? 'Generating...' : 'Generate My Insights'}
          </Button>
          {!canGenerate && (
             <p className="text-sm text-muted-foreground pt-2">
                Please add some symptoms, medications, or appointments to generate insights.
             </p>
          )}
        </CardContent>
      </Card>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {insights && <InsightsDisplay insights={insights} />}
    </div>
  );
}

const LoadingState = () => (
  <div className="space-y-6">
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
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

const InsightsDisplay = ({ insights }: { insights: HealthInsightsOutput }) => (
  <div className="space-y-6">
    <Card className="bg-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb />
          AI-Powered Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{insights.insights}</p>
      </CardContent>
    </Card>
    <Card className="bg-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle />
          Suggested Questions for Your Doctor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{insights.suggestedQuestions}</p>
      </CardContent>
    </Card>
  </div>
);
