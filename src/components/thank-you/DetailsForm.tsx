"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { detailsAction, type DetailsState } from "@/app/thank-you/[token]/actions";
import { FieldError, focusFirstError } from "@/components/forms/FieldError";
import { useSubmit } from "@/components/forms/useSubmit";
import { ageOn } from "@/lib/format";

export type ParticipantDefaults = {
  fullName: string;
  phone: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
};

type Props = {
  token: string;
  quantity: number;
  eventDate: string;
  bikeType: string;
  participants: ParticipantDefaults[];
};

/** Server keys look like "participants.1.birthDate"; inputs are named "p2_birthDate". */
function toFieldName(key: string): string {
  const match = /^participants\.(\d+)\.(\w+)$/.exec(key);
  return match ? `p${Number(match[1]) + 1}_${match[2]}` : key;
}

function RiderFields({ index, defaults, eventDate, errors }: { index: number; defaults: ParticipantDefaults; eventDate: string; errors: Record<string, string> }) {
  const n = index + 1;
  const [birthDate, setBirthDate] = useState(defaults.birthDate);
  const minor = /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && ageOn(birthDate, eventDate) < 18;
  const error = (field: string) => errors[`p${n}_${field}`];

  return (
    <fieldset className="grid gap-4 rounded-lg border border-line p-5">
      <legend className="px-2 text-h3">{index === 0 ? "הפרטים שלך" : `רוכב/ת ${n}`}</legend>
      <div data-field>
        <label htmlFor={`p${n}_fullName`} className="field-label">
          שם מלא
        </label>
        <input id={`p${n}_fullName`} name={`p${n}_fullName`} defaultValue={defaults.fullName} autoComplete={index === 0 ? "name" : "off"} maxLength={80} className="field-input" aria-invalid={Boolean(error("fullName"))} />
        <FieldError id={`p${n}_fullName-error`} message={error("fullName")} />
      </div>
      {index > 0 ? (
        <div data-field>
          <label htmlFor={`p${n}_phone`} className="field-label">
            טלפון נייד
          </label>
          <input id={`p${n}_phone`} name={`p${n}_phone`} type="tel" inputMode="tel" dir="ltr" defaultValue={defaults.phone} maxLength={20} className="field-input text-end" aria-invalid={Boolean(error("phone"))} />
          <FieldError id={`p${n}_phone-error`} message={error("phone")} />
        </div>
      ) : (
        <input type="hidden" name={`p${n}_phone`} value="" />
      )}
      <div data-field>
        <label htmlFor={`p${n}_birthDate`} className="field-label">
          תאריך לידה
        </label>
        <input
          id={`p${n}_birthDate`}
          name={`p${n}_birthDate`}
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          className="field-input"
          aria-invalid={Boolean(error("birthDate"))}
        />
        <p className="field-hint">ההשתתפות מגיל 16. מתחת ל-18 צריך אישור הורה.</p>
        <FieldError id={`p${n}_birthDate-error`} message={error("birthDate")} />
      </div>
      {minor ? (
        <div className="fade-up grid gap-4 rounded-md bg-cream-deep p-4">
          <p className="font-semibold">רוכב/ת מתחת לגיל 18: נשלח להורה קישור לאישור. בלי אישור הורה לא ניתן להשתתף.</p>
          <div data-field>
            <label htmlFor={`p${n}_parentName`} className="field-label">
              שם ההורה
            </label>
            <input id={`p${n}_parentName`} name={`p${n}_parentName`} defaultValue={defaults.parentName} maxLength={80} className="field-input" />
          </div>
          <div data-field>
            <label htmlFor={`p${n}_parentPhone`} className="field-label">
              טלפון ההורה
            </label>
            <input id={`p${n}_parentPhone`} name={`p${n}_parentPhone`} type="tel" inputMode="tel" dir="ltr" defaultValue={defaults.parentPhone} maxLength={20} className="field-input text-end" aria-invalid={Boolean(error("parentPhone"))} />
            <FieldError id={`p${n}_parentPhone-error`} message={error("parentPhone")} />
          </div>
          <div data-field>
            <label htmlFor={`p${n}_parentEmail`} className="field-label">
              מייל ההורה
            </label>
            <input id={`p${n}_parentEmail`} name={`p${n}_parentEmail`} type="email" inputMode="email" dir="ltr" defaultValue={defaults.parentEmail} maxLength={120} className="field-input text-end" aria-invalid={Boolean(error("parentEmail"))} />
            <FieldError id={`p${n}_parentEmail-error`} message={error("parentEmail")} />
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}

export function DetailsForm({ token, quantity, eventDate, bikeType, participants }: Props) {
  const [state, action, pending] = useActionState<DetailsState, FormData>(detailsAction, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = useSubmit(action);
  const errors: Record<string, string> = {};
  if (state.status === "invalid") {
    for (const [key, message] of Object.entries(state.fieldErrors)) errors[toFieldName(key)] = message;
  }

  useEffect(() => {
    if (state.status !== "invalid") return;
    const names = Object.keys(state.fieldErrors).map(toFieldName);
    focusFirstError(formRef.current, names);
  }, [state]);

  if (state.status === "ok") {
    return (
      <div role="status" className="fade-up rounded-lg bg-cream-deep p-6">
        <p className="text-lead font-semibold">הפרטים נשמרו. נתראה על האופניים!</p>
        {state.minorsNotified ? <p className="mt-2">שלחנו להורה קישור לאישור. בלי אישור הורה לא ניתן להשתתף.</p> : null}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-6">
      <input type="hidden" name="token" value={token} />
      <div data-field>
        <label htmlFor="bikeType" className="field-label">
          על אילו אופניים תגיעו?
        </label>
        <input id="bikeType" name="bikeType" defaultValue={bikeType} maxLength={60} placeholder="כביש / גראבל / שטח" className="field-input" aria-invalid={Boolean(errors.bikeType)} />
        <FieldError id="bikeType-error" message={errors.bikeType} />
      </div>
      {Array.from({ length: quantity }, (_, index) => (
        <RiderFields
          key={index}
          index={index}
          eventDate={eventDate}
          errors={errors}
          defaults={participants[index] ?? { fullName: "", phone: "", birthDate: "", parentName: "", parentPhone: "", parentEmail: "" }}
        />
      ))}
      {state.status === "error" ? (
        <p role="alert" className="field-error">
          {state.message}
        </p>
      ) : null}
      <button type="submit" className="btn-secondary min-h-14 w-full text-body" disabled={pending}>
        {pending ? "שומרים..." : "לשמירת הפרטים"}
      </button>
    </form>
  );
}
