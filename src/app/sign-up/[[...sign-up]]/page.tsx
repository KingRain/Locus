import { SignUp } from "@clerk/nextjs";
import { Banner, Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-ash-canvas">
      <Banner />
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-6 pb-16">
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </main>
    </div>
  );
}
