import { SimpleContentScreen } from '@/components/simple-content-screen';

export default function TermsOfServiceScreen() {
  return (
    <SimpleContentScreen
      title="Terms of Service"
      sections={[
        {
          heading: 'Using Symptora',
          body: 'Symptora provides risk guidance and access to licensed doctors, but is not a substitute for emergency care. In a medical emergency, contact local emergency services immediately.',
        },
        {
          heading: 'Appointments',
          body: 'Appointments booked through the app are subject to doctor and clinic availability. Cancellations should be made as early as possible.',
        },
        {
          heading: 'Account responsibility',
          body: 'You are responsible for the accuracy of the health information you and your family members provide.',
        },
      ]}
    />
  );
}
