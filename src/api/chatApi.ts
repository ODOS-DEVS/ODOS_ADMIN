import { requestJson } from "@/api/client";
import { mapSupportChatMessage, mapSupportChatThread } from "@/api/mappers";
import type { SupportChatMessage, SupportChatThread } from "@/types";

type BackendSupportChatThread = {
  id: string;
  customer_user_id: string;
  vendor_user_id: string;
  thread_type: "support";
  subject?: string | null;
  store: {
    id: string;
    title: string;
    image_key?: string | null;
    image_url?: string | null;
  };
  counterpart: {
    user_id: string;
    name: string;
    avatar_url?: string | null;
    role: "customer" | "vendor" | "admin";
  };
  support_status?: "waiting_on_admin" | "waiting_on_customer" | "resolved" | null;
  assigned_admin_user_id?: string | null;
  assigned_admin_name?: string | null;
  assigned_admin_at?: string | null;
  resolved_at?: string | null;
  last_message_text?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
};

type BackendSupportChatMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_role: "customer" | "vendor" | "admin";
  body: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

export async function getSupportChatThreads(token: string) {
  const threads = await requestJson<BackendSupportChatThread[]>(
    "/chat/threads?scope=support",
    { token },
  );
  return threads.map(mapSupportChatThread);
}

export async function getSupportChatMessages(token: string, threadId: string) {
  const messages = await requestJson<BackendSupportChatMessage[]>(
    `/chat/threads/${threadId}/messages`,
    { token },
  );
  return messages.map(mapSupportChatMessage);
}

export async function sendSupportChatMessage(
  token: string,
  threadId: string,
  body: string,
) {
  const message = await requestJson<BackendSupportChatMessage>(
    `/chat/threads/${threadId}/messages`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ body }),
    },
  );
  return mapSupportChatMessage(message);
}

export async function updateSupportChatThreadStatus(
  token: string,
  threadId: string,
  status: "waiting_on_admin" | "waiting_on_customer" | "resolved",
) {
  const thread = await requestJson<BackendSupportChatThread>(
    `/chat/threads/${threadId}/support-status`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    },
  );
  return mapSupportChatThread(thread);
}

export type { SupportChatMessage, SupportChatThread };
