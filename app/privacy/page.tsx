import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-medium text-accent-green hover:opacity-80"
        >
          &larr; Back to home
        </Link>

        <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-sm leading-6 text-muted">
          <p>Last updated: March 2026</p>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Data controller
            </h2>
            <p>
              livingwithendo is operated by [Your Name / Entity], [Address],
              [Country]. For questions about your data, contact us at [email
              address].
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              What data we collect
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Account data:</strong> email address and password (or
                Google account identifier if using Google sign-in).
              </li>
              <li>
                <strong>Profile data:</strong> name, date of birth, country,
                mobile number, avatar photo, and endometriosis-related
                information (diagnosis date, stage, treatment plans, healthcare
                providers, treatment goals).
              </li>
              <li>
                <strong>Health and symptom data:</strong> daily symptom logs
                including pain levels, digestion, lifestyle factors, cycle
                phase, and free-text notes. This is special category data under
                GDPR Article 9.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Legal basis for processing
            </h2>
            <p>
              We process your account and profile data based on the performance
              of our contract with you (providing the service). We process your
              health and symptom data based on your <strong>explicit consent</strong>,
              which you provide when creating your account. You may withdraw
              consent at any time by deleting your account in Settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Purpose of processing
            </h2>
            <p>
              Your data is used solely to provide you with the livingwithendo
              symptom tracking service — logging symptoms, generating summaries
              and trend charts, and producing doctor-ready exports. We do not
              use your data for advertising, profiling, or any purpose beyond
              delivering the service to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Where your data is stored
            </h2>
            <p>
              Your data is stored securely in Supabase (hosted on AWS
              infrastructure). Authentication is handled by Supabase Auth with
              row-level security ensuring you can only access your own data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Data retention
            </h2>
            <p>
              Your data is retained for as long as your account is active. When
              you delete your account, all associated data (profile, symptom
              logs, and stories) is permanently deleted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Your rights
            </h2>
            <p>Under GDPR, you have the right to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Access</strong> your personal data (via Settings &gt;
                Export data).
              </li>
              <li>
                <strong>Rectify</strong> inaccurate data (via your Profile
                page).
              </li>
              <li>
                <strong>Erase</strong> your data (via Settings &gt; Delete
                account).
              </li>
              <li>
                <strong>Export</strong> your data in a portable format (CSV
                download via Settings).
              </li>
              <li>
                <strong>Withdraw consent</strong> for health data processing at
                any time by deleting your account.
              </li>
            </ul>
            <p>
              To exercise any of these rights, use the tools within the app or
              contact us at [email address].
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Cookies and local storage
            </h2>
            <p>
              livingwithendo does not use cookies. We use browser localStorage
              solely for authentication session management and storing your
              cookie consent preference. No analytics or third-party tracking
              is present.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Changes to this policy
            </h2>
            <p>
              We may update this policy from time to time. If we make
              significant changes, we will notify you via the app. Continued
              use of the service after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
