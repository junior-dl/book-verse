import { profileService } from "~/server/services/profile.service";

export async function updateProfileByIdUseCase(id: string, data: Partial<{ name: string; email: string; username: string; avatarUrl: string; about: string }>) {
  try {
    return await profileService.updateProfileById(id, data);
  }
  catch (e) {
    console.error("Error in updating profile details: ", e);
  }
}
