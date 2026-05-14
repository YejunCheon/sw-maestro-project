"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Avatar, type AvatarGradient, Btn, Card, Icon, Pill } from "@/components/ui";
import { type ConversationLine, SAMPLE_CONVERSATION } from "@/lib/mock";

type AgentMeta = { name: string; gradient: AvatarGradient; char: string };

export const ConversationView = ({
  onComplete,
  user,
  opponent,
  conversation = SAMPLE_CONVERSATION,
  autoPlay = true,
  speed = 1,
  generating = false,
  expectedTotal,
}: {
  onComplete: () => void;
  user?: { name?: string | null };
  opponent?: { name?: string | null };
  conversation?: ConversationLine[];
  autoPlay?: boolean;
  speed?: number;
  generating?: boolean;
  expectedTotal?: number;
}) => {
  const TOTAL = expectedTotal ?? conversation.length;

  const [shown, setShown] = useState(0);
  const [paused, setPaused] = useState(!autoPlay);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleCount = Math.min(shown, conversation.length);
  const typing =
    !paused && shown < conversation.length
      ? conversation[shown].agent
      : !paused && generating && shown < TOTAL
        ? shown % 2 === 0
          ? "A"
          : "B"
        : null;

  useEffect(() => {
    if (paused || shown >= conversation.length) return;
    const next = conversation[shown];
    const typingDuration = Math.min(1200 + next.text.length * 45, 3200) / speed;
    const t = setTimeout(() => {
      setShown((s) => s + 1);
    }, typingDuration);
    return () => clearTimeout(t);
  }, [shown, paused, speed, conversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shown, typing]);

  useEffect(() => {
    if (!generating && TOTAL > 0 && shown >= TOTAL) {
      const t = setTimeout(() => onComplete(), 1500);
      return () => clearTimeout(t);
    }
  }, [shown, TOTAL, onComplete, generating]);

  const A: AgentMeta = {
    name: user?.name || "민준",
    gradient: "coral",
    char: (user?.name || "민준")[0],
  };
  const opponentName = opponent?.name || "상대 분신";
  const B: AgentMeta = { name: opponentName, gradient: "sunset", char: opponentName[0] };

  const progress = TOTAL ? Math.round((visibleCount / TOTAL) * 100) : 0;
  const isComplete = !generating && TOTAL > 0 && shown >= TOTAL;

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 48px 80px",
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 32,
        alignItems: "start",
      }}
    >
      <div className="tm-fade-up">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Pill tone="coral" size="sm">
            STEP 03 · LIVE
          </Pill>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isComplete ? "var(--ok)" : "var(--coral)",
                animation: isComplete ? "none" : "tm-pulse 1.4s infinite",
              }}
            />
            {isComplete ? "대화 완료" : "AI끼리 대화 중"}
          </div>
        </div>

        <Card pad={0} style={{ overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
          <div
            style={{
              padding: "20px 24px",
              background: "linear-gradient(135deg, #FFF4ED 0%, #FFE4D6 100%)",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex" }}>
                <Avatar name={A.name} char={A.char} gradient={A.gradient} size={40} />
                <div style={{ marginLeft: -12 }}>
                  <Avatar name={B.name} char={B.char} gradient={B.gradient} size={40} ring />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>
                  {A.name}
                  <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}> × </span>
                  {B.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  AI 페르소나 시뮬레이션 · {visibleCount}/{TOTAL} 턴
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setPaused((p) => !p)}
                disabled={isComplete}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "white",
                  border: "1px solid var(--line)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink-soft)",
                  cursor: isComplete ? "default" : "pointer",
                  opacity: isComplete ? 0.4 : 1,
                }}
              >
                {paused ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ height: 3, background: "var(--cream-2)" }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg,#FF5864,#FD267A)",
                transition: "width .4s cubic-bezier(.2,.8,.2,1)",
              }}
            />
          </div>

          <div
            ref={scrollRef}
            style={{
              height: 540,
              overflowY: "auto",
              padding: "24px 28px",
              background: "var(--cream)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <SystemMessage>두 분신이 처음 인사를 나눕니다.</SystemMessage>

            {conversation.slice(0, visibleCount).map((m, i) => (
              <ChatMsg
                key={i}
                msg={m}
                me={m.agent === "A"}
                agent={m.agent === "A" ? A : B}
                showAvatar={shouldShowAvatar(conversation, i, visibleCount)}
              />
            ))}

            {typing && !isComplete && (
              <TypingIndicator agent={typing === "A" ? A : B} me={typing === "A"} />
            )}

            {isComplete && (
              <SystemMessage tone="ok">대화가 끝났어요. 케미를 분석할게요.</SystemMessage>
            )}

            <div style={{ height: 4 }} />
          </div>
        </Card>
      </div>

      <div
        style={{
          position: "sticky",
          top: 96,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <LivePersonaCard agent={A} role="YOU" highlight={typing === "A"} />
        <LivePersonaCard agent={B} role="MATCH" highlight={typing === "B"} />

        <Card pad={20}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-soft)",
              letterSpacing: 0.2,
              textTransform: "uppercase",
            }}
          >
            실시간 시그널
          </div>
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <SignalRow label="티키타카" value={Math.min(progress + 10, 92)} />
            <SignalRow label="공통 화제" value={Math.min(Math.round(progress * 0.9), 84)} />
            <SignalRow label="분위기" value={Math.min(Math.round(progress * 0.85), 81)} />
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: "var(--cream-2)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
            }}
          >
            {Icon.info(13)}{" "}
            <span style={{ verticalAlign: "middle", marginLeft: 4 }}>
              결과는 대화 종료 후에 확정돼요.
            </span>
          </div>
        </Card>

        {!isComplete && (
          <Btn
            variant="ghost"
            size="md"
            onClick={() => {
              setShown(generating ? conversation.length : TOTAL);
            }}
          >
            {generating ? "현재까지 빠르게 보기" : "끝까지 빠르게 보기"}
          </Btn>
        )}
      </div>
    </div>
  );
};

