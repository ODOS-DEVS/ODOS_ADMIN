import { getSupportChatThreads } from "@/api/chatApi";
import { getUser } from "@/api/usersApi";
import type { AdminUserDetail, SupportChatThread } from "@/types";

export type UserProfileReport = {
  user: AdminUserDetail;
  supportThreads: SupportChatThread[];
  loadedAt: string;
};

export async function loadUserProfile(token: string, userId: string): Promise<UserProfileReport> {
  const [user, supportThreads] = await Promise.all([
    getUser(token, userId),
    getSupportChatThreads(token).catch(() => [] as SupportChatThread[]),
  ]);

  return {
    user,
    supportThreads: supportThreads.filter((thread) => thread.requesterUserId === userId),
    loadedAt: new Date().toISOString(),
  };
}
