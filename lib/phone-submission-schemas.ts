import { z } from "zod";

export const phoneSubmissionBatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        submitted: z.boolean(),
      }),
    )
    .min(1, "학생 정보가 없습니다."),
});

export type PhoneSubmissionBatchSchemaInput = z.infer<typeof phoneSubmissionBatchSchema>;
