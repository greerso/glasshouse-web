import type { EmailConfig } from "next-auth/providers/email"
import type { NextAuthConfig } from "next-auth"
import { AuthEmail, authEmailCopy } from "./lib/email/templates/AuthEmail"
import { renderReactEmailToHtml } from "./lib/email/render"
import { sendEmail } from "./lib/email/resend"
import { env } from "./env.mjs"
import { isTestUserEmail } from "./lib/dev/test-users"
import { signInUrlForRequest } from "./lib/auth/signInUrl"
import { localeForRequest } from "./lib/auth/requestLocale"

// In development, use port-specific session cookie names to allow multiple
// instances on different ports to have independent sessions. Without this,
// logging into one instance logs out the other because cookies are scoped
// by domain (localhost), not by port.
const isDev = process.env.NODE_ENV === 'development'
// APP_PORT is set by flake.nix when running multiple instances
const port = process.env.APP_PORT || '3000'

const emailProvider: EmailConfig = {
    id: "resend",
    type: "email",
    name: "Email",
    from: process.env.AUTH_EMAIL_FROM ?? 'danny@greerso.com',
    maxAge: 24 * 60 * 60,
    sendVerificationRequest: async (params) => {
        const { identifier: to, provider, url, request } = params
        // Point the magic link at the domain the user is signing in from
        // (opencouncil.gr vs opencouncil.fr) instead of the single build-time
        // NEXTAUTH_URL host, so the callback sets a cookie on the right domain.
        const signInUrl = signInUrlForRequest(url, request)
        // Write the email in the language of the domain it was requested
        // from — opencouncil.rs users were getting a Greek magic link.
        const locale = localeForRequest(request)
        const copy = authEmailCopy(locale)
        const html = await renderReactEmailToHtml(AuthEmail({ url: signInUrl, locale }))

        // Redirect test user emails to DEV_EMAIL_OVERRIDE if set
        // This allows testing different admin roles with a single real inbox
        let emailTo = to
        if (env.DEV_EMAIL_OVERRIDE && isTestUserEmail(to)) {
            console.log(`[Auth] Redirecting test user email from ${to} to ${env.DEV_EMAIL_OVERRIDE}`)
            emailTo = env.DEV_EMAIL_OVERRIDE
        }

        const result = await sendEmail({
            from: provider.from ?? 'danny@greerso.com',
            to: emailTo,
            subject: copy.subject,
            html,
            text: `${copy.subject}: ${signInUrl}`,
        })

        if (!result.success) {
            throw new Error("Failed to send verification email")
        }
    },
}

export default {
    trustHost: true,
    cookies: isDev ? {
        sessionToken: {
            name: `authjs.session-token-${port}`,
            options: { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: false },
        },
    } : undefined,
    providers: [emailProvider],
} satisfies NextAuthConfig
