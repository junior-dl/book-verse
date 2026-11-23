import z from "zod";

export const CreateShelfDTOSchema = z.object({
  name: z.string().trim().min(1, "Give the shelf a name").max(60),
  description: z.string().trim().max(300).optional().nullable(),
  isPublic: z.boolean().optional().default(false),
});

export const UpdateShelfDTOSchema = CreateShelfDTOSchema.partial();

export const ShelfBookDTOSchema = z.object({
  workId: z.uuid(),
});

export type CreateShelfDTO = z.infer<typeof CreateShelfDTOSchema>;
export type UpdateShelfDTO = z.infer<typeof UpdateShelfDTOSchema>;
