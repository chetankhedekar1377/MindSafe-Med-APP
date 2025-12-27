export type MedicationInfo = {
  name: string;
  use: string;
  description: string;
};

export const commonMedications: MedicationInfo[] = [
  {
    name: 'Paracetamol',
    use: 'Pain & Fever',
    description: 'Also known as Acetaminophen. Used for mild to moderate pain and fever.',
  },
  {
    name: 'Ibuprofen',
    use: 'Pain & Inflammation',
    description: 'A nonsteroidal anti-inflammatory drug (NSAID) for pain, fever, and inflammation.',
  },
  {
    name: 'Aspirin',
    use: 'Pain, Fever & Anti-inflammatory',
    description: 'Used for pain, fever, and inflammation. Not recommended for children.',
  },
  {
    name: 'Antacid',
    use: 'Acidity & Heartburn',
    description: 'Neutralizes stomach acid to relieve heartburn and indigestion.',
  },
  {
    name: 'Loratadine',
    use: 'Allergies',
    description: 'A non-sedating antihistamine for allergy symptoms like sneezing and itchy eyes.',
  },
  {
    name: 'Cetirizine',
    use: 'Allergies',
    description: 'An antihistamine for allergy symptoms. Can cause drowsiness in some people.',
  },
  {
    name: 'Diphenhydramine',
    use: 'Allergies & Sleep Aid',
    description: 'An antihistamine that can treat allergy symptoms and insomnia. Causes drowsiness.',
  },
  {
    name: 'Dextromethorphan',
    use: 'Cough Suppressant',
    description: 'Used to relieve a dry, hacking cough. Does not treat the cause of the cough.',
  },
  {
    name: 'Guaifenesin',
    use: 'Expectorant (Chest Congestion)',
    description: 'Helps loosen mucus and thin bronchial secretions to make coughs more productive.',
  },
  {
    name: 'Loperamide',
    use: 'Diarrhea',
    description: 'Slows down digestion to help reduce the frequency of diarrhea.',
  },
  {
    name: 'Oral Rehydration Solution (ORS)',
    use: 'Dehydration',
    description: 'Used to replace fluids and electrolytes lost during diarrhea or vomiting.',
  },
  {
    name: 'Hydrocortisone Cream (1%)',
    use: 'Topical Steroid',
    description: 'For temporary relief of minor skin irritations, itching, and rashes.',
  },
  {
    name: 'Other',
    use: 'Custom',
    description: 'Select this if your medication is not on the list.',
  },
];
