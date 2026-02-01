import { generateEmailWrapper, generateEmailHeader, generateEmailFooter, emailStyles } from './shared.js';

export function generateWeeklyDigestEmail({ ideas, winner, threadCount, weekDate }) {
    const ideasHtml = ideas.map((idea, index) => `
    <div style="margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid #e5e5e5;">
      <div style="font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        OPPORTUNITY ${index + 1}
      </div>
      <h3 style="font-family: 'Courier Prime', monospace; font-size: 20px; font-weight: 700; margin-bottom: 8px;">
        ${idea.name}
      </h3>
      <p style="font-size: 14px; color: #666; margin-bottom: 16px;">${idea.title}</p>
      
      <div style="margin-bottom: 12px;">
        <span style="display: inline-block; padding: 4px 10px; background: #f5f5f5; border: 1px solid #d4d4d4; border-radius: 3px; font-size: 11px; margin-right: 6px;">
          ${idea.tags?.region || '🌍 Global'}
        </span>
        <span style="display: inline-block; padding: 4px 10px; background: #f3e8ff; border: 1px solid #d4d4d4; border-radius: 3px; font-size: 11px;">
          ${idea.tags?.category || 'Startup'}
        </span>
      </div>

      <div style="margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 6px;">Problem</div>
        <p style="font-size: 14px; line-height: 1.6; color: #333;">${idea.problem}</p>
      </div>

      <div style="margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 6px;">Solution</div>
        <p style="font-size: 14px; line-height: 1.6; color: #333;">${idea.solution}</p>
      </div>
    </div>
  `).join('');

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
    <div style="text-align: center; padding: 24px 0;">
      <a href="${process.env.FRONTEND_URL}?utm_source=email" 
         style="display: inline-block; padding: 16px 32px; background: #000; color: #FCD933; text-decoration: none; font-weight: 700; border-radius: 6px; font-size: 16px;">
        SEE ALL IDEAS & VOTE
      </a>
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
