import { SimpleContentScreen } from '@/components/simple-content-screen';
import { LEGAL_LAST_UPDATED, privacySections } from '@/data/content';

export default function PrivacyPolicyScreen() {
  return (
    <SimpleContentScreen
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro="How Symptora collects, stores, and protects your health information."
      sections={privacySections}
    />
  );
}
