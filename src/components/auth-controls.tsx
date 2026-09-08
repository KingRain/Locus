"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/locus-ui";

export function AuthControls({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="ghost" className="py-2">
            Log in
          </Button>
        </SignInButton>
        {!compact ? (
          <SignUpButton mode="modal">
            <Button>Get started</Button>
          </SignUpButton>
        ) : null}
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </Show>
    </>
  );
}
