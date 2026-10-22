"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/analytics/track";

type Props = {
  firstName: string;
  seat: number;
  capacity: number;
  eventTitle: string;
  dateLabel: string;
  region: string;
  shareText: string;
};

function cssFont(variable: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

/** Story-sized PNG (1080×1920). Drawn in the browser so Hebrew shaping and RTL are correct. */
async function drawStory(props: Props): Promise<Blob> {
  await document.fonts.ready;
  const display = cssFont("--font-secular", "sans-serif");
  const body = cssFont("--font-heebo", "sans-serif");
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  ctx.fillStyle = "#36452A";
  ctx.fillRect(0, 0, 1080, 1920);

  const x = 120;
  const y = 460;
  const w = 840;
  const h = 900;
  ctx.fillStyle = "#F4EDE0";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 40);
  ctx.fill();
  ctx.fillStyle = "#36452A";
  for (const [cx, cy] of [
    [x + 60, y + 60],
    [x + w - 60, y + 60],
    [x + 60, y + h - 60],
    [x + w - 60, y + h - 60],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = "#4A5D3A";
  ctx.font = `400 64px ${display}`;
  ctx.fillText(props.eventTitle, 540, y + 170);

  ctx.fillStyle = "#1F211C";
  ctx.font = `400 360px ${display}`;
  ctx.fillText(String(props.seat), 540, y + 560);

  ctx.font = `700 72px ${body}`;
  ctx.fillText(props.firstName, 540, y + 700);

  ctx.fillStyle = "#4A4C45";
  ctx.font = `500 44px ${body}`;
  ctx.fillText(`${props.dateLabel} · ${props.region}`, 540, y + 790);

  ctx.fillStyle = "#F4EDE0";
  ctx.font = `400 84px ${display}`;
  ctx.fillText("אני בפנים!", 540, 300);
  ctx.direction = "ltr";
  ctx.font = `800 56px ${body}`;
  ctx.fillText("RideWithYoav", 540, 1620);
  ctx.direction = "rtl";
  ctx.font = `500 40px ${body}`;
  ctx.fillText(`מקום ${props.seat} מתוך ${props.capacity}`, 540, 1700);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png"));
}

export function Bib(props: Props) {
  const [toast, setToast] = useState<string | null>(null);

  async function saveStory() {
    try {
      const blob = await drawStory(props);
      const file = new File([blob], `ridewithyoav-${props.seat}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      track({ name: "share", method: "story" });
      setToast("התמונה נשמרה");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setToast("לא הצלחנו ליצור את התמונה. אפשר לצלם מסך");
    }
  }

  return (
    <div>
      <div className="bib-in relative mx-auto max-w-sm rounded-lg border-2 border-charcoal bg-cream p-8 text-center shadow-soft">
        {["top-4 start-4", "top-4 end-4", "bottom-4 start-4", "bottom-4 end-4"].map((position) => (
          <span key={position} className={`absolute size-3 rounded-full bg-olive-deep ${position}`} aria-hidden="true" />
        ))}
        <p className="font-display text-lead text-olive-deep">{props.eventTitle}</p>
        <p className="font-display text-[7rem] leading-none" aria-label={`מספר ${props.seat}`}>
          <bdi>{props.seat}</bdi>
        </p>
        <p className="mt-2 text-h3 font-bold">{props.firstName}</p>
        <p className="text-small text-charcoal-soft">
          <bdi>{props.dateLabel}</bdi> · {props.region}
        </p>
      </div>

      <p className="mt-6 flex items-center justify-center gap-3 text-lead">
        <span className="fill-in inline-block size-5 rounded-full bg-olive" aria-hidden="true" />
        המקום שלך: <bdi>{props.seat}</bdi> מתוך <bdi>{props.capacity}</bdi>
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={saveStory} className="btn-secondary">
          <Icon name="download" className="size-5" />
          לשמירת המספר לסטורי
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(props.shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          onClick={() => track({ name: "share", method: "whatsapp" })}
        >
          <Icon name="share" className="size-5" />
          לשיתוף בוואטסאפ
          <span className="sr-only"> (נפתח בחלון חדש)</span>
        </a>
        <a href="/api/ics" download className="btn-secondary" onClick={() => track({ name: "share", method: "calendar" })}>
          <Icon name="calendar" className="size-5" />
          להוספה ליומן
        </a>
      </div>
      {toast ? (
        <p role="status" className="fade-up mt-3 text-center text-small font-semibold">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
