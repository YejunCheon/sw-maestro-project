"use client";

import { useEffect, useState } from "react";

import { type AvatarGradient, Btn, Card, Icon, Pill } from "@/components/ui";
import { type ChemistryMetric, type ConversationLine, SAMPLE_RESULT } from "@/lib/mock";

export type ChemistryResult = {
  score: number;
  oneliner: string;
  summary: string;
  metrics: ChemistryMetric[];
  good: string[];
  concerns: string[];
  finalLine: string;
};

export const ResultView = ({
  onRestart,
  onConnect,
  user,
  opponent,
  result = SAMPLE_RESULT,
  conversation = [],
}: {
  onRestart: () => void;
  onConnect: () => void;
  user?: { name?: string | null };
  opponent?: { name?: string | null };
  result?: ChemistryResult;
  conversation?: ConversationLine[];
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [showConversation, setShowConversation] = useState(false);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 1400;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(eased * result.score));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [result.score]);

  const A = {
    name: user?.name || "민준",
    char: (user?.name || "민준")[0],
    gradient: "coral" as AvatarGradient,
  };
  const opponentName = opponent?.name || "상대 분신";
  const B = { name: opponentName, char: opponentName[0], gradient: "sunset" as AvatarGradient };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 48px 96px" }}>
      <div className="tm-fade-up">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Pill tone="coral" size="sm">
            STEP 04 · 결과
          </Pill>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            주선자 AI가 20턴의 대화를 분석했습니다
          </div>
        </div>

        <Card
          pad={0}
          style={{
            overflow: "hidden",
            marginBottom: 24,
            border: "none",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            style={{
              padding: "48px 56px",
              background: "linear-gradient(135deg,#FF5864 0%,#FD267A 100%)",
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -60,
                top: -60,
                width: 280,
                height: 280,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,.18), transparent 70%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: -40,
                bottom: -80,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,.12), transparent 70%)",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: 48,
                alignItems: "center",
                position: "relative",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    opacity: 0.85,
                    fontWeight: 500,
                    marginBottom: 8,
                    letterSpacing: 0.4,
                  }}
                >
                  CHEMISTRY SCORE
                </div>
                <div
                  style={{
                    fontSize: 200,
                    lineHeight: 0.9,
                    fontWeight: 700,
                    letterSpacing: -10,
                    fontFeatureSettings: '"tnum"',
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                  }}
                >
                  {displayScore}
                  <span
                    style={{
                      fontSize: 56,
                      fontWeight: 400,
                      opacity: 0.7,
                      letterSpacing: 0,
                    }}
                  >
                    /100
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    marginTop: 16,
                    fontWeight: 500,
                    letterSpacing: -0.3,
                    lineHeight: 1.4,
                    maxWidth: 460,
                  }}
                >
                  {result.oneliner}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                <FaceCircle agent={A} />
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: "white",
                    display: "grid",
                    placeItems: "center",
                    margin: "0 -16px",
                    zIndex: 2,
                    boxShadow: "0 8px 24px rgba(0,0,0,.15)",
                  }}
                >
                  <span style={{ color: "var(--coral)" }}>{Icon.heart(36, "currentColor")}</span>
                </div>
                <FaceCircle agent={B} />
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card pad={28}>
              <SectionLabel>SUMMARY</SectionLabel>
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: "var(--ink)",
                  margin: "12px 0 0",
                  fontWeight: 500,
                  letterSpacing: -0.2,
                }}
              >
                {result.summary}
              </p>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card pad={24} style={{ background: "linear-gradient(180deg,#F0FBF4,white)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--ok)",
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {Icon.check(15)}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>잘 맞는 점</span>
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {result.good.map((g, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 13.5,
                        color: "var(--ink-soft)",
                        lineHeight: 1.55,
                        paddingLeft: 12,
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 9,
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "var(--ok)",
                        }}
                      />
                      {g}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card pad={24} style={{ background: "linear-gradient(180deg,#FFF8F0,white)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--warn)",
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    !
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>우려되는 점</span>
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {result.concerns.map((g, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 13.5,
                        color: "var(--ink-soft)",
                        lineHeight: 1.55,
                        paddingLeft: 12,
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 9,
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "var(--warn)",
                        }}
                      />
                      {g}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card
              pad={28}
              style={{ background: "var(--ink)", color: "white", border: "none" }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,.6)",
                  marginBottom: 10,
                  letterSpacing: 0.4,
                  fontWeight: 600,
                }}
              >
                ✦ 주선자 AI 한마디
              </div>
              <p
                style={{
                  fontSize: 22,
                  lineHeight: 1.5,
                  margin: 0,
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  letterSpacing: -0.3,
                }}
              >
                &ldquo;{result.finalLine}&rdquo;
              </p>
            </Card>

            {conversation.length > 0 && (
              <Card pad={28}>
                <button
                  type="button"
                  onClick={() => setShowConversation((open) => !open)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    color: "var(--ink)",
                  }}
                >
                  <div>
                    <SectionLabel>CONVERSATION</SectionLabel>
                    <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700 }}>
                      AI끼리 나눈 대화 다시보기
                    </div>
                  </div>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                      border: "1px solid var(--line)",
                      transform: showConversation ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform .2s",
                    }}
                  >
                    {Icon.arrowRight(16)}
                  </span>
                </button>

                {showConversation && (
                  <div
                    style={{
                      marginTop: 18,
                      maxHeight: 420,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      padding: "16px",
                      background: "var(--cream)",
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                    }}
                  >
                    {conversation.map((line, index) => (
                      <ResultConversationLine
                        key={`${line.agent}-${index}`}
                        line={line}
                        name={line.agent === "A" ? A.name : B.name}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card pad={28}>
              <SectionLabel>지표 분석</SectionLabel>
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {result.metrics.map((m, i) => (
                  <MetricBar key={m.label} {...m} delay={i * 0.15} />
                ))}
              </div>
            </Card>

            <Card
              pad={28}
              style={{
                background: "linear-gradient(135deg,#FFF4ED 0%,#FFE4D6 100%)",
                border: "1px solid rgba(255,88,100,.2)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--coral-deep)",
                  fontWeight: 700,
                  marginBottom: 8,
                  letterSpacing: 0.4,
                }}
              >
                READY TO MEET?
              </div>
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: 22,
                  letterSpacing: -0.5,
                  lineHeight: 1.2,
                  fontWeight: 700,
                }}
              >
                케미가 좋네요. 진짜로 만나볼래요?
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-soft)",
                  lineHeight: 1.55,
                  margin: "0 0 18px",
                }}
              >
                {B.name}님께 매칭 요청을 보냅니다. 상대방이 수락하면 채팅이 열려요.
              </p>
              <Btn variant="primary" size="lg" full onClick={onConnect} icon={Icon.heart(16, "white")}>
                매칭 요청 보내기
              </Btn>
              <Btn
                variant="ghost"
                size="md"
                full
                onClick={onRestart}
                style={{ marginTop: 8 }}
              >
                다른 분신과 매칭하기
              </Btn>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 13,
      fontWeight: 600,
      color: "var(--ink-soft)",
      letterSpacing: 0.2,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const ResultConversationLine = ({
  line,
  name,
}: {
  line: ConversationLine;
  name: string;
}) => {
  const me = line.agent === "A";
  return (
    <div
      style={{
        alignSelf: me ? "flex-end" : "flex-start",
        maxWidth: "78%",
        display: "flex",
        flexDirection: "column",
        alignItems: me ? "flex-end" : "flex-start",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--ink-mute)", fontWeight: 600 }}>
        {name}
      </div>
      <div
        style={{
          padding: "10px 13px",
          borderRadius: me ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: me ? "linear-gradient(135deg,#FF5864,#FD267A)" : "white",
          color: me ? "white" : "var(--ink)",
          border: me ? "none" : "1px solid var(--line)",
          fontSize: 13.5,
          lineHeight: 1.5,
        }}
      >
        {line.text}
      </div>
    </div>
  );
};

const FaceCircle = ({
  agent,
}: {
  agent: { name: string; char: string; gradient: AvatarGradient };
}) => (
  <div
    style={{
      width: 130,
      height: 130,
      borderRadius: "50%",
      background: "white",
      padding: 6,
      boxShadow: "0 8px 24px rgba(0,0,0,.15)",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background:
          agent.gradient === "coral"
            ? "linear-gradient(135deg,#FFE4D6 0%,#FF5864 100%)"
            : "linear-gradient(135deg,#FFD86F 0%,#FB6786 100%)",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: 64,
        letterSpacing: -1,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {agent.char}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,.5), transparent 50%)",
        }}
      />
    </div>
  </div>
);

const MetricBar = ({
  label,
  value,
  hint,
  delay,
}: {
  label: string;
  value: number;
  hint?: string;
  delay: number;
}) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 200 + delay * 1000);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFeatureSettings: '"tnum"',
            color: "var(--coral-deep)",
            letterSpacing: -0.5,
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "var(--cream-2)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            background: "linear-gradient(90deg,#FF5864,#FD267A)",
            transition: "width 1.2s cubic-bezier(.2,.8,.2,1)",
            borderRadius: 99,
          }}
        />
      </div>
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            marginTop: 6,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
};
