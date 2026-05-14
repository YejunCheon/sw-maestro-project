import { useMutation, useQuery } from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api/client";
import type { components } from "@/lib/api/types";

export type AgentCreateInput = components["schemas"]["AgentCreateReq"];
export type Agent = components["schemas"]["AgentResp"];

export const agentKeys = {
  all: ["agents"] as const,
};

export function createAgent(body: AgentCreateInput): Promise<Agent> {
  return unwrap(api.POST("/api/agents", { body }));
}

export function listAgents(): Promise<Agent[]> {
  return unwrap(api.GET("/api/agents"));
}

export function useCreateAgent() {
  return useMutation({
    mutationFn: createAgent,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.all,
    queryFn: listAgents,
  });
}

