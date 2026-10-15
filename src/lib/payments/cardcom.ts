import "server-only";
import { z } from "zod";
import { serverEnv } from "@/lib/env/server";

/**
 * Cardcom v11 hosted payment page ("Low Profile"). Swagger checked 14.10.2026:
 * https://secure.cardcom.solutions/swagger/v11/swagger.json
 * The browser is redirected to Cardcom; card data never touches this server.
 */
const API = "https://secure.cardcom.solutions/api/v11/LowProfile";
const TIMEOUT_MS = 10_000;

export type CreatePageInput = {
  orderId: string;
  amountAgorot: number;
  description: string;
  buyer: { fullName: string; email: string; phone: string };
  successUrl: string;
  failedUrl: string;
  webhookUrl: string;
};

const createResponseSchema = z.object({
  ResponseCode: z.number(),
  Description: z.string().nullish(),
  LowProfileId: z.string().nullish(),
  Url: z.url().nullish(),
});

function credentials() {
  if (!serverEnv.CARDCOM_TERMINAL || !serverEnv.CARDCOM_API_NAME) throw new Error("Cardcom is not configured");
  return { TerminalNumber: serverEnv.CARDCOM_TERMINAL, ApiName: serverEnv.CARDCOM_API_NAME };
}

function shekels(agorot: number): number {
  return Math.round(agorot) / 100;
}

export async function createPaymentPage(input: CreatePageInput): Promise<{ lowProfileId: string; url: string }> {
  const amount = shekels(input.amountAgorot);
  const body = {
    ...credentials(),
    Operation: "ChargeOnly",
    ReturnValue: input.orderId,
    Amount: amount,
    SuccessRedirectUrl: input.successUrl,
    FailedRedirectUrl: input.failedUrl,
    CancelRedirectUrl: input.failedUrl,
    WebHookUrl: input.webhookUrl,
    ProductName: input.description.slice(0, 250),
    Language: "he",
    ISOCoinId: 1,
    UIDefinition: {
      CardOwnerNameValue: input.buyer.fullName.slice(0, 50),
      CardOwnerEmailValue: input.buyer.email.slice(0, 50),
      CardOwnerPhoneValue: input.buyer.phone.slice(0, 50),
      IsHideCardOwnerIdentityNumber: false,
    },
    Document: {
      DocumentTypeToCreate: "TaxInvoiceAndReceipt",
      Name: input.buyer.fullName.slice(0, 50),
      Email: input.buyer.email,
      Mobile: input.buyer.phone,
      IsSendByEmail: true,
      Products: [{ Description: input.description.slice(0, 250), UnitCost: amount, Quantity: 1 }],
    },
  };

  const response = await fetch(`${API}/Create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const parsed = createResponseSchema.parse(await response.json());
  if (parsed.ResponseCode !== 0 || !parsed.LowProfileId || !parsed.Url) {
    throw new Error(`Cardcom Create failed: ${parsed.ResponseCode} ${parsed.Description ?? ""}`.trim());
  }
  if (!parsed.Url.startsWith("https://secure.cardcom.solutions/")) {
    throw new Error("Cardcom returned an unexpected payment URL host");
  }
  return { lowProfileId: parsed.LowProfileId, url: parsed.Url };
}

const resultSchema = z.object({
  ResponseCode: z.number(),
  Description: z.string().nullish(),
  LowProfileId: z.string().nullish(),
  TranzactionId: z.number().nullish(),
  ReturnValue: z.string().nullish(),
  TranzactionInfo: z
    .object({
      ResponseCode: z.number().nullish(),
      TranzactionId: z.number().nullish(),
      Amount: z.number().nullish(),
      IsRefund: z.boolean().nullish(),
    })
    .nullish(),
});

export type VerifiedPayment = {
  orderId: string;
  lowProfileId: string;
  transactionId: number | null;
  amountAgorot: number;
};

export const LOW_PROFILE_ID = /^[0-9a-fA-F-]{36}$/;

/**
 * The only source of truth for "paid": a server-to-server read from Cardcom.
 * Webhook bodies and redirect query strings are never trusted for status or amount.
 */
export async function fetchPaymentResult(lowProfileId: string): Promise<VerifiedPayment | null> {
  if (!LOW_PROFILE_ID.test(lowProfileId)) return null;
  const response = await fetch(`${API}/GetLpResult`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials(), LowProfileId: lowProfileId }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const parsed = resultSchema.parse(await response.json());
  const info = parsed.TranzactionInfo;
  const approved =
    parsed.ResponseCode === 0 && (info?.ResponseCode ?? 0) === 0 && !info?.IsRefund && typeof info?.Amount === "number";
  if (!approved || !parsed.ReturnValue) return null;
  return {
    orderId: parsed.ReturnValue,
    lowProfileId,
    transactionId: info?.TranzactionId ?? parsed.TranzactionId ?? null,
    amountAgorot: Math.round((info?.Amount ?? 0) * 100),
  };
}
