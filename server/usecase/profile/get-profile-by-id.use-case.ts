import { profileService } from "~/server/services/profile.service";

export async function getProfileByIdUseCase(a_id: string) {
  try {
    return await profileService.getProfileById(a_id);
  }
  catch (e) {
    console.error("Error in retrieving profile details: ", e);
  }
}
