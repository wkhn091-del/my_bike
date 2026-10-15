"use client";

import { useTransition, type FormEvent } from "react";

/**
 * Submits a form to a useActionState action without React's automatic form reset, so a
 * validation error or a dropped connection never wipes what the visitor typed.
 */
export function useSubmit(action: (formData: FormData) => void) {
  const [, start] = useTransition();
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    start(() => action(formData));
  };
}
