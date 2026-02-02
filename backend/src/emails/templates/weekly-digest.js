import { generateEmailWrapper, generateEmailHeader, generateEmailFooter, emailStyles } from './shared.js';

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generateWeeklyDigestEmail = ({ ideas, winner, threadCount, weekDate }) => {
  const ideasHtml = ideas.map((idea, index) => {
    const safeName = escapeHtml(idea.name);
    const safeTitle = escapeHtml(idea.title);
    const safeProblem = escapeHtml(idea.problem);
    const safeSolution = escapeHtml(idea.solution);
    const safeRegion = escapeHtml(idea.tags?.region || 'Global');
    const safeCategory = escapeHtml(idea.tags?.category || 'Startup');

    return `
    <div style="margin-bottom: 48px; border: 3px solid #000; box-shadow: 6px 6px 0 #000; padding: 24px; background: #ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
        <tr>
          <td valign="middle">
             <span style="background: #000; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 8px; text-transform: uppercase; letter-spacing: 1px;">
               #${index + 1}
             </span>
          </td>
          <td valign="middle" align="right">
             <a href="${process.env.FRONTEND_URL}?utm_source=email" 
                style="font-family: 'Courier Prime', monospace; font-size: 11px; color: #000; text-decoration: none; font-weight: 700; background: #FCD933; border: 2px solid #000; padding: 6px 10px; box-shadow: 3px 3px 0 #000; display: inline-block;">
               BET ON THIS
             </a>
          </td>
        </tr>
      </table>
      
      <h3 style="font-family: 'Courier Prime', monospace; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.2;">
        ${safeName}
      </h3>
      <p style="font-size: 14px; color: #444; margin-bottom: 16px; font-style: italic;">${safeTitle}</p>
      
      <div style="margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 8px;">
        <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-right: 12px;">
          📍 ${safeRegion}
        </span>
        <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase;">
          🏷️ ${safeCategory}
        </span>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; background: #000; color: #fff; display: inline-block; padding: 2px 6px; margin-bottom: 8px;">THE PROBLEM</div>
        <p style="font-size: 14px; line-height: 1.5; color: #000; margin: 0;">${safeProblem}</p>
      </div>

      <div style="margin: 0;">
        <div style="font-size: 12px; font-weight: 700; background: #000; color: #fff; display: inline-block; padding: 2px 6px; margin-bottom: 8px;">THE SOLUTION</div>
        <p style="font-size: 14px; line-height: 1.5; color: #000; margin: 0;">${safeSolution}</p>
      </div>
    </div>
  `;
  }).join('');

  const winnerHtml = winner ? `
    <div style="padding: 24px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #fbbf24; border-radius: 8px; margin-bottom: 32px;">
      <div style="font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
        🏆 LAST WEEK'S WINNER
      </div>
      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${winner.name}</h3>
      <p style="font-size: 13px; color: #666; margin-bottom: 12px;">${winner.title}</p>
      <p style="font-size: 13px; color: #333; margin-bottom: 16px;">
        Did you pick the winner? Check your profile to find out.
      </p>
      <div style="text-align: center; margin-bottom: 12px;">
        <a href="${process.env.FRONTEND_URL}/profile?utm_source=email"
           style="${emailStyles.button}">
          CHECK YOUR PROFILE →
        </a>
      </div>
      <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">
        Vote for the winning idea each week to earn badges and climb the ranks.
      </p>
    </div>
  ` : '';

  const content = `
    ${generateEmailHeader({ title: `Week of ${weekDate}` })}

    <!-- Summary -->
    <div style="background: #fafafa; border-left: 3px solid #000; padding: 16px; margin-bottom: 32px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6;">
        <strong>This week's analysis:</strong> ${threadCount.toLocaleString()} threads scraped. 
        ${ideas.length} opportunities identified. No AI fluff. Real problems. Real opportunities.
      </p>
    </div>

    <hr style="${emailStyles.divider}">

    <!-- Winner -->
    ${winnerHtml}

    <!-- Section Title -->
    <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 24px; text-transform: uppercase;">
      THIS WEEK'S OPPORTUNITIES
    </h2>

    <hr style="border: none; border-top: 1px solid #d4d4d4; margin: 24px 0;">

    <!-- Ideas -->
    ${ideasHtml}

    <hr style="${emailStyles.divider}">

    <!-- CTA -->
    <!-- Edgy Instruction / CTA -->
    <div style="margin: 48px 0; padding: 32px 24px; background: #be123c; border: 3px solid #000; box-shadow: 8px 8px 0 #000; text-align: center;">
      
      <div style="font-family: 'Bangers', cursive; font-size: 28px; color: #FCD933; letter-spacing: 1px; margin-bottom: 16px; text-shadow: 2px 2px 0 #000;">
        ENOUGH READING. TIME TO JUDGE.
      </div>

      <p style="font-family: 'Courier Prime', monospace; font-size: 16px; color: #fff; margin-bottom: 24px; line-height: 1.6; font-weight: 700;">
        Think you can spot the unicorn in this pile?<br>
        Cast your vote. Pick the winner. Earn the badge.
      </p>

      <div style="background: rgba(0,0,0,0.2); display: inline-block; padding: 4px 12px; margin-bottom: 24px; transform: rotate(-1deg);">
        <p style="font-size: 13px; color: #fff; margin: 0; font-style: italic;">
          "Maybe you actually have the eye of an Angel Investor."
        </p>
      </div>
      
      <div>
        <a href="${process.env.FRONTEND_URL}?utm_source=email" 
          style="display: inline-block; background: #000; color: #FCD933; font-family: 'Bangers', cursive; font-size: 24px; text-decoration: none; padding: 12px 32px; border: 2px solid #FCD933; box-shadow: 4px 4px 0 #000; transform: rotate(1deg);">
          PROVE IT NOW &rarr;
        </a>
      </div>

    </div>

    ${generateEmailFooter({
    unsubscribeLink: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent('{{email}}')}&token={{token}}`
  })}
  `;

  return generateEmailWrapper({
    title: `ZerosByKai - ${weekDate}`,
    preheader: '10 new startup opportunities. Real problems from Reddit, real solutions to build.',
    content
  });
}
