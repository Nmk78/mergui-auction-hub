import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { z } from "zod";

const signUpProfile = z.object({
  email: z.email(),
  name: z.string().trim().min(2).max(80).optional(),
});

const passwordProvider = Password({
  profile(params) {
    const result = signUpProfile.safeParse(params);
    if (!result.success) {
      throw new ConvexError("Enter a valid email address and name.");
    }
    return {
      email: result.data.email.toLowerCase(),
      ...(result.data.name ? { name: result.data.name } : {}),
    };
  },
  validatePasswordRequirements(password) {
    if (password.length < 8 || password.length > 128) {
      throw new ConvexError("Password must contain 8 to 128 characters.");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProvider],
});
