"use client";

import { type ReactNode, useEffect, useState } from "react";

import { Card, Icon, Pill } from "@/components/ui";
import { SAMPLE_OPPONENT } from "@/lib/mock";

export const MatchingPhase = ({
  onMatched,
  user,
  opponent: matchedOpponent,
}: {
  onMatched: () => void;
  user?: { name?: string | null; age?: number | null; tags?: string[] };
  opponent?: { name?: string | null; age?: number | null; tags?: string[] };
}) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2400);
    const t2 = setTimeout(() => setPhase(2), 4200);
    const t3 = setTimeout(() => onMatched(), 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onMatched]);

  const opponent = {
    ...SAMPLE_OPPONENT,
    ...matchedOpponent,
    tags: matchedOpponent?.tags?.length ? matchedOpponent.tags : SAMPLE_OPPONENT.tags,
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "grid",
        placeItems: "center",
        padding: "40px 48px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 30%, rgba(255,180,153,.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(253,38,122,.25), transparent 50%)",
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 880 }}>
        <Pill tone="coral" size="md">
          STEP 02 · 매칭
        </Pill>
        <h2
          style={{
            fontSize: 48,
            letterSpacing: -1.5,
            lineHeight: 1.1,
            fontWeight: 700,
            margin: "20px 0 14px",
          }}
        >
          {phase === 0 && "지금 접속 중인 분신을 찾는 중…"}
          {phase === 1 && (
            <>
              <span
                style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}
              >
                {opponent.name}
              </span>
              님과 매칭됐어요
            </>
          )}
          {phase === 2 && "곧 두 분신이 인사를 나눠요"}
        </h2>
        <p
          style={{
            color: "var(--ink-soft)",
            fontSize: 17,
            margin: "0 0 56px",
            lineHeight: 1.5,
          }}
        >
          {phase === 0 && "비슷한 결을 찾기보다, 진짜 케미가 맞는지를 봅니다. 외모는 변수에서 빼두고요."}
          {phase === 1 && "두 분신은 서로의 페르소나만 알 뿐, 이름과 나이는 마지막에 공개돼요."}
          {phase === 2 && "20턴의 대화가 시작됩니다. 옆에서 지켜보세요."}
        </p>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 0,
            maxWidth: 880,
            margin: "0 auto",
          }}
        >
          <MatchCard
            side="left"
            phase={phase}
            name={user?.name || "민준"}
            age={user?.age || 28}
            tags={user?.tags?.length ? user.tags : ["#INTP", "#필름", "#등산"]}
            gradient="coral"
            label="YOU"
            blurred={false}
          />

          <div
            style={{
              width: 180,
              display: "grid",
              placeItems: "center",
              position: "relative",
            }}
          >
            <CenterMatcher phase={phase} />
          </div>

          <MatchCard
            side="right"
            phase={phase}
            name={phase >= 1 ? opponent.name || "상대" : "?"}
            age={phase >= 1 ? opponent.age || "??" : "??"}
            tags={phase >= 1 ? opponent.tags : ["#???", "#???", "#???"]}
            gradient="sunset"
            label="MATCH"
            blurred={phase < 1}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            marginTop: 64,
            color: "var(--ink-mute)",
            fontSize: 13,
          }}
        >
          <Step done={phase >= 0}>분신 검색</Step>
          <Step done={phase >= 1}>매칭 성사</Step>
          <Step done={phase >= 2}>대화방 준비</Step>
        </div>
      </div>
    </div>
  );
};

const Step = ({ done, children }: { done: boolean; children: ReactNode }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: done ? "var(--coral-deep)" : "var(--ink-mute)",
      fontWeight: done ? 600 : 500,
      transition: "color .3s",
    }}
  >
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: done ? "var(--coral)" : "transparent",
        border: "2px solid",
        borderColor: done ? "var(--coral)" : "var(--line)",
        display: "grid",
        placeItems: "center",
        color: "white",
        transition: "all .3s",
      }}
    >
      {done && Icon.check(11)}
    </div>
    {children}
  </div>
);

const MatchCard = ({
  side,
  phase,
  name,
  age,
  tags,
  gradient,
  label,
  blurred,
}: {
  side: "left" | "right";
  phase: number;
  name: string;
  age: number | string;
  tags: string[];
  gradient: "coral" | "sunset";
  label: string;
  blurred: boolean;
}) => {
  const offset = phase === 0 ? (side === "left" ? -40 : 40) : 0;
  return (
    <div
      style={{
        transition: "transform .8s cubic-bezier(.2,.8,.2,1), filter .5s",
        transform: `translateX(${offset}px)`,
      }}
    >
      <Card pad={20} style={{ textAlign: "left", boxShadow: "var(--shadow-md)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Pill tone={side === "left" ? "coral" : "cream"} size="sm">
            {label}
          </Pill>
        </div>
        <div
          style={{
            width: "100%",
            aspectRatio: "1.2/1",
            borderRadius: 16,
            background:
              gradient === "coral"
                ? "linear-gradient(135deg,#FFE4D6 0%,#FF5864 100%)"
                : "linear-gradient(135deg,#FFD86F 0%,#FB6786 100%)",
            display: "grid",
            placeItems: "center",
            color: "white",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 88,
            letterSpacing: -2,
            marginBottom: 14,
            position: "relative",
            overflow: "hidden",
            filter: blurred ? "blur(8px)" : "none",
            transition: "filter .6s",
          }}
        >
          {blurred ? "?" : String(name)[0]}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,255,255,.5), transparent 50%)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: -0.4,
            filter: blurred ? "blur(4px)" : "none",
            transition: "filter .6s",
          }}
        >
          {name} <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>· {age}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            marginTop: 10,
            filter: blurred ? "blur(4px)" : "none",
            transition: "filter .6s",
          }}
        >
          {tags.map((t, index) => (
            <span
              key={`${side}-tag-${index}-${t}`}
              style={{
                fontSize: 12,
                color: "var(--coral-deep)",
                background: "rgba(255,88,100,.1)",
                padding: "4px 10px",
                borderRadius: 99,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

const CenterMatcher = ({ phase }: { phase: number }) => (
  <div
    style={{
      width: 100,
      height: 100,
      borderRadius: "50%",
      background: "white",
      display: "grid",
      placeItems: "center",
      boxShadow: "var(--shadow-lg)",
      position: "relative",
      transition: "transform .5s",
      transform: phase === 1 ? "scale(1.15)" : "scale(1)",
    }}
  >
    {phase === 0 && (
      <>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(255,88,100,.5)",
              animation: `tm-pulseRing 1.8s ${i * 0.6}s ease-out infinite`,
            }}
          />
        ))}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#FF5864 0%,#FD267A 100%)",
            display: "grid",
            placeItems: "center",
            color: "white",
            animation: "tm-orbit 2s linear infinite",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </>
    )}
    {phase >= 1 && (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#FF5864 0%,#FD267A 100%)",
          display: "grid",
          placeItems: "center",
          color: "white",
          animation: "tm-pulse 1.6s ease-in-out infinite",
        }}
      >
        {Icon.heart(28, "white")}
      </div>
    )}
  </div>
);
