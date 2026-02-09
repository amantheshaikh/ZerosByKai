// Shared email styles and components

/**
 * Basic HTML escaping to prevent injection when inserting user names
 */
export function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const emailStyles = {
  fonts: `
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style type="text/css">
      :root {
        color-scheme: light dark;
        supported-color-schemes: light dark;
      }

      @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');
      
      /* Target Gmail specifically with a fallback that works */
      .font-comic {
        font-family: 'Bangers', Impact, Charcoal, 'Arial Black', sans-serif !important;
      }
      .font-mono {
        font-family: 'Courier Prime', 'Courier New', Courier, monospace !important;
      }

      /* Dark Mode Overrides */
      @media (prefers-color-scheme: dark) {
        .body-bg { background-color: #000000 !important; color: #ffffff !important; }
        .card-bg { background-color: #111111 !important; border-color: #333333 !important; }
        .text-main { color: #ffffff !important; }
        .text-muted { color: #999999 !important; }
        .border-main { border-color: #333333 !important; }
        .divider-main { border-top-color: #222222 !important; }
        .summary-box { background-color: #0a0a0a !important; border-left-color: #FCD933 !important; }
        .footer-text { color: #888888 !important; }
        .footer-link { color: #cccccc !important; }
        
        .comic-shadow { box-shadow: 6px 6px 0 #222222 !important; }
        .comic-shadow-sm { box-shadow: 3px 3px 0 #222222 !important; }

        /* Winner Card Dark Mode */
        .winner-card {
          background: #1a1a1a !important;
          background-image: none !important;
          border-color: #FCD933 !important;
        }
        .winner-label {
          color: #FCD933 !important;
        }

        /* CTA Box Dark Mode */
        .cta-box {
          background-color: #1a1a1a !important;
          border-color: #be123c !important; 
        }

        /* problem/solution Badge Dark Mode - Invert for visibility */
        .label-badge {
          background-color: #FCD933 !important;
          color: #000000 !important;
        }

        /* Prevent auto-inversion for specific containers using gradient tech */
        .no-invert {
           background-image: linear-gradient(#111111, #111111) !important;
        }
      }

      /* Outlook/Win10 overrides */
      [data-ogsc] .body-bg { background-color: #000000 !important; }
      [data-ogsc] .text-main { color: #ffffff !important; }
    </style>
  `,

  body: `margin: 0; padding: 0; font-family: 'Courier Prime', 'Courier New', Courier, monospace; background: #ffffff;`,

  container: `max-width: 600px; margin: 0 auto; padding: 40px 20px;`,

  header: `background: #FCD933; border: 3px solid #000; box-shadow: 6px 6px 0 #000; padding: 24px; margin-bottom: 32px;`,

  button: `display: inline-block; padding: 14px 28px; background: #000; color: #FCD933; text-decoration: none; font-weight: 700; border-radius: 6px; font-size: 15px;`,

  divider: `border: none; border-top: 1px solid #000; margin: 32px 0;`,
  mirrorLink: `font-size: 11px; text-align: center; margin-bottom: 20px; color: #666;`
};

export function generateMirrorLinkSection(url) {
  if (!url) return '';
  return `
    <div style="${emailStyles.mirrorLink}">
      Not rendering correctly? <a href="${url}" class="footer-link" style="color: #000; font-weight: 700;">View in browser</a>
    </div>
  `;
}

export function generateEmailHeader({ title, subtitle }) {
  return `
    <div class="card-bg comic-shadow" style="${emailStyles.header}">
      <div style="margin-bottom: 8px;">
        <a href="https://www.zerosbykai.com" style="display: inline-block; text-decoration: none;">
          <img src="https://www.zerosbykai.com/email-header.png" alt="ZEROSBYKAI" width="280" style="display: block; border: none; max-width: 100%; height: auto;">
        </a>
      </div>
      <div class="text-main" style="font-size: 14px; color: #000; font-weight: 700; margin-top: 8px; border-top: 2px solid #000; padding-top: 8px; display: inline-block;">
        ${title}
      </div>
      <p class="text-main" style="margin: 8px 0 0 0; font-size: 13px;">${subtitle || 'Your weekly dose of real Startup Ideas'}</p>
    </div>
  `;
}

export function generateEmailFooter({ unsubscribeLink }) {
  return `
    <hr class="divider-main" style="${emailStyles.divider}">
    <div style="padding-top: 24px; font-size: 13px; color: #666;">
      <p class="footer-text" style="margin-bottom: 16px;">
        See you Monday,<br>
        <img src="https://zerosbykai.com/favicon-32x32.png" width="20" height="20" alt="" style="vertical-align: sub; margin-right: 6px; border-radius: 4px;">
        <strong class="text-main" style="color: #000;">Kai</strong>
      </p>
      ${unsubscribeLink ? `
        <p style="font-size: 11px; color: #999;">
          <a href="${unsubscribeLink}" class="footer-link" style="color: #666;">Unsubscribe</a>
        </p>
      ` : ''}
    </div>
  `;
}

export function generateEmailWrapper({ title, preheader, content, mirrorLinkUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${emailStyles.fonts}
</head>
<body class="body-bg" style="${emailStyles.body}">
  <!--[if !mso]><!-- -->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <!--<![endif]-->
  <div style="${emailStyles.container}">
    ${generateMirrorLinkSection(mirrorLinkUrl)}
    ${content}
  </div>
</body>
</html>
  `;
}
