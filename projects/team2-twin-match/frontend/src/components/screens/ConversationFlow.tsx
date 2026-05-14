"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { useAgents } from "@/lib/queries/agents";
import {
  type Chemistry,
  type ConversationMessages,
  useConversationMessages,
  useAnalyze,
  useJob,
  useResult,
  useStartConversation,
} from "@/lib/queries/conversations";
import { loadActiveMatch } from "@/lib/session";
import type { ConversationLine } from "@/lib/mock";

import { Btn, Card, Icon, Pill, TopNav } from "../ui";
import { ConversationView } from "./ConversationView";
import { MatchingPhase } from "./MatchingPhase";
import { type ChemistryResult, ResultView } from "./ResultView";

export const ConversationFlow = ({ conversationId }: { conversationId: string }) => {
  const router = useRouter();
  const [activeMatch] = useState(() => loadActiveMatch(conversationId));
  const [jobId, setJobId] = useState<string | null>(null);
  const [conversationPlayed, setConversationPlayed] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [liveMessages, setLiveMessages] = useState<ConversationMessage[]>([]);

  const agentsQuery = useAgents();
  const startConversation = useStartConversation();
  const jobQuery = useJob(jobId, Boolean(jobId));
  const jobStatus = jobQuery.data?.status;
  const latestTurn = getLatestTurn(liveMessages);
  const pollingMessages = Boolean(jobId) && (
    jobStatus === "pending" || jobStatus === "processing"
  );
  const messagesQuery = useConversationMessages(
    conversationId,
    latestTurn,
    pollingMessages,
  );
  const resultQuery = useResult(
    conversationId,
    jobStatus === "completed" || conversationPlayed,
  );
  const analyzeConversation = useAnalyze();

  const conversation = resultQuery.data?.conversation ?? activeMatch?.conversation;
  const agents = agentsQuery.data ?? [];
  const agentA =
    agents.find((agent) => agent.id === conversation?.agent_a_id) ?? activeMatch?.agent;
  const agentB = agents.find((agent) => agent.id === conversation?.agent_b_id);

  useEffect(() => {
    const incoming = messagesQuery.data?.messages ?? [];
    if (incoming.length === 0) return;
    const task = setTimeout(() => {
      setLiveMessages((prev) => mergeMessages(prev, incoming));
    }, 0);
    return () => clearTimeout(task);
  }, [messagesQuery.data]);

  useEffect(() => {
    const finalMessages = resultQuery.data?.messages ?? [];
    if (finalMessages.length === 0) return;
    const task = setTimeout(() => {
      setLiveMessages((prev) => mergeMessages(prev, finalMessages));
    }, 0);
    return () => clearTimeout(task);
  }, [resultQuery.data]);

  const messages = resultQuery.data?.messages ?? liveMessages;
  const lines = useMemo(
    () => toConversationLines(messages, conversation?.agent_a_id),
    [messages, conversation?.agent_a_id],
  );
  const chemistry = analyzeConversation.data ?? resultQuery.data?.chemistry ?? null;
  const result = chemistry ? toChemistryResult(chemistry) : null;
  const showingLiveConversation =
    Boolean(jobId) &&
    !conversationPlayed &&
    (jobStatus === "pending" ||
      jobStatus === "processing" ||
      (jobStatus === "completed" && (resultQuery.isLoading || Boolean(resultQuery.data))));

  const handleMatched = async () => {
    if (jobId || startConversation.isPending) return;
    setFlowError(null);
    try {
      const started = await startConversation.mutateAsync(conversationId);
      setJobId(started.job_id);
    } catch (err) {
      setFlowError(toErrorMessage(err));
    }
  };

  const handleConversationComplete = async () => {
    if (conversationPlayed || analyzeConversation.isPending) return;
    setConversationPlayed(true);
    if (chemistry) return;
    setFlowError(null);
    try {
      await analyzeConversation.mutateAsync(conversationId);
    } catch (err) {
      setFlowError(toErrorMessage(err));
    }
  };

  const stepIndex =
    conversationPlayed && result ? 3 : jobId || startConversation.isPending ? 2 : 1;

  return (
    <>
      <TopNav
        onLogo={() => router.push("/")}
        step={stepIndex}
        totalSteps={4}
        onRestart={() => router.push("/")}
      />

      {flowError && <ErrorPanel message={flowError} onRestart={() => router.push("/")} />}

      {!flowError && !jobId && !startConversation.isPending && (
        <MatchingPhase
          onMatched={handleMatched}
          user={agentA}
          opponent={agentB}
        />
      )}

      {!flowError && startConversation.isPending && (
        <ProcessingPanel
          step="STEP 03 · 준비"
          title="대화방을 여는 중이에요"
          body="매칭된 두 분신이 곧 인사를 나눌 수 있도록 준비하고 있습니다."
          progress={12}
        />
      )}

      {!flowError && jobStatus === "failed" && (
        <ErrorPanel
          message={jobQuery.data?.error || "대화 생성 중 오류가 발생했습니다."}
          onRestart={() => router.push("/")}
        />
      )}

      {!flowError && jobStatus === "completed" && resultQuery.error && (
        <ErrorPanel message={toErrorMessage(resultQuery.error)} onRestart={() => router.push("/")} />
      )}

      {!flowError && showingLiveConversation && (
        <ConversationView
          onComplete={handleConversationComplete}
          user={agentA}
          opponent={agentB}
          conversation={lines}
          generating={jobStatus !== "completed" || resultQuery.isLoading}
          expectedTotal={40}
          speed={1.25}
        />
      )}

      {!flowError && conversationPlayed && analyzeConversation.isPending && (
        <ProcessingPanel
          step="STEP 04 · 분석"
          title="주선자 AI가 케미를 읽고 있어요"
          body="대화 전체를 바탕으로 점수와 코멘트를 생성하고 있습니다."
          progress={90}
        />
      )}

      {!flowError && conversationPlayed && result && (
        <ResultView
          onRestart={() => router.push("/")}
          onConnect={() => alert("매칭 요청을 보냈습니다")}
          user={agentA}
          opponent={agentB}
          result={result}
          conversation={lines}
        />
      )}
    </>
  );
};

