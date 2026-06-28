import z from "zod";

export const ShelfDTO = z.object ({
  id: z.string(),
  profile_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  is_public: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const CreateShelfDTO = z.object ({
  profile_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  is_public: z.boolean().default(false),
});

export const UpdateShelfDTO = z.object ({
  name: z.string(),
  description: z.string().optional(),
  is_public: z.boolean(),
  updated_at: z.iso.datetime(),
});
