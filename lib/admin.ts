import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class AdminAccessError extends Error {
  constructor(message = "Admin access required") {
    super(message);
    this.name = "AdminAccessError";
  }
}

export const requireAdminSession = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).isAdmin) {
    throw new AdminAccessError();
  }

  return session;
};








