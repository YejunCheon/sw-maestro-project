"use client";

import { Btn, Card, Icon, Pill } from "@/components/ui";

export const Landing = ({ onStart }: { onStart: () => void }) => (
  <div style={{ minHeight: "calc(100vh - 72px)" }}>
    {/* Hero */}
    <section
      style={{
        padding: "80px 48px 64px",
        maxWidth: 1280,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
        gap: 64,
        alignItems: "center",
      }}
    >
      <div className="tm-fade-up">
        <Pill tone="coral" size="md" icon={<span style={{ fontSize: 14 }}>✦</span>}>
          AI가 먼저 만나보는 소개팅
        </Pill>
        <h1
          style={{
            margin: "20px 0 24px",
            fontSize: 76,
            lineHeight: 1.02,
            letterSpacing: -2.5,
            fontWeight: 700,
          }}
        >
          만나기 전에,
          <br />
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
              background: "linear-gradient(135deg,#FF5864 0%,#FD267A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            나의 분신
          </span>
          이<br />
          먼저 대화해봐요
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.6,
            color: "var(--ink-soft)",
            margin: "0 0 36px",
            maxWidth: 520,
          }}
        >
          프로필만 보고 만나는 시대는 끝났어요. 내 말투와 성격을 그대로 복제한 AI가 상대방 AI와 먼저
          20턴을 나눠보고, 진짜 케미가 맞을 때 사람을 연결해드립니다.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Btn variant="primary" size="xl" onClick={onStart} icon={Icon.arrowRight(20)}>
            내 분신 만들기
          </Btn>
          <Btn variant="ghost" size="xl">
            어떻게 작동해요?
          </Btn>
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            marginTop: 40,
            color: "var(--ink-mute)",
            fontSize: 13,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--ok)" }}>{Icon.check(16)}</span>
            회원가입 없이 시작
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--ok)" }}>{Icon.check(16)}</span>
            내 정보는 저장 안 됨
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--ok)" }}>{Icon.check(16)}</span>
            30초면 결과 확인
          </div>
        </div>
      </div>

      <div style={{ position: "relative", height: 560 }}>
        <HeroVisual />
      </div>
    </section>

    {/* Step indicator */}
    <section style={{ padding: "48px 48px 96px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          {
            n: "01",
            t: "내 분신 만들기",
            d: "기존에 쓰던 ChatGPT나 Claude에 프롬프트를 던져 자기 요약을 받고, 여기에 붙여넣기만 하면 끝.",
          },
          {
            n: "02",
            t: "랜덤 매칭",
            d: "지금 접속한 다른 분신 중에서 한 명과 자동으로 짝지어집니다. 외모는 변수에서 빼두고요.",
          },
          {
            n: "03",
            t: "AI끼리 대화",
            d: "두 분신이 20턴 동안 자연스럽게 톡을 주고받습니다. 옆에서 실시간으로 지켜볼 수 있어요.",
          },
          {
            n: "04",
            t: "케미 결과",
            d: "주선자 AI가 점수와 함께 잘 맞는 점, 우려되는 점을 카드로 정리해드립니다.",
          },
        ].map((s) => (
          <Card
            key={s.n}
            pad={24}
            style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 200 }}
          >
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 32,
                color: "var(--coral)",
                lineHeight: 1,
              }}
            >
              {s.n}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>{s.t}</div>
            <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55 }}>{s.d}</div>
          </Card>
        ))}
      </div>
    </section>
  </div>
);

