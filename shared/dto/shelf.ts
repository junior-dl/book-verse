import z from "zod";

export const ShelfDTO = z.object ({
  id: z.string(),
  profileId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isPublic: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateShelfDTO = z.object ({
  profileId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export const UpdateShelfDTO = z.object ({
  name: z.string(),
  description: z.string().optional(),
  isPublic: z.boolean(),
  updatedAt: z.iso.datetime(),
});
