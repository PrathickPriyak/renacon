import { NextResponse } from "next/server";
import { answerFromPublicKnowledge } from "@/lib/chatbot/engine";
import { CHAT_SUGGESTIONS } from "@/lib/chatbot/knowledge";

export const runtime = "nodejs";

const MAX_MESSAGE = 500;
const MAX_PATH = 200;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Read-only chatbot. Does not import Prisma or form submission modules. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const message = asString(record.message);
  const pagePath = asString(record.pagePath).slice(0, MAX_PATH);

  if (!message) {
    return NextResponse.json({ ok: false, error: "Enter a message" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ ok: false, error: "Message is too long" }, { status: 400 });
  }

  const result = answerFromPublicKnowledge(message, pagePath);
  return NextResponse.json({
    ok: true,
    reply: result.reply,
    links: result.links,
    suggestions: [...CHAT_SUGGESTIONS],
  });
}
