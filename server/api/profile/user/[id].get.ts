import { getProfileByIdUseCase } from "~/server/usecase/profile/get-profile-by-id.use-case";

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event);
    const userAuthId = params.id;

    if (!userAuthId) {
      console.error("User ID is required to get Profile Details");
      return;
    }

    return await getProfileByIdUseCase(userAuthId);
  }
  catch (e) {
    console.error("Error at API endpoint: ", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