function shouldShowAvatar(arr: ConversationLine[], i: number, totalShown: number) {
  const cur = arr[i];
  const next = arr[i + 1];
  if (i + 1 >= totalShown) return true;
  if (!next || next.agent !== cur.agent) return true;
  return false;
}

const ChatMsg = ({
  msg,
  me,
  agent,
  showAvatar,
}: {
  msg: ConversationLine;
  me: boolean;
  agent: AgentMeta;
  showAvatar: boolean;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: me ? "row-reverse" : "row",
      gap: 10,
      alignItems: "flex-end",
      animation: "tm-fadeUp .35s cubic-bezier(.2,.8,.2,1) both",
    }}
  >
    <div style={{ width: 32, flexShrink: 0 }}>
      {showAvatar && <Avatar name={agent.name} char={agent.char} gradient={agent.gradient} size={32} />}
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: me ? "flex-end" : "flex-start",
        maxWidth: "62%",
      }}
    >
      {showAvatar && (
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            margin: me ? "0 4px 4px 0" : "0 0 4px 4px",
            fontWeight: 500,
          }}
        >
          {agent.name}
        </div>
      )}
      <div
        style={{
          padding: "11px 15px",
          background: me ? "linear-gradient(135deg,#FF5864 0%,#FD267A 100%)" : "white",
          color: me ? "white" : "var(--ink)",
          border: me ? "none" : "1px solid var(--line)",
          borderRadius: me ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          fontSize: 14.5,
          lineHeight: 1.5,
          letterSpacing: -0.2,
          boxShadow: me ? "0 4px 12px rgba(255,88,100,.18)" : "0 1px 2px rgba(60,30,20,.04)",
          fontWeight: 500,
        }}
      >
        {msg.text}
      </div>
    </div>
  </div>
);

const TypingIndicator = ({ agent, me }: { agent: AgentMeta; me: boolean }) => (
  <div
    style={{
      display: "flex",
      flexDirection: me ? "row-reverse" : "row",
      gap: 10,
      alignItems: "flex-end",
      animation: "tm-fade .3s",
    }}
  >
    <div style={{ width: 32, flexShrink: 0 }}>
      <Avatar name={agent.name} char={agent.char} gradient={agent.gradient} size={32} />
    </div>
    <div
      style={{
        padding: "13px 16px",
        background: me ? "linear-gradient(135deg,#FF5864 0%,#FD267A 100%)" : "white",
        border: me ? "none" : "1px solid var(--line)",
        borderRadius: me ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        display: "flex",
        gap: 4,
        alignItems: "center",
        boxShadow: "0 1px 2px rgba(60,30,20,.04)",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: me ? "rgba(255,255,255,.85)" : "var(--ink-mute)",
            animation: `tm-typing 1.2s ${i * 0.18}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

const SystemMessage = ({ children, tone }: { children: ReactNode; tone?: "ok" }) => (
  <div
    style={{
      alignSelf: "center",
      fontSize: 12,
      color: tone === "ok" ? "var(--ok)" : "var(--ink-mute)",
      background: tone === "ok" ? "rgba(54,179,126,.12)" : "var(--cream-2)",
      padding: "6px 14px",
      borderRadius: 99,
      fontWeight: 500,
      margin: "8px 0",
    }}
  >
    {children}
  </div>
);

const LivePersonaCard = ({
  agent,
  role,
  highlight,
}: {
  agent: AgentMeta;
  role: string;
  highlight: boolean;
}) => (
  <Card
    pad={16}
    style={{
      boxShadow: highlight ? "0 0 0 2px var(--coral), var(--shadow-md)" : "var(--shadow-sm)",
      transition: "box-shadow .25s",
      background: highlight ? "linear-gradient(180deg,#fff,#FFF4ED)" : "white",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar
        name={agent.name}
        char={agent.char}
        gradient={agent.gradient}
        size={44}
        ring={highlight}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--ink-mute)",
              fontWeight: 600,
              letterSpacing: 0.4,
            }}
          >
            {role}
          </span>
          {highlight && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 6px",
                background: "var(--coral)",
                color: "white",
                borderRadius: 99,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              TYPING
            </span>
          )}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>{agent.name}</div>
      </div>
    </div>
  </Card>
);

const SignalRow = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 5,
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--ink-soft)" }}>{label}</span>
      <span style={{ fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{value}</span>
    </div>
    <div style={{ height: 6, background: "var(--cream-2)", borderRadius: 99, overflow: "hidden" }}>
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: "linear-gradient(90deg,#FF5864,#FD267A)",
          transition: "width .8s cubic-bezier(.2,.8,.2,1)",
        }}
      />
    </div>
  </div>
);
