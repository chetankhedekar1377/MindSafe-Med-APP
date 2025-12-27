import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Policy</CardTitle>
        <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Introduction</h2>
          <p className="text-muted-foreground">
            Welcome to MindSafe Med. We are committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by MindSafe Med. All data you enter into this application is stored locally on your device and is not transmitted to any server or third party.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p className="text-muted-foreground">
            MindSafe Med stores the following information on your local device:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Symptom Data:</strong> Information you log about your symptoms, including name, date, and severity.</li>
            <li><strong>Medication Data:</strong> Details about your medications, such as name, dosage, frequency, and time.</li>
            <li><strong>Appointment Data:</strong> Information about your doctor's appointments, including provider, date, time, and location.</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">How We Use Your Information</h2>
          <p className="text-muted-foreground">
            Your data is used solely for the functionality of the application, which includes:
          </p>
           <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Displaying your symptom, medication, and appointment history to you.</li>
            <li>Allowing you to track your health information over time.</li>
            <li>Providing data to the AI-powered insights feature, which processes the information on-device or through a secure, anonymized service to generate health correlations.</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Data Storage and Security</h2>
          <p className="text-muted-foreground">
            All the data you provide to MindSafe Med is stored exclusively in your browser's local storage. This means the data resides on your computer or mobile device and is not sent to our servers. We do not have access to your personal health data. It is your responsibility to secure the device you use to access this application.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Changes to This Privacy Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
