import type { ZodType } from "zod";

export function validate<TSchema extends ZodType>(
  schema: TSchema,
  data: unknown,
) {
  return schema.parse(data);
}
