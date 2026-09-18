import { SimpleContentScreen } from '@/components/simple-content-screen';
import { LEGAL_LAST_UPDATED, termsSections } from '@/data/content';

export default function TermsOfServiceScreen() {
  return (
    <SimpleContentScreen
      title="Terms of Service"
      lastUpdated={LEGAL_LAST_UPDATED}
      intro="The ground rules for using Symptora, and what it is not meant to replace."
      sections={termsSections}
    />
  );
}
