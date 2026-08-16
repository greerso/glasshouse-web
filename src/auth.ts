import NextAuth, { DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db/prisma"
import authConfig from "@/auth.config"
import { isRealmApexHost } from "@/lib/realm"
import { isEmailAllowed } from "@/lib/auth/allowlist"

declare module "next-auth" {
    interface Session {
        user: {
            isSuperAdmin?: boolean
            phone?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        isSuperAdmin?: boolean
        name?: string | null
        phone?: string | null
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    callbacks: {
        /**
         * Registration is closed: the Resend magic-link + PrismaAdapter combo
         * otherwise creates a User row for any email that requests a link.
         * Existing users (created before this gate, or previously allowlisted)
         * keep access; new sign-ups must be on AUTH_ALLOWED_EMAILS. Returning
         * false here happens *before* the adapter persists anything for the
         * email provider, so a rejected email never gets a User row.
         */
        async signIn({ user }) {
            if (!user.email) return false;
            const existing = await prisma.user.findUnique({ where: { email: user.email } });
            if (existing) return true;
            return isEmailAllowed(user.email, process.env.AUTH_ALLOWED_EMAILS);
        },
        /**
         * Auth.js resolves redirect targets against `NEXTAUTH_URL`'s origin
         * (next-auth rewrites every request's URL to it — `reqWithEnvURL`), so
         * the default callback treats a perfectly valid opencouncil.rs target as
         * cross-origin and drops the user on opencouncil.gr. Allow our other realm
         * domains through, so a sign-in that started on .rs/.fr finishes there.
         *
         * Deliberately narrower than `isKnownRealmHost`, which also matches every
         * subdomain: `data.opencouncil.gr` is the Spaces bucket, and letting our own
         * auth endpoint redirect to attacker-uploaded content there would be an open
         * redirect with our name on it. Production apexes over https only —
         * previews and localhost still work, via the same-origin branch.
         */
        redirect({ url, baseUrl }) {
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            try {
                const { origin, host, protocol } = new URL(url);
                if (origin === baseUrl) return url;
                if (protocol === 'https:' && isRealmApexHost(host)) return url;
            } catch {
                // malformed URL — fall through to the safe default
            }
            return baseUrl;
        },
        session({ session, token, user }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    isSuperAdmin: user.isSuperAdmin,
                    name: user.name,
                    phone: user.phone
                }
            }
        }
    },
    ...authConfig,
})