const HeroVisual = () => (
  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
    <div
      style={{
        position: "absolute",
        width: 480,
        height: 480,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 30% 30%, rgba(255,88,100,.35), transparent 60%)",
        filter: "blur(40px)",
        animation: "tm-bob 6s ease-in-out infinite",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: 20,
        top: 80,
        width: 320,
        height: 320,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 70% 70%, rgba(253,38,122,.25), transparent 60%)",
        filter: "blur(40px)",
      }}
    />

    <div style={{ position: "relative", width: 460, height: 480 }}>
      <PersonaCard
        style={{ left: 0, top: 30, transform: "rotate(-6deg)" }}
        name="민준"
        age={28}
        job="개발자"
        gradient="coral"
        tags={["#INTP", "#필름카메라", "#등산"]}
        line="조용하고 깊이 있는 대화 좋아함"
      />
      <PersonaCard
        style={{ right: 0, top: 90, transform: "rotate(5deg)" }}
        name="서연"
        age={26}
        job="마케터"
        gradient="sunset"
        tags={["#ENFP", "#전시", "#카페"]}
        line="새로운 사람 만나는 게 즐거움"
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "white",
          display: "grid",
          placeItems: "center",
          boxShadow: "var(--shadow-lg)",
          zIndex: 2,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(255,88,100,.45)",
              animation: `tm-pulseRing 2.4s ${i * 0.8}s ease-out infinite`,
            }}
          />
        ))}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#FF5864 0%,#FD267A 100%)",
            display: "grid",
            placeItems: "center",
            color: "white",
            animation: "tm-pulse 2.4s ease-in-out infinite",
          }}
        >
          {Icon.heart(28, "white")}
        </div>
      </div>

      <ChatBubble side="left" text="등산 좋아하세요?" delay={0} pos={{ left: 30, top: 230 }} />
      <ChatBubble
        side="right"
        text="오ㅎㅎ 둘레길 추천!"
        delay={1.2}
        pos={{ right: 30, top: 270 }}
      />
      <ChatBubble side="left" text="필름카메라도 같이…" delay={2.4} pos={{ left: 60, top: 320 }} />
    </div>
  </div>
);

const PersonaCard = ({
  style,
  name,
  age,
  job,
  gradient,
  tags,
  line,
}: {
  style?: React.CSSProperties;
  name: string;
  age: number;
  job: string;
  gradient: "coral" | "sunset";
  tags: string[];
  line: string;
}) => (
  <div
    style={{
      position: "absolute",
      width: 220,
      padding: 18,
      background: "white",
      border: "1px solid var(--line)",
      borderRadius: 24,
      boxShadow: "var(--shadow-md)",
      ...style,
    }}
  >
    <div
      style={{
        width: "100%",
        aspectRatio: "1/1",
        borderRadius: 18,
        background:
          gradient === "coral"
            ? "linear-gradient(135deg,#FFE4D6 0%,#FF5864 100%)"
            : "linear-gradient(135deg,#FFD86F 0%,#FB6786 100%)",
        display: "grid",
        placeItems: "center",
        color: "white",
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: 80,
        letterSpacing: -2,
        marginBottom: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {name[0]}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 30% 25%, rgba(255,255,255,.5), transparent 50%)",
        }}
      />
    </div>
    <div style={{ fontSize: 16, fontWeight: 700 }}>
      {name}{" "}
      <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>
        · {age} · {job}
      </span>
    </div>
    <div
      style={{
        fontSize: 13,
        color: "var(--ink-soft)",
        margin: "6px 0 10px",
        lineHeight: 1.4,
      }}
    >
      {line}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {tags.map((t, index) => (
        <span
          key={`tag-${index}-${t}`}
          style={{
            fontSize: 11,
            color: "var(--coral-deep)",
            background: "rgba(255,88,100,.1)",
            padding: "3px 8px",
            borderRadius: 99,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  </div>
);

const ChatBubble = ({
  side,
  text,
  delay,
  pos,
}: {
  side: "left" | "right";
  text: string;
  delay: number;
  pos: React.CSSProperties;
}) => (
  <div
    style={{
      position: "absolute",
      ...pos,
      background: side === "left" ? "white" : "var(--ink)",
      color: side === "left" ? "var(--ink)" : "white",
      border: side === "left" ? "1px solid var(--line)" : "none",
      padding: "10px 14px",
      borderRadius: side === "left" ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
      fontSize: 13,
      fontWeight: 500,
      boxShadow: "var(--shadow-sm)",
      animation: `tm-fadeUp .6s ${delay}s both, tm-bob 4s ${delay}s ease-in-out infinite`,
      zIndex: 3,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);
