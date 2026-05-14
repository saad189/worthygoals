import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Simple AWS SES email sender utility.
 * Relies on environment variables with fallbacks for local/dev usage.
 */
const REGION = process.env.AWS_SES_REGION || process.env.AWS_REGION;
const ACCESS_KEY_ID =
  process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;

const SECRET_ACCESS_KEY =
  process.env.AWS_SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL_SENDER || 'support@glotte.org';

// Lazily create client (can be swapped for singleton injection later)
const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailOptions): Promise<void> {
  const destinations = Array.isArray(to) ? to : [to];
  if (!html && !text) {
    text = 'No content provided.';
  }
  const params = {
    Source: from || SUPPORT_EMAIL,
    Destination: {
      ToAddresses: destinations,
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: html ? { Data: html } : undefined,
        Text: text ? { Data: text } : undefined,
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
  } catch (error) {
    // For now just log; upstream can decide error handling strategy.
    // We do not throw in prod fallback? For now rethrow so caller can react.
    // eslint-disable-next-line no-console
    console.error('SES sendEmail failed', error);
    throw error;
  }
}

/**
 * Helper for forgot passcode flow.
 */
export async function sendForgotPasscodeEmail(
  to: string,
  tempPasscode: string,
): Promise<void> {
  const subject = 'Your Temporary Passcode';
  const bodyHtml = `<p>Hello,</p><p>Your temporary passcode is <strong>${tempPasscode}</strong>.</p><p>Please use it to log in and then change your passcode in settings.</p><p>Regards,<br/>Glotte Support</p>`;
  const bodyText = `Hello,\nYour temporary passcode is ${tempPasscode}.\nPlease use it to log in and then change your passcode in settings.\nRegards,\nGlotte Support`;
  await sendEmail({ to, subject, html: bodyHtml, text: bodyText });
}
