import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];
type Contact = Database["public"]["Tables"]["contacts"]["Row"];

export interface ConversationWithContact extends Conversation {
  contact: Contact | null;
}

export interface MessageWithSender extends Message {
  sender_name?: string;
}

export const useConversations = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          contact:contacts(*)
        `)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      return data as ConversationWithContact[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      senderType,
      senderId,
      attachmentUrl,
      attachmentType,
      attachmentName,
    }: {
      conversationId: string;
      content: string;
      senderType: "agente" | "ia" | "servidor";
      senderId?: string;
      attachmentUrl?: string;
      attachmentType?: string;
      attachmentName?: string;
    }) => {
      // Insert message with optional attachment
      const messageData: any = {
        conversation_id: conversationId,
        content,
        sender_type: senderType,
        sender_id: senderId,
        status: "sent",
        message_type: attachmentUrl ? "attachment" : "text",
      };

      // Add attachment fields if present
      if (attachmentUrl) {
        messageData.metadata = {
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: attachmentName,
        };
      }

      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert(messageData)
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation last_message_at
      const { error: convError } = await supabase
        .from("conversations")
        .update({ 
          last_message_at: new Date().toISOString(),
          unread_count: 0
        })
        .eq("id", conversationId);

      if (convError) throw convError;

      return message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useSendAIMessage = () => {
  const sendMessage = useSendMessage();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userMessage,
      context,
    }: {
      conversationId: string;
      userMessage: string;
      context?: {
        servidor_nome?: string;
        servidor_matricula?: string;
        servidor_secretaria?: string;
      };
    }) => {
      // Call AI chat edge function
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{ role: "user", content: userMessage }],
          context,
        },
      });

      if (error) throw error;

      // Save AI response as message
      await sendMessage.mutateAsync({
        conversationId,
        content: data.message,
        senderType: "ia",
      });

      return data;
    },
  });
};

export const useResolveConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("conversations")
        .update({
          status: "resolvido",
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useTransferConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      assignTo,
    }: {
      conversationId: string;
      assignTo: string;
    }) => {
      const { error } = await supabase
        .from("conversations")
        .update({
          assigned_to: assignTo,
          is_bot_active: false,
        })
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
