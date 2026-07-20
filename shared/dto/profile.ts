import z from "zod";

export const ProfileDTO = z.object ({
  id: z.string(),
  authUserId: z.string(),
  username: z.string(),
  avatarUrl: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const UpdateProfileSchema = z.object ({
  name: z.string(),
  email: z.string(),
  username: z.string(),
  avatarUrl: z.string(),
  about: z.string().nullable(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
