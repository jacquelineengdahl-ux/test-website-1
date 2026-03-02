import Link from "next/link";

export default function TermsOfUsePage() {
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
          Terms of Use
        </h1>

        <div className="space-y-8 text-sm leading-6 text-muted">
          <p>Last updated: March 2026</p>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Acceptance of terms
            </h2>
            <p>
              By creating an account or using livingwithendo, you agree to these
              Terms of Use and our{" "}
              <Link href="/privacy" className="text-accent-green underline">
                Privacy Policy
              </Link>
              . If you do not agree, please do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Medical disclaimer
            </h2>
            <p>
              livingwithendo is a personal self-tracking and reflection tool. It
              is <strong>not a medical device</strong>, does not provide medical
              advice, and is not intended to diagnose, treat, cure, or prevent
              any disease or health condition. The information recorded and
              displayed within the app is for personal reference only.
            </p>
            <p>
              Always consult a qualified healthcare provider for medical
              decisions. Never disregard professional medical advice or delay
              seeking it because of something you have read or recorded in this
              app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Eligibility
            </h2>
            <p>
              You must be at least 18 years old to create an account and use
              livingwithendo. By registering, you confirm that you meet this age
              requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Account responsibilities
            </h2>
            <p>
              You are responsible for maintaining the security of your account
              credentials. You agree not to share your account with others and
              to notify us promptly if you suspect unauthorized access. You are
              responsible for all activity that occurs under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Acceptable use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Use the service for any unlawful purpose.</li>
              <li>
                Attempt to gain unauthorized access to other users&apos; data or
                the underlying systems.
              </li>
              <li>
                Interfere with or disrupt the service or its infrastructure.
              </li>
              <li>
                Upload malicious content or attempt to exploit
                vulnerabilities.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Intellectual property
            </h2>
            <p>
              All content, design, and code of livingwithendo is owned by [Your
              Name / Entity]. Your personal data remains yours. You grant us a
              limited license to store and process your data solely for the
              purpose of providing the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Limitation of liability
            </h2>
            <p>
              livingwithendo is provided &ldquo;as is&rdquo; without warranties
              of any kind, express or implied. To the fullest extent permitted
              by law, we shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the
              service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Termination
            </h2>
            <p>
              You may delete your account at any time via Settings. We reserve
              the right to suspend or terminate accounts that violate these
              terms. Upon termination, your data will be permanently deleted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Governing law
            </h2>
            <p>
              These terms are governed by the laws of [Country / Jurisdiction].
              Any disputes shall be resolved in the courts of [City,
              Country / Jurisdiction].
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              Contact
            </h2>
            <p>
              For questions about these terms, contact us at [email address].
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
