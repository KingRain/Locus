import Link from "next/link";
import { AuthShell, RecoverForm } from "@/components/auth-forms";

export default function RecoverPage() {
  return (
    <AuthShell
      title="Find your way back"
      accent="back"
      footer={
        <Link href="/login" className="font-medium text-coral-emphasis">
          Return to sign in
        </Link>
      }
    >
      <RecoverForm />
    </AuthShell>
  );
}
