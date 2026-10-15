export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert">
      {message}
    </p>
  );
}

/** Focus the first invalid field and shake it once (A-3); reduced motion keeps the focus only. */
export function focusFirstError(form: HTMLFormElement | null, fieldNames: string[]) {
  if (!form) return;
  for (const name of fieldNames) {
    const field = form.querySelector<HTMLElement>(`[name="${CSS.escape(name)}"]`);
    if (!field) continue;
    field.focus();
    const target = field.closest<HTMLElement>("[data-field]") ?? field;
    target.classList.remove("shake");
    void target.offsetWidth;
    target.classList.add("shake");
    return;
  }
}
