'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, HeartPulse, Pill, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Feedback } from '@/components/Feedback';
import { TriageFeedback } from '@/components/TriageFeedback';

export default function DashboardPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'dashboard-hero');

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
  };

  const transition = (delay: number) => ({
    duration: 0.4,
    ease: 'easeOut',
    delay,
  });


  return (
    <div className="flex flex-col gap-6">
      <motion.div initial="initial" animate="animate" variants={cardVariants} transition={transition(0)}>
        <Card className="w-full overflow-hidden">
          <div className="relative h-48 sm:h-52 w-full">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl font-bold text-white">
                Welcome to Clarity Care
              </h1>
              <p className="text-white/90 mt-1">
                Your path to managing your health.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <TriageFeedback />
      <Feedback />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div initial="initial" animate="animate" variants={cardVariants} transition={transition(0.2)}>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="text-primary" />
                Symptom Tracker
              </CardTitle>
              <CardDescription>
                Log symptoms to monitor over time.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>
                Keep a record to identify patterns and share with your doctor.
              </p>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/symptoms">
                  Track Symptoms <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={cardVariants} transition={transition(0.3)}>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="text-primary" />
                Medication Log
              </CardTitle>
              <CardDescription>
                Manage your medication schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>
                Stay on top of your treatment plan by tracking your medications.
              </p>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/medications">
                  Log Medications <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={cardVariants} transition={transition(0.4)}>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-primary" />
                Appointments
              </CardTitle>
              <CardDescription>
                Keep track of your doctor visits.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>
                Schedule and manage appointments so you never miss a check-up.
              </p>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/appointments">
                  View Appointments <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
