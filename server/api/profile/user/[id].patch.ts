import { updateProfileByIdUseCase } from "~/server/usecase/profile/update-profile-by-id.use-case";

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event);
    const profileId = params.id;
    const body = await readBody(event);

    if (!profileId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Profile ID is required",
      });
    }

    return await updateProfileByIdUseCase(profileId, body);
  }
  catch (e) {
    console.error("Error at API endpoint: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
