"use server";
import { SESv2Client as SESClient, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { env } from '@/env.mjs';

interface Attachment {
    filename: string;
    content: Buffer | string;
    contentType?: string;
}

export interface EmailTag {
    name: string;
    value: string;
}

interface EmailParams {
    from: string;
    to: string;
    cc?: string | string[];
    replyTo?: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: Attachment[];
    tags?: EmailTag[];
}

interface BatchEmailItem {
    from: string;
    to: string;
    replyTo?: string | string[];
    subject: string;
    html: string;
    text?: string;
    tags?: EmailTag[];
}

export interface BatchEmailResult {
    success: boolean;
    failedTos: string[];
    error?: string;
}

function asAddressList(value?: string | string[]): string[] | undefined {
    if (value === undefined) return undefined;
    return Array.isArray(value) ? value : [value];
}

function toRawContent(content: Buffer | string): Uint8Array {
    if (typeof content === 'string') {
        return new TextEncoder().encode(content);
    }
    return new Uint8Array(content);
}

function getSesClient() {
    return new SESClient({
        region: env.AWS_REGION,
        credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
    });
}

export async function sendEmail(params: EmailParams) {
    let { from, to, cc, replyTo, subject, html, text, attachments, tags } = params;

    // Development/preview email override: redirect all emails to a single address
    const isDev = process.env.NODE_ENV !== 'production';
    const isPreview = env.DEPLOYMENT_ENV === 'preview';
    const devEmailOverride = env.DEV_EMAIL_OVERRIDE;

    if ((isDev || isPreview) && devEmailOverride) {
        const originalTo = to;
        const originalCc = cc;

        // Redirect email to dev address
        to = devEmailOverride;
        cc = undefined; // Clear CC to avoid sending to real addresses

        // Modify subject to include original recipient
        subject = `[DEV → ${originalTo}] ${subject}`;

        // Prepend a dev banner to the email body showing original recipients
        const ccList = originalCc ? (Array.isArray(originalCc) ? originalCc.join(', ') : originalCc) : 'none';
        const devBanner = `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:12px 16px;margin-bottom:16px;font-family:monospace;font-size:13px;color:#92400e;">
            <strong>🔧 Dev Email Override</strong><br/>
            <strong>To:</strong> ${originalTo}<br/>
            <strong>CC:</strong> ${ccList}
        </div>`;
        html = devBanner + html;

        // Log for debugging
        console.log(`📧 Dev mode: Redirecting email from "${originalTo}" to "${devEmailOverride}"`);
        if (originalCc) {
            console.log(`   Original CC: ${Array.isArray(originalCc) ? originalCc.join(', ') : originalCc}`);
        }
    }

    try {
        const result = await getSesClient().send(new SendEmailCommand({
            FromEmailAddress: from,
            Destination: {
                ToAddresses: [to],
                CcAddresses: asAddressList(cc),
            },
            ReplyToAddresses: asAddressList(replyTo),
            Content: {
                Simple: {
                    Subject: { Data: subject, Charset: 'UTF-8' },
                    Body: {
                        Html: { Data: html, Charset: 'UTF-8' },
                        ...(text !== undefined ? { Text: { Data: text, Charset: 'UTF-8' } } : {}),
                    },
                    ...(attachments && attachments.length > 0
                        ? {
                            Attachments: attachments.map((attachment) => ({
                                FileName: attachment.filename,
                                RawContent: toRawContent(attachment.content),
                                ContentType: attachment.contentType,
                                ContentDisposition: 'ATTACHMENT' as const,
                            })),
                        }
                        : {}),
                },
            },
            ...(tags && tags.length > 0
                ? { EmailTags: tags.map((tag) => ({ Name: tag.name, Value: tag.value })) }
                : {}),
        }));

        console.log('Email sent successfully:', result.MessageId);
        return { success: true, message: 'Email sent successfully', messageId: result.MessageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, message: 'Failed to send email' };
    }
}

/**
 * Send each item with a sequential SES SendEmail call. The `idempotencyKey`
 * is accepted so existing callers stay unchanged; SES has no Resend-style
 * 24h batch idempotency header.
 */
export async function sendEmailBatch(
    items: BatchEmailItem[],
    _opts: { idempotencyKey: string },
): Promise<BatchEmailResult> {
    if (items.length === 0) return { success: true, failedTos: [] };

    const failedTos: string[] = [];
    for (const item of items) {
        const result = await sendEmail({
            from: item.from,
            to: item.to,
            replyTo: item.replyTo,
            subject: item.subject,
            html: item.html,
            text: item.text,
            tags: item.tags,
        });
        if (!result.success) {
            failedTos.push(item.to);
        }
    }

    return {
        success: failedTos.length === 0,
        failedTos,
        error: failedTos.length > 0 ? `Failed to send ${failedTos.length} of ${items.length} emails` : undefined,
    };
}
