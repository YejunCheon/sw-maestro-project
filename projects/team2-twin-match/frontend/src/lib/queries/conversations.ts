import { useMutation, useQuery } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/types";

export type Conversation = components["schemas"]["ConversationResp"];
export type ConversationMessages = components["schemas"]["ConversationMessagesResp"];
export type ConversationResult = components["schemas"]["ConversationResultResp"];
export type JobStatus = components["schemas"]["JobStatusResp"];
export type Chemistry = components["schemas"]["ChemistryResp"];
export type StartConversation = components["schemas"]["StartConversationResp"];

export const conversationKeys = {
  result: (conversationId: string) => ["conversation-result", conversationId] as const,
  messages: (conversationId: string, afterTurn: number) =>
    ["conversation-messages", conversationId, afterTurn] as const,
  job: (jobId: string) => ["job", jobId] as const,
};

export function match(agentId: string): Promise<Conversation> {
  return unwrap(api.POST("/api/conversations/match", { body: { agent_id: agentId } }));
}

export function startConversation(conversationId: string): Promise<StartConversation> {
  return unwrap(
    api.POST("/api/conversations/{conversation_id}/start", {
      params: { path: { conversation_id: conversationId } },
    }),
  );
}

export function getJob(jobId: string): Promise<JobStatus> {
  return unwrap(
    api.GET("/api/jobs/{job_id}", {
      params: { path: { job_id: jobId } },
    }),
  );
}

export function getResult(conversationId: string): Promise<ConversationResult> {
  return unwrap(
    api.GET("/api/conversations/{conversation_id}/result", {
      params: { path: { conversation_id: conversationId } },
    }),
  );
}

export function getMessages(
  conversationId: string,
  afterTurn = 0,
): Promise<ConversationMessages> {
  return unwrap(
    api.GET("/api/conversations/{conversation_id}/messages", {
      params: {
        path: { conversation_id: conversationId },
        query: { after_turn: afterTurn },
      },
    }),
  );
}

export function analyze(conversationId: string): Promise<Chemistry> {
  return unwrap(
    api.POST("/api/conversations/{conversation_id}/analyze", {
      params: { path: { conversation_id: conversationId } },
    }),
  );
}

export function useMatch() {
  return useMutation({
    mutationFn: match,
  });
}

export function useStartConversation() {
  return useMutation({
    mutationFn: startConversation,
  });
}

export function useJob(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: conversationKeys.job(jobId ?? ""),
    queryFn: () => getJob(jobId ?? ""),
    enabled: Boolean(jobId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 1500 : false;
    },
  });
}

export function useResult(conversationId: string, enabled = true) {
  return useQuery({
    queryKey: conversationKeys.result(conversationId),
    queryFn: () => getResult(conversationId),
    enabled: Boolean(conversationId) && enabled,
  });
}

export function useConversationMessages(
  conversationId: string,
  afterTurn: number,
  enabled = true,
) {
  return useQuery({
    queryKey: conversationKeys.messages(conversationId, afterTurn),
    queryFn: () => getMessages(conversationId, afterTurn),
    enabled: Boolean(conversationId) && enabled,
    refetchInterval: enabled ? 1800 : false,
  });
}

export function useAnalyze() {
  return useMutation({
    mutationFn: analyze,
  });
}
