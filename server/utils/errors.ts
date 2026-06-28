export function notFound(message = "Not found") {
  throw createError({
    statusCode: 404,
    statusMessage: message,
  });
}

export function badRequest(message = "Bad request") {
  throw createError({
    statusCode: 40,
    statusMessage: message,
  });
}

export function unauthorized() {
  throw createError({
    statusCode: 401,
    statusMessage: "Unauthorized",
  });
}
