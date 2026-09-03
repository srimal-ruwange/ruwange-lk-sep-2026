import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { site } from "@/data/site";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Please add your name.").max(80),
  email: z.email("That email doesn't look right.").max(120),
  message: z.string().trim().min(10, "Tell me a little more about the project.").max(4000),
  _hp: z.string().optional(), // honeypot — bots fill it, browsers don't
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid submission.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
  const { name, email, message, _hp } = parsed.data;

  // Honeypot tripped: pretend it worked so the bot learns nothing, but send nothing.
  if (_hp) return NextResponse.json({ ok: true });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? `${site.name} <hello@ruwange.lk>`;
  if (!key || !to) {
    return NextResponse.json({ ok: false, error: "Email isn't configured yet. Please try again later." }, { status: 500 });
  }

  const resend = new Resend(key);

  const notify = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `New project enquiry — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\n— sent from ${site.url}`,
  });
  if (notify.error) {
    console.error("[contact] notify failed", notify.error);
    return NextResponse.json({ ok: false, error: "Couldn't send right now. Please try again in a moment." }, { status: 502 });
  }

  // Confirmation to the sender — best effort.
  try {
    await resend.emails.send({
      from,
      to: email,
      subject: `Got it — thanks, ${name.split(" ")[0]}`,
      text: `Hi ${name.split(" ")[0]},\n\nThanks for reaching out. I've received your message and will get back to you within a day (${site.city} time, ${site.utc}).\n\nYour message:\n${message}\n\n— ${site.name}\n${site.url}`,
    });
  } catch (err) {
    console.error("[contact] confirmation failed", err);
  }

  return NextResponse.json({ ok: true });
}
