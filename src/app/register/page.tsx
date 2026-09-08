import Link from "next/link";
import { AuthShell, RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Start a shared sketchbook"
      accent="shared"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-coral-emphasis">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
