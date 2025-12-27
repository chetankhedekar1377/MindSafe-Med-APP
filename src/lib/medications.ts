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
    name: 'Oral Rehydration Solution (ORS)',
    use: 'Dehydration',
    description: 'Used to replace fluids and electrolytes lost during diarrhea or vomiting.',
  },
  {
    name: 'Other',
    use: 'Custom',
    description: 'Select this if your medication is not on the list.',
  },
];
