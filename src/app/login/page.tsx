import Link from "next/link";
import { AuthShell, LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <AuthShell
      title="Come back to the board"
      accent="board"
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-coral-emphasis">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
