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
    <div className="flex flex-col gap-8">
      <motion.div initial="initial" animate="animate" variants={cardVariants} transition={transition(0)}>
        <Card className="w-full overflow-hidden">
          <div className="relative h-52 w-full">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-3xl font-bold text-white">
                Welcome to Clarity Care
              </h1>
              <p className="text-white/90">
                Your calm, clear path to managing your health.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div initial="initial" animate="animate" variants={cardVariants} transition={transition(0.1)}>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="text-primary" />
                Symptom Tracker
              </CardTitle>
              <CardDescription>
                Log and monitor your symptoms over time.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>
                Keep a detailed record of your symptoms to share with your doctor.
                Tracking helps identify patterns and triggers.
              </p>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/symptoms">
                  Go to Symptoms <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={cardVariants} transition={transition(0.2)}>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="text-primary" />
                Medication Log
              </CardTitle>
              <CardDescription>
                Manage your medication schedule effortlessly.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>
                Add your medications and track when you've taken them. Stay on top of
                your treatment plan without the stress.
              </p>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/medications">
                  Go to Medications <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={cardVariants} transition={transition(0.3)}>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-primary" />
                Appointments
              </CardTitle>
              <CardDescription>
                Keep track of all your doctor visits.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>
                Schedule and manage your upcoming appointments. Never miss a
                check-up or consultation again.
              </p>
            </CardContent>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/appointments">
                  Go to Appointments <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
