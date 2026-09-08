import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";
import { User } from "@/auth/User";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
});

const COLORS = ["#ff5858", "#86e0c1", "#fedf89", "#151b31", "#6d6f75"] as const;

function assignColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index] as string;
}

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return new Response("Not authenticated", { status: 401 });
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

    const avatar = clerkUser.imageUrl ?? "";

    const { status, body } = await liveblocks.identifyUser(
      {
        userId: user.record.id,
        groupIds: [],
      },
      {
        userInfo: {
          name: user.record.name,
          color: assignColor(user.record.id),
          avatar,
        },
      },
    );

    return new Response(body, { status });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
