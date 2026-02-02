import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from "../config/ses.js";

/**
 * Universal email sender that uses Amazon SES.
 * Supports custom headers (like List-Unsubscribe) using SendRawEmailCommand.
 */
export async function sendEmail({ to, subject, html, text, from = 'Kai <kai@zerosbykai.com>', replyTo = 'kai@zerosbykai.com', headers = {} }) {
    try {
        // 1. RFC 2047 Encode Subject (for safe non-ASCII handling)
        const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;

        // 2. Construct Raw Email Headers
        const boundary = `----=_Part_${Math.random().toString(36).substring(2)}`;
        let rawEmail = [
            `From: ${from}`,
            `To: ${to}`,
            `Reply-To: ${replyTo}`,
            `Subject: ${encodedSubject}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ];

        // 3. Sanitize and Add Custom Headers (CRLF Injection Protection)
        const headerKeyRegex = /^[a-zA-Z0-9-]+$/;
        Object.entries(headers).forEach(([key, value]) => {
            if (headerKeyRegex.test(key)) {
                // Remove any CR/LF characters from the value
                const sanitizedValue = String(value).replace(/[\r\n]/g, '');
                rawEmail.push(`${key}: ${sanitizedValue}`);
            } else {
                console.warn(`⚠️ Skipping invalid email header key: ${key}`);
            }
        });

        rawEmail.push(""); // Header-Body separator

        // 4. Add Plain Text Part (Base64 Encoded for UTF-8 safety)
        if (text) {
            rawEmail.push(`--${boundary}`);
            rawEmail.push(`Content-Type: text/plain; charset=UTF-8`);
            rawEmail.push(`Content-Transfer-Encoding: base64`);
            rawEmail.push("");
            rawEmail.push(Buffer.from(text, 'utf8').toString('base64'));
            rawEmail.push("");
        }

        // 5. Add HTML Part (Base64 Encoded for UTF-8 safety)
        if (html) {
            rawEmail.push(`--${boundary}`);
            rawEmail.push(`Content-Type: text/html; charset=UTF-8`);
            rawEmail.push(`Content-Transfer-Encoding: base64`);
            rawEmail.push("");
            rawEmail.push(Buffer.from(html, 'utf8').toString('base64'));
            rawEmail.push("");
        }

        rawEmail.push(`--${boundary}--`);

        const rawMessage = rawEmail.join("\r\n");

        const command = new SendRawEmailCommand({
            RawMessage: {
                Data: Buffer.from(rawMessage),
            },
        });

        const response = await sesClient.send(command);
        return { success: true, data: response };
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        return { success: false, error };
    }
}
