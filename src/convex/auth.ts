import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthSessionId } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous],
  callbacks: {
    /**
     * When a guest (anonymous user) creates a password account from the /auth
     * page, attach the new credentials to the guest's user document instead of
     * creating a fresh one — so products, sales, and settings recorded while
     * browsing as a guest are kept.
     */
    createOrUpdateUser: async (ctx, args) => {
      const { profile } = args;
      const { emailVerified, phoneVerified, ...rest } = profile;
      const userData = {
        ...(emailVerified ? { emailVerificationTime: Date.now() } : null),
        ...(phoneVerified ? { phoneVerificationTime: Date.now() } : null),
        ...rest,
      };

      if (args.existingUserId !== null) {
        await ctx.db.patch(args.existingUserId, userData);
        return args.existingUserId;
      }

      const sessionId = await getAuthSessionId(ctx);
      if (sessionId !== null) {
        const session = await ctx.db.get(sessionId);
        const current = session ? await ctx.db.get(session.userId) : null;
        if (current?.isAnonymous) {
          await ctx.db.patch(current._id, { ...userData, isAnonymous: false });
          return current._id;
        }
      }

      return await ctx.db.insert("users", userData);
    },
  },
});
