import { SimpleContentScreen } from '@/components/simple-content-screen';

export default function PrivacyPolicyScreen() {
  return (
    <SimpleContentScreen
      title="Privacy Policy"
      sections={[
        {
          heading: 'Data we collect',
          body: 'We collect the information you provide when creating an account, booking appointments, and running health checks, including symptoms, vitals, and family member profiles.',
        },
        {
          heading: 'How we use it',
          body: 'Your data is used to provide risk assessments, connect you with doctors, and maintain your appointment and family history. We never sell your health data.',
        },
        {
          heading: 'Your controls',
          body: 'You can update or delete your profile and family member data at any time from the Profile tab.',
        },
      ]}
    />
  );
}
