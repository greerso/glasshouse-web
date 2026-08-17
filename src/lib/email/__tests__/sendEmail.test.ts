const mockSend = jest.fn();

jest.mock('@aws-sdk/client-sesv2', () => {
    return {
        SESv2Client: jest.fn().mockImplementation(() => ({
            send: mockSend,
        })),
        SESClient: jest.fn().mockImplementation(() => ({
            send: mockSend,
        })),
        SendEmailCommand: jest.fn().mockImplementation((input: unknown) => ({ input })),
    };
});

jest.mock('@/env.mjs', () => ({
    env: {
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        DEPLOYMENT_ENV: 'production',
        RESEND_API_KEY: 'test-resend-key',
    },
}));

import { SendEmailCommand } from '@aws-sdk/client-sesv2';
import { sendEmail } from '../resend';

describe('sendEmail', () => {
    beforeEach(() => {
        mockSend.mockReset();
        mockSend.mockResolvedValue({ MessageId: 'ses-message-id-test' });
        (SendEmailCommand as unknown as jest.Mock).mockClear();
    });

    it('sends From/To/Subject/Html through SES SendEmail', async () => {
        const result = await sendEmail({
            from: 'danny@greerso.com',
            to: 'user@example.com',
            subject: 'Sign in to Glasshouse',
            html: '<p>Click to sign in</p>',
        });

        expect(result.success).toBe(true);
        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(SendEmailCommand).toHaveBeenCalledTimes(1);

        const input = (SendEmailCommand as unknown as jest.Mock).mock.calls[0][0] as {
            FromEmailAddress: string;
            Destination: { ToAddresses: string[] };
            Content: { Simple: { Subject: { Data: string }; Body: { Html: { Data: string } } } };
        };

        expect(input.FromEmailAddress).toBe('danny@greerso.com');
        expect(input.Destination.ToAddresses).toEqual(['user@example.com']);
        expect(input.Content.Simple.Subject.Data).toBe('Sign in to Glasshouse');
        expect(input.Content.Simple.Body.Html.Data).toBe('<p>Click to sign in</p>');
    });
});
