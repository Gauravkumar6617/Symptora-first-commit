import { APP_NAME } from '@/lib/constants'

const LAST_UPDATED = 'September 15, 2026'

export function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink/60">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-sm mt-8 max-w-none text-ink/80 [&>h2]:mt-8 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-ink [&>p]:mt-3 [&>p]:leading-6 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1">
        <p>
          These Terms of Service ("Terms") govern your use of {APP_NAME}. By
          creating an account or using the platform, you agree to these
          Terms.
        </p>

        <h2>1. The service</h2>
        <p>
          {APP_NAME} provides symptom-checking, appointment booking, family
          health profiles, and telemedicine consultations with independent,
          licensed healthcare providers. {APP_NAME} is a technology platform
          and does not itself practice medicine.
        </p>

        <h2>2. Not a substitute for emergency care</h2>
        <p>
          {APP_NAME} is not an emergency service. If you believe you are
          experiencing a medical emergency, call your local emergency number
          or go to the nearest emergency room immediately.
        </p>

        <h2>3. Accounts</h2>
        <ul>
          <li>You must provide accurate information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>
            When you add family member profiles, you confirm you have the
            authority to manage their health information on the platform.
          </li>
        </ul>

        <h2>4. Doctors and clinics</h2>
        <p>
          Doctors who apply to join {APP_NAME} are independently licensed
          professionals. {APP_NAME} verifies credentials but is not
          responsible for the clinical judgment or advice given during a
          consultation.
        </p>

        <h2>5. Acceptable use</h2>
        <ul>
          <li>Do not use the platform to submit false symptom or identity information.</li>
          <li>Do not attempt to access another user's account or health records.</li>
          <li>Do not use the platform for any unlawful purpose.</li>
        </ul>

        <h2>6. Payments</h2>
        <p>
          Fees for consultations or clinic bookings, where applicable, are
          disclosed before you confirm an appointment. All charges are
          non-refundable except as required by law or stated otherwise at
          the time of booking.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {APP_NAME} is not liable
          for indirect, incidental, or consequential damages arising from
          your use of the platform, including reliance on symptom risk
          assessments, which are informational and not a diagnosis.
        </p>

        <h2>8. Termination</h2>
        <p>
          We may suspend or terminate accounts that violate these Terms. You
          may stop using {APP_NAME} and request account deletion at any
          time.
        </p>

        <h2>9. Changes to these Terms</h2>
        <p>
          We may update these Terms periodically. Continued use of the
          platform after changes take effect constitutes acceptance of the
          updated Terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about these Terms, reach us through our{' '}
          <a href="/contact" className="text-primary-700 underline">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  )
}
