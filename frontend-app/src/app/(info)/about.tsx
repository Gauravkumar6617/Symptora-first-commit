import { SimpleContentScreen } from '@/components/simple-content-screen';

export default function AboutScreen() {
  return (
    <SimpleContentScreen
      title="About Symptora"
      sections={[
        {
          heading: 'Our mission',
          body: "Symptora helps people know when a symptom matters and act before it's too late — with guided risk checks, fast access to doctors, and shared family health profiles.",
        },
        {
          heading: 'What we offer',
          body: 'Health checks with instant risk scoring, video and in-person doctor consultations, a network of partner clinics, and family profiles so you can manage care for everyone you look after.',
        },
        {
          heading: 'Our team',
          body: 'Symptora is built by clinicians and engineers who believe healthcare should be proactive, not reactive.',
        },
      ]}
    />
  );
}
