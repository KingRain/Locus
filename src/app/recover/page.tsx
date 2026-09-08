import { redirect } from "next/navigation";

export default function RecoverRedirectPage() {
  redirect("/sign-in");
}
