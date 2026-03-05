export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600">
          Something went wrong during sign in. Please try again.
        </p>
        <a href="/login" className="text-sm text-foreground underline">
          Back to login
        </a>
      </div>
    </div>
  );
}
