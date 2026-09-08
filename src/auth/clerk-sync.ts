import { currentUser } from "@clerk/nextjs/server";
import { User } from "./User";

export async function requireLocalUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Not authenticated");
  }
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
  const name =
    clerkUser.fullName?.trim() ||
    clerkUser.username?.trim() ||
    email.split("@")[0] ||
    "User";
  const user = User.syncFromClerk({
    id: clerkUser.id,
    email,
    name,
  });
  return { user, clerkUserId: clerkUser.id };
}
