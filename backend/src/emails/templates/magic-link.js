import { generateEmailWrapper, generateEmailHeader, emailStyles, escapeHtml } from './shared.js';
import { config } from '../../config/env.js';

export function generateMagicLinkEmail({ email: _email, actionLink, name }) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';

  const content = `
    ${generateEmailHeader({ title: 'Login Link' })}

    <!-- Main Content -->
    <div style="margin-bottom: 32px;">
      <h2 class="text-main" style="font-size: 22px; font-weight: 700; margin-bottom: 16px;">Your Magic Link</h2>
      <p class="text-main" style="font-size: 16px; margin-bottom: 12px; font-weight: 700;">${greeting}</p>
      <p class="text-main" style="font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 24px;">
        Click the button below to log in. This link will expire in 24 hours.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionLink}"
           style="${emailStyles.button}">
          LOG IN TO ZEROSBYKAI
        </a>
      </div>
      
      <p class="text-muted" style="font-size: 13px; color: #666; margin-top: 24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>

    <hr class="divider-main" style="${emailStyles.divider}">

    <!-- Footer -->
    <div style="padding-top: 24px; font-size: 13px; color: #666;">
      <p class="footer-text" style="margin-bottom: 16px;">
        See you inside,<br>
        <img src="https://zerosbykai.com/favicon-32x32.png" width="20" height="20" alt="" style="vertical-align: sub; margin-right: 6px; border-radius: 4px;">
        <strong class="text-main" style="color: #000;">Kai</strong>
      </p>
    </div>
  `;

  return generateEmailWrapper({
    title: 'Login to ZerosByKai',
    preheader: 'Here is your magic link to log in to ZerosByKai.',
    content,
    mirrorLinkUrl: `${config.backendUrl}/api/emails/view/magic-link`
  });
}
