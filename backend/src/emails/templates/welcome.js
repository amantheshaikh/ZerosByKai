import { generateEmailWrapper, generateEmailHeader, generateEmailFooter, emailStyles } from './shared.js';

export function generateWelcomeEmail({ name, email }) {
    const displayName = name || 'there';
    const token = Buffer.from(email).toString('base64');

    const content = `
    ${generateEmailHeader({ title: 'Welcome to the Hunt' })}

    <!-- Main Content -->
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 16px;">Welcome, ${displayName}.</h2>
      <p style="font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 16px;">
        You're now on the list. Every Monday, you'll get:
      </p>
      <div style="background: #fafafa; border-left: 3px solid #fbbf24; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6;"><strong>10 startup opportunities</strong> analyzed from thousands of people complaining on Reddit</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6;">Real problems. Real opportunities. No AI fluff.</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6;">Vote on your favorites and earn badges for spotting winners.</p>
      </div>
      <p style="font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 24px;">
        In the meantime, check out what's live right now:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL}?utm_source=welcome_email"
           style="${emailStyles.button}">
          BROWSE THIS WEEK'S IDEAS
        </a>
      </div>
    </div>

    ${generateEmailFooter({
        unsubscribeLink: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
    })}
  `;

    return generateEmailWrapper({
        title: 'Welcome to ZerosByKai',
        preheader: 'You\'re in. 10 startup opportunities analyzed from real complaints every Monday.',
        content
    });
}
