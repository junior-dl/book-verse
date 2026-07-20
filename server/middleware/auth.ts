import { auth } from "~/lib/auth";

const protectedRoutes = [
  "/profile",
  "/shelf",
  "/settings",
];

export default defineEventHandler(async (event) => {
  if (!protectedRoutes.some(route => event.path.startsWith(route))) {
    return;
  }

  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    return sendRedirect(event, "/sign-in", 302);
  }

  // if (event.path.startsWith("/profile")) {
  //   const session = await auth.api.getSession({
  //     headers: event.headers,
  //   });
  //   if (!session) {
  //     await sendRedirect(event, "/sign-in", 302);
  //   }
  // }
});
