import { User } from "./User";
import { Session } from "./Session";
import { hashPassword, verifyPassword } from "./passwords";

export const AUTH_GENERIC_ERROR = "Unable to sign in. Check your details and try again.";
export const REGISTER_GENERIC_ERROR =
  "Unable to create this account. Try a different email or sign in.";

export class AuthenticationManager {
  register(input: { name: string; email: string; password: string }): {
    user: User;
    session: Session;
  } {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !email.includes("@") || input.password.length < 8) {
      throw new Error(REGISTER_GENERIC_ERROR);
    }
    if (User.findByEmail(email)) {
      throw new Error(REGISTER_GENERIC_ERROR);
    }
    const user = User.create({
      email,
      name,
      passwordHash: hashPassword(input.password),
    });
    return { user, session: Session.create(user.record.id) };
  }

  authenticate(email: string, password: string): { user: User; session: Session } {
    const user = User.findByEmail(email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash())) {
      throw new Error(AUTH_GENERIC_ERROR);
    }
    return { user, session: Session.create(user.record.id) };
  }

  sessionFromToken(token: string | undefined): { user: User; session: Session } | null {
    if (!token) return null;
    const session = Session.find(token);
    if (!session || session.isExpired) {
      session?.revoke();
      return null;
    }
    const user = User.findById(session.record.userId);
    if (!user) return null;
    return { user, session };
  }

  logout(token: string | undefined): void {
    if (!token) return;
    Session.find(token)?.revoke();
  }
}

export const authenticationManager = new AuthenticationManager();
