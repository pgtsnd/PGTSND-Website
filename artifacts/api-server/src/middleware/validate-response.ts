import type { Response } from "express";

export function validateAndSend(res: Response, schema: { safeParse: (data: unknown) => { success: boolean; data?: unknown; error?: { issues: unknown[] } } }, data: unknown, statusCode = 200) {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error("Response validation failed:", result.error?.issues);
    res.status(500).json({ error: "Internal server error: response validation failed" });
    return;
  }
  res.status(statusCode).json(result.data);
}

export function validateAndSendArray(res: Response, schema: { safeParse: (data: unknown) => { success: boolean; data?: unknown; error?: { issues: unknown[] } } }, data: unknown[], statusCode = 200) {
  const validated: unknown[] = [];
  for (const item of data) {
    const result = schema.safeParse(item);
    if (!result.success) {
      console.error("Response validation failed:", result.error?.issues);
      res.status(500).json({ error: "Internal server error: response validation failed" });
      return;
    }
    validated.push(result.data);
  }
  res.status(statusCode).json(validated);
}
