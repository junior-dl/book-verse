import z from "zod";

export const ProfileDTO = z.object ({
  id: z.string(),
  auth_user_id: z.string(),
  username: z.string(),
  avatar_url: z.string(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const UpdateProfileDTO = z.object ({
  username: z.string(),
  avatar_url: z.string(),
  updated_at: z.iso.datetime(),
});
