// Mocking authentication for the prototype.
// In a real application, implement NextAuth.js or Clerk here.

import { prisma } from "./prisma";

export async function getCurrentUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Admin"
      }
    });
  }
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