type ConversationMessage = ConversationMessages["messages"][number];

function mergeMessages(
  prev: ConversationMessage[],
  incoming: ConversationMessage[],
): ConversationMessage[] {
  const byId = new Map(prev.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.turn_number - b.turn_number);
}

function getLatestTurn(messages: ConversationMessage[]) {
  return Math.max(0, ...messages.map((message) => message.turn_number));
}

function toConversationLines(
  messages: ConversationMessage[],
  agentAId?: string,
): ConversationLine[] {
  return [...messages]
    .sort((a, b) => a.turn_number - b.turn_number)
    .map((message) => ({
      agent: message.agent_id === agentAId ? "A" : "B",
      text: message.content,
    }));
}

function toChemistryResult(chemistry: Chemistry): ChemistryResult {
  const metricHints: Record<string, string> = {
    "티키타카": "질문과 답변이 자연스럽게 이어졌는지",
    "공통 화제": "취향과 가치관의 접점이 얼마나 나왔는지",
    "분위기": "말투와 리액션의 온도가 잘 맞았는지",
    "거리감": "초반 소개팅에 맞는 속도와 배려가 있었는지",
  };
  const metricsObject = chemistry.metrics ?? {};
  const preferred = ["티키타카", "공통 화제", "분위기", "거리감"];
  const labels = [
    ...preferred.filter((label) => label in metricsObject),
    ...Object.keys(metricsObject).filter((label) => !preferred.includes(label)),
  ];

  return {
    score: chemistry.score,
    oneliner: chemistry.oneliner,
    summary: chemistry.summary,
    metrics: labels.map((label) => ({
      label,
      value: metricsObject[label],
      hint: metricHints[label],
    })),
    good: chemistry.good_points ?? [],
    concerns: chemistry.concerns ?? [],
    finalLine: chemistry.final_comment,
  };
}

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.detail;
  if (err instanceof Error) return err.message;
  return "알 수 없는 오류가 발생했습니다.";
}

const ProcessingPanel = ({
  step,
  title,
  body,
  progress,
}: {
  step: string;
  title: string;
  body: string;
  progress: number;
}) => (
  <div
    style={{
      minHeight: "calc(100vh - 72px)",
      display: "grid",
      placeItems: "center",
      padding: "40px 48px",
    }}
  >
    <Card pad={32} style={{ width: "min(560px, 100%)", textAlign: "center" }}>
      <Pill tone="coral" size="sm">
        {step}
      </Pill>
      <h2
        style={{
          margin: "18px 0 10px",
          fontSize: 34,
          lineHeight: 1.15,
          fontWeight: 700,
        }}
      >
        {title}
      </h2>
      <p style={{ margin: "0 auto 24px", color: "var(--ink-soft)", lineHeight: 1.55 }}>
        {body}
      </p>
      <div style={{ height: 8, borderRadius: 99, background: "var(--cream-2)", overflow: "hidden" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            borderRadius: 99,
            background: "linear-gradient(90deg,#FF5864,#FD267A)",
            transition: "width .4s",
          }}
        />
      </div>
    </Card>
  </div>
);

const ErrorPanel = ({ message, onRestart }: { message: string; onRestart: () => void }) => (
  <div
    style={{
      minHeight: "calc(100vh - 72px)",
      display: "grid",
      placeItems: "center",
      padding: "40px 48px",
    }}
  >
    <Card pad={32} style={{ width: "min(560px, 100%)", textAlign: "center" }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          margin: "0 auto 18px",
          display: "grid",
          placeItems: "center",
          background: "rgba(253,38,122,.08)",
          color: "var(--coral-deep)",
        }}
      >
        {Icon.x(24)}
      </div>
      <h2 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 700 }}>진행할 수 없어요</h2>
      <p style={{ margin: "0 0 24px", color: "var(--ink-soft)", lineHeight: 1.55 }}>{message}</p>
      <Btn variant="primary" onClick={onRestart} icon={Icon.arrowLeft(16)}>
        처음으로
      </Btn>
    </Card>
  </div>
);
