import { APP_NAME } from '@/lib/constants'

const LAST_UPDATED = 'September 15, 2026'

export function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink/60">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-sm mt-8 max-w-none text-ink/80 [&>h2]:mt-8 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-ink [&>p]:mt-3 [&>p]:leading-6 [&>ul]:mt-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1">
        <p>
          {APP_NAME} ("we", "us", "our") provides a symptom-checking and
          telemedicine platform. This Privacy Policy explains what
          information we collect, how we use it, and the choices you have.
          By using {APP_NAME}, you agree to the practices described here.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Account details: name, email, phone number, password (hashed).</li>
          <li>
            Health information you provide: symptoms, family member profiles,
            appointment history, and telemedicine consultation notes.
          </li>
          <li>
            Usage data: device, browser, IP address, and how you interact
            with the app, collected for security and reliability.
          </li>
          <li>
            Information from third-party sign-in providers (such as Google),
            limited to your name, email, and profile photo, if you choose to
            sign in that way.
          </li>
        </ul>

        <h2>How we use your information</h2>
        <ul>
          <li>To provide symptom risk assessments and match you to appropriate care.</li>
          <li>To operate appointments, telemedicine sessions, and family profiles.</li>
          <li>To communicate service updates, appointment reminders, and support responses.</li>
          <li>To maintain security, prevent fraud, and comply with legal obligations.</li>
        </ul>

        <h2>How we protect your data</h2>
        <p>
          Health records are stored on a Medplum FHIR-compliant backend with
          encryption in transit and at rest. Access to identifiable health
          data is restricted to authorized clinicians and system processes
          required to deliver the service.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell your personal or health information. We share data
          only with: doctors and clinics you choose to consult with,
          service providers who process data on our behalf under
          confidentiality obligations, and authorities when required by law.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>You can access, update, or delete your account information at any time.</li>
          <li>You can request a copy or deletion of your health records by contacting us.</li>
          <li>You can revoke third-party sign-in access from your provider's account settings.</li>
        </ul>

        <h2>Data retention</h2>
        <p>
          We retain account and health data for as long as your account is
          active, or as needed to comply with legal and medical
          record-keeping requirements.
        </p>

        <h2>Children's privacy</h2>
        <p>
          {APP_NAME} allows parents and guardians to manage family member
          profiles, including for minors, under the account holder's
          consent. We do not knowingly allow children to create their own
          independent accounts.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material
          changes will be notified through the app or via email.
        </p>

        <h2>Contact us</h2>
        <p>
          Questions about this policy or your data can be sent through our{' '}
          <a href="/contact" className="text-primary-700 underline">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  )
}
