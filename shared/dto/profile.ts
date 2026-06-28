import z from "zod";

export const ProfileDTO = z.object ({
  id: z.string(),
  authUserId: z.string(),
  username: z.string(),
  avatarUrl: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const UpdateProfileDTO = z.object ({
  username: z.string(),
  avatarUrl: z.string(),
  updatedAt: z.iso.datetime(),
});
