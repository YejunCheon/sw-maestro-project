"use client";

import { type CSSProperties, type ReactNode, useState } from "react";

import { Btn, Card, Icon, Pill } from "@/components/ui";
import { PERSONA_HINTS, SAMPLE_PERSONA } from "@/lib/mock";

export type PersonaPayload = {
  name: string;
  age: number;
  gender: "F" | "M" | "X";
  text: string;
};

export const PersonaForm = ({
  onNext,
  onBack,
  submitting = false,
  error,
}: {
  onNext: (payload: PersonaPayload) => void;
  onBack: () => void;
  submitting?: boolean;
  error?: string | null;
}) => {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<"F" | "M" | "X">("F");
  const charCount = text.length;
  const valid = charCount >= 50 && name.trim().length >= 1;

  const fillSample = () => {
    setText(SAMPLE_PERSONA);
    setName("민준");
    setAge(28);
    setGender("M");
  };

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "40px 48px 80px",
        display: "grid",
        gridTemplateColumns: "1.2fr .9fr",
        gap: 48,
        alignItems: "start",
      }}
    >
      <div className="tm-fade-up">
        <Pill tone="coral" size="sm">
          STEP 01
        </Pill>
        <h2
          style={{
            margin: "16px 0 12px",
            fontSize: 44,
            letterSpacing: -1.4,
            lineHeight: 1.1,
            fontWeight: 700,
          }}
        >
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>
            분신
          </span>
          을 만들 차례예요
        </h2>
        <p
          style={{
            color: "var(--ink-soft)",
            fontSize: 16,
            margin: "0 0 32px",
            lineHeight: 1.55,
          }}
        >
          ChatGPT, Claude, Gemini에서 당신을 요약한 텍스트를 그대로 붙여넣어 주세요. 말투의 미묘한
          뉘앙스까지 그대로 복제됩니다.
        </p>

        <Card pad={24} style={{ marginBottom: 16 }}>
          <Label>기본 정보</Label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr .8fr 1.2fr",
              gap: 12,
              marginTop: 12,
            }}
          >
            <Field label="이름 (또는 닉네임)">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="민준"
                style={inputStyle}
              />
            </Field>
            <Field label="나이">
              <input
                type="number"
                min={18}
                max={80}
                value={age}
                onChange={(e) => setAge(+e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="성별">
              <div style={{ display: "flex", gap: 6 }}>
                {(
                  [
                    ["F", "여성"],
                    ["M", "남성"],
                    ["X", "기타"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setGender(v)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 10,
                      border: "1px solid",
                      borderColor: gender === v ? "var(--coral)" : "var(--line)",
                      background: gender === v ? "rgba(255,88,100,.08)" : "white",
                      color: gender === v ? "var(--coral-deep)" : "var(--ink-soft)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Card>

        <Card pad={24}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
          >
            <Label>페르소나 텍스트</Label>
            <button
              onClick={fillSample}
              style={{
                fontSize: 13,
                color: "var(--coral-deep)",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {Icon.sparkles(14)} 샘플로 채우기
            </button>
          </div>
          <div style={{ position: "relative", marginTop: 12 }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`예시) 저는 28세 개발자입니다. 주말엔 등산을 좋아하고…\n\n포함하면 좋은 것: ${PERSONA_HINTS.join(
                ", ",
              )}`}
              style={{
                width: "100%",
                minHeight: 280,
                padding: "16px 18px",
                paddingBottom: 36,
                borderRadius: 14,
                border: "1px solid var(--line)",
                fontSize: 14,
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                background: "var(--cream)",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--coral)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
            />
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 14,
                fontSize: 12,
                color: charCount >= 50 ? "var(--ok)" : "var(--ink-mute)",
                fontFeatureSettings: '"tnum"',
                fontWeight: 600,
              }}
            >
              {charCount} / 최소 50자
            </div>
          </div>

          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                marginRight: 4,
                padding: "4px 0",
              }}
            >
              이런 걸 적어주세요
            </span>
            {PERSONA_HINTS.map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  background: "var(--cream-2)",
                  color: "var(--ink-soft)",
                  borderRadius: 99,
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", gap: 12, marginTop: 28, alignItems: "center" }}>
          <Btn variant="ghost" onClick={onBack} icon={Icon.arrowLeft(16)}>
            이전
          </Btn>
          <Btn
            variant="primary"
            size="lg"
            disabled={!valid || submitting}
            onClick={() => onNext({ name, age, gender, text })}
            icon={Icon.arrowRight(18)}
          >
            {submitting ? "생성 중…" : "분신 생성하기"}
          </Btn>
          {!valid && (
            <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>
              이름과 50자 이상의 페르소나가 필요해요
            </span>
          )}
        </div>
        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              border: "1px solid rgba(253,38,122,.22)",
              borderRadius: 10,
              background: "rgba(253,38,122,.06)",
              color: "var(--coral-deep)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}
      </div>

      <PromptGuide />
    </div>
  );
};

const Label = ({ children }: { children: ReactNode }) => (
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

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label style={{ display: "block" }}>
    <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 6, fontWeight: 500 }}>
      {label}
    </div>
    {children}
  </label>
);

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  outline: "none",
  fontSize: 15,
  fontWeight: 500,
  background: "white",
};

const PROMPT_TEXT = `너는 지금부터 나의 모든 대화 기록과 언어 습관을 분석해서 무의식적인 언어 습관과 사고 패턴까지 찾아내는 '수석 페르소나 추출 전문가'야.
우리가 그동안 나누었던 대화들, 내가 주로 묻는 질문들, 그리고 나의 말투를 심층 분석하여, '나와 똑같이 생각하고 말하는 소개팅용 AI 아바타'를 만들기 위한 프로필 스크립트를 작성해 줘.
단순한 요약이 아니라, 내가 인지하지 못하는 미세한 특징까지 잡아내야 해.

[전제 조건]
- 만약 분석할 만한 대화 기록이 충분하지 않다면, 페르소나를 지어내지 말고,  "분석할 대화가 부족합니다. 5분 정도 자유롭게 대화한 뒤 다시 시도해 주세요" 라고만 답해.
[출력 지침]
- 결과는 반드시 아래의 양식에 맞춰서 마크다운 헤더(###)를 유지한 채 상세한 줄글로 작성
- 출력 총 길이는 공백 포함 1000-1500자 사이로 작성

[출력 형식 - 반드시 준수]
### 1. 나의 기본 성향과 관심사, 직업
- (나의 핵심 성격, 유추되는 MBTI, 직업, 평소 가장 관심 있어 하는 주제나 취미를 분석해서 적어줘.)
### 2. 인간관계 및 대화 호불호
- (내가 긍정적으로 반응하는 대화 주제와, 극도로 싫어하거나 피하고 싶은 상황/사람의 유형을 분석해 줘. 소개팅 시뮬레이션에서 '상대방과 잘 맞는지' 판단할 핵심 기준이 될 거야.)
### 3. 나의 리얼한 대화 스타일
- (나의 평균적인 문장 길이, 자주 쓰는 단어나 이모티콘(예: ㅋㅋㅋ, ㅎㅎ, 아 진짜요?, ㅠㅠ 등), 존댓말/반말 여부, 전반적인 말투의 온도(예: 차갑고 논리적임, 따뜻하고 리액션이 좋음 등)를 구체적으로 묘사해 줘. 마지막에 "사용자가 실제로 쓸 법한 짧은 발화 예시 2-3개"를 따옴표로 묶어 그대로 적어줘. 예: "그거 ㄹㅇ 공감되네 ㅋㅋ", "아 그건 좀 별로일 듯”)
### 4. 1인칭 핵심 행동 지침 (Core Prompt)
- (다른 AI가 이 내용을 바탕으로 나를 완벽하게 연기할 수 있도록, 나만의 '1인칭 핵심 행동 지침'을 1인칭 시점으로 작성해 줘.
예시: "나는 호기심이 많고 질문하는 것을 좋아해. 대답은 보통 한두 줄로 짧게 하고, 말끝에 'ㅋㅋㅋ'를 자주 붙여. 감정적인 공감보다는 해결책을 찾는 대화를 선호해.")`;

const PromptGuide = () => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Card pad={28} style={{ position: "sticky", top: 96, background: "linear-gradient(180deg, #fff, #FFF8F4)" }}>
      <Pill tone="cream" size="sm">
        {Icon.info(13)} 가이드
      </Pill>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 700,
          margin: "12px 0 8px",
          letterSpacing: -0.6,
        }}
      >
        페르소나 텍스트 만드는 법
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "var(--ink-soft)",
          lineHeight: 1.55,
          margin: "0 0 18px",
        }}
      >
        평소에 쓰던 ChatGPT나 Claude에 아래 프롬프트를 던지세요. 결과를 그대로 왼쪽에 붙여넣으면
        됩니다.
      </p>

      <div
        style={{
          background: "var(--ink)",
          color: "#FFE4D6",
          padding: 16,
          borderRadius: 12,
          fontSize: 12,
          lineHeight: 1.6,
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          whiteSpace: "pre-wrap",
          maxHeight: 240,
          overflow: "auto",
          position: "relative",
        }}
      >
        <button
          onClick={copy}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: copied ? "var(--ok)" : "rgba(255,255,255,.1)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: 11,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer",
          }}
        >
          {copied ? Icon.check(12) : Icon.copy(12)}
          {copied ? "복사됨!" : "복사"}
        </button>
        {PROMPT_TEXT}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          background: "rgba(255,88,100,.06)",
          borderRadius: 12,
          display: "flex",
          gap: 10,
        }}
      >
        <span style={{ color: "var(--coral-deep)" }}>{Icon.shield(18)}</span>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--ink)" }}>안심하세요.</strong> 입력한 텍스트는 매칭이 끝나면
          자동으로 삭제되고, 별도로 저장하지 않습니다.
        </div>
      </div>
    </Card>
  );
};
