"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PersonaForm } from "@/components/screens/PersonaForm";
import { TopNav } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { useCreateAgent } from "@/lib/queries/agents";
import { useMatch } from "@/lib/queries/conversations";
import { saveActiveMatch } from "@/lib/session";

export default function PersonaNewPage() {
  const router = useRouter();
  const createAgent = useCreateAgent();
  const matchAgent = useMatch();
  const [error, setError] = useState<string | null>(null);

  const handleNext: Parameters<typeof PersonaForm>[0]["onNext"] = async (payload) => {
    setError(null);
    try {
      const agent = await createAgent.mutateAsync({
        name: payload.name,
        age: payload.age,
        gender: payload.gender,
        persona_text: payload.text,
      });
      const conversation = await matchAgent.mutateAsync(agent.id);
      saveActiveMatch({ agent, conversation });
      router.push(`/conversations/${conversation.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
      );
    }
  };

  const submitting = createAgent.isPending || matchAgent.isPending;

  return (
    <>
      <TopNav
        onLogo={() => router.push("/")}
        step={0}
        totalSteps={4}
        onRestart={() => router.push("/")}
      />
      <PersonaForm
        onNext={handleNext}
        onBack={() => router.push("/")}
        submitting={submitting}
        error={error}
      />
    </>
  );
}
