import { useEffect, useRef, useState } from "react";
import { useAskAssistant } from "@/hooks/queries";
import { ProvenanceTag } from "@/components/badges";
import { cx } from "@/lib/format";
import { IconSpark, IconSend, IconShield, IconExcavator } from "@/components/icons";
import type { AssistantResponse } from "@/api/types";

interface Msg {
  role: "user" | "assistant";
  text: string;
  meta?: AssistantResponse;
}

const SUGGESTIONS = [
  "Why is my task delayed?",
  "Is my machine behaving normally?",
  "How much fuel have I used today?",
  "Show me today's safety events",
  "What happened during the previous shift?",
];

export default function Assistant() {
  const ask = useAskAssistant();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "I'm your operator assistant. I answer only from live backend facts — task ETA, machine health, fuel, safety alerts and shift handover. If I don't have the data, I'll say so rather than guess.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, ask.isPending]);

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || ask.isPending) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    try {
      const res = await ask.mutateAsync(question);
      setMessages((m) => [...m, { role: "assistant", text: res.answer, meta: res }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "I couldn't reach the backend to answer that. Safety monitoring is unaffected." },
      ]);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-cat/15 text-cat">
          <IconSpark />
        </span>
        <div>
          <h2 className="h-display text-xl text-fg">AI Operator Assistant</h2>
          <p className="flex items-center gap-1.5 text-xs text-fg-muted">
            <IconShield width={13} height={13} className="text-ok" /> Grounded in backend facts · never invents telemetry
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="panel flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
        {ask.isPending && (
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cat/15 text-cat"><IconSpark width={16} height={16} /></span>
            <span className="flex gap-1">
              <Dot /> <Dot d={150} /> <Dot d={300} />
            </span>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="chip border border-line bg-ink-600 text-fg-muted normal-case tracking-normal transition-colors hover:border-cat/40 hover:text-fg">
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2 rounded-2xl border border-line bg-ink-700 p-2 focus-within:border-cat/40"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your task, machine, fuel or safety…"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:outline-none"
        />
        <button className="btn-primary px-3.5 py-2.5" disabled={!input.trim() || ask.isPending} aria-label="Send">
          <IconSend width={18} height={18} />
        </button>
      </form>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cx("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cx(
          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          isUser ? "bg-ink-500 text-fg-muted" : "bg-cat/15 text-cat",
        )}
      >
        {isUser ? <IconExcavator width={16} height={16} /> : <IconSpark width={16} height={16} />}
      </span>
      <div className={cx("max-w-[80%]", isUser && "text-right")}>
        <div
          className={cx(
            "inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser ? "bg-cat text-ink-900" : "border border-line bg-ink-600/70 text-fg",
          )}
        >
          {msg.text}
        </div>
        {msg.meta && (
          <div className={cx("mt-2 flex flex-wrap items-center gap-2", isUser && "justify-end")}>
            <span className={cx("chip", msg.meta.grounded ? "bg-ok/12 text-ok" : "bg-sev-warning/12 text-sev-warning")}>
              {msg.meta.grounded ? "Grounded" : "No data"}
            </span>
            <ProvenanceTag provenance={msg.meta.provenance} />
            {msg.meta.facts_used.map((f, i) => (
              <span key={i} className="chip border border-line bg-ink-700 font-mono text-[10px] normal-case tracking-normal text-fg-muted">
                {f.tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ d = 0 }: { d?: number }) {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-faint" style={{ animationDelay: `${d}ms` }} />;
}
