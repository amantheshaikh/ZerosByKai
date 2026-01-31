// Email templates for ZerosByKai

export function generateWeeklyDigestEmail({ ideas, winner, badgeCount, threadCount, weekDate }) {
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
          ${idea.tags?.geography?.[0] || '🌍 Global'}
        </span>
        <span style="display: inline-block; padding: 4px 10px; background: #f3e8ff; border: 1px solid #d4d4d4; border-radius: 3px; font-size: 11px;">
          ${idea.tags?.category?.[0] || 'Startup'}
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

      <div style="margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 6px;">Target</div>
        <p style="font-size: 14px; line-height: 1.6; color: #333;">${idea.target_audience}</p>
      </div>

      <div style="margin: 16px 0;">
        <div style="font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin-bottom: 6px;">Why It Matters</div>
        <p style="font-size: 14px; line-height: 1.6; color: #333;">${idea.why_it_matters}</p>
      </div>

      <div style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL}/ideas/${idea.id}?utm_source=email" 
           style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #000; text-decoration: none; font-weight: 700; border-radius: 4px; font-size: 14px; font-family: 'Courier Prime', monospace;">
          PICK THIS IDEA →
        </a>
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
      <p style="font-size: 13px; color: #666; font-style: italic;">
        <strong>${badgeCount} members</strong> earned a Zero Finder badge! 🎯
      </p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZerosByKai - ${weekDate}</title>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier Prime', monospace; background: #ffffff;">
  <!--[if !mso]><!-- -->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    10 new startup opportunities. Real problems from Reddit, real solutions to build.
  </div>
  <!--<![endif]-->
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: 700; letter-spacing: 1px; margin: 0;">ZEROSBYKAI</h1>
      <div style="font-size: 13px; color: #666; margin-top: 4px;">Startup Opportunity Analysis</div>
      <div style="font-size: 13px; color: #666; margin-top: 4px;">Week of ${weekDate}</div>
    </div>

    <!-- Summary -->
    <div style="background: #fafafa; border-left: 3px solid #000; padding: 16px; margin-bottom: 32px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6;">
        <strong>This week's analysis:</strong> ${threadCount.toLocaleString()} threads scraped. 
        ${ideas.length} opportunities identified. No AI fluff. Real problems. Real opportunities.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #000; margin: 32px 0;">

    <!-- Winner -->
    ${winnerHtml}

    <!-- Section Title -->
    <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 24px; text-transform: uppercase;">
      THIS WEEK'S OPPORTUNITIES
    </h2>

    <hr style="border: none; border-top: 1px solid #d4d4d4; margin: 24px 0;">

    <!-- Ideas -->
    ${ideasHtml}

    <hr style="border: none; border-top: 1px solid #000; margin: 32px 0;">

    <!-- CTA -->
    <div style="text-align: center; padding: 24px 0;">
      <a href="${process.env.FRONTEND_URL}?utm_source=email" 
         style="display: inline-block; padding: 16px 32px; background: #000; color: #fbbf24; text-decoration: none; font-weight: 700; border-radius: 6px; font-size: 16px;">
        SEE ALL IDEAS & VOTE
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #000; margin: 32px 0;">

    <!-- Footer -->
    <div style="padding-top: 24px; font-size: 13px; color: #666;">
      <p style="margin-bottom: 16px;">
        See you next Monday,<br>
        <strong style="color: #000;">Kai</strong>
      </p>
      <p style="font-size: 11px; color: #999;">
        <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent('{{email}}')}&token={{token}}" style="color: #666;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

export function generateBadgeEmail({ name, email, ideaName, badgeCount, tier, weeklyWinnerCount }) {
  const tierEmoji = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    diamond: '💎'
  };

  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You Picked the Winner!</title>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier Prime', monospace; background: #fafafa;">
  <!--[if !mso]><!-- -->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Nice call! You spotted the top idea this week.
  </div>
  <!--<![endif]-->
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 72px; margin-bottom: 16px;">🎯</div>
      <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 8px 0;">YOU PICKED THE WINNER!</h1>
    </div>

    <!-- Main Content -->
    <div style="background: #ffffff; border: 3px solid #000; box-shadow: 8px 8px 0 #000; padding: 32px; margin-bottom: 32px;">
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Hey ${name},
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Congratulations! You voted for this week's top idea:
      </p>
      <div style="background: #fffbeb; border-left: 4px solid #fbbf24; padding: 16px; margin: 24px 0;">
        <p style="font-size: 18px; font-weight: 700; margin: 0;">
          "${ideaName}"
        </p>
      </div>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        <strong>You've earned a Zero Finder badge.</strong>
      </p>
      
      <!-- Badge Stats -->
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 12px;">${tierEmoji[tier]}</div>
        <p style="font-size: 14px; color: #666; margin: 0;">Your score: <strong style="color: #000;">${badgeCount} winning picks</strong></p>
        <p style="font-size: 18px; font-weight: 700; margin: 8px 0 0 0;">${tierName}</p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 24px;">
        You're developing an eye for spotting opportunities that founders should build. 
        ${tier === 'diamond' ? "You've mastered it." : "Keep going!"}
      </p>

      ${tier === 'diamond' ? `
        <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 16px; font-weight: 700;">
          You might just have a future in venture capital. 💼
        </p>
      ` : ''}

      <div style="text-align: center; margin-top: 32px;">
        <a href="${process.env.FRONTEND_URL}?utm_source=badge_email" 
           style="display: inline-block; padding: 14px 28px; background: #000; color: #fbbf24; text-decoration: none; font-weight: 700; border-radius: 6px; font-size: 15px;">
          SEE THIS WEEK'S IDEAS →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; font-size: 12px; color: #999;">
      <p>Badge earned by ${weeklyWinnerCount > 1 ? `you and ${weeklyWinnerCount - 1} other member${weeklyWinnerCount - 1 > 1 ? 's' : ''}` : 'you'} this week</p>
      <p style="margin-top: 16px;">
        <a href="${process.env.FRONTEND_URL}" style="color: #666;">ZerosByKai</a>
      </p>
      <p style="margin-top: 8px; font-size: 11px;">
        <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${Buffer.from(email).toString('base64')}" style="color: #666;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

export function generateWelcomeEmail({ name, email }) {
  const displayName = name || 'there';
  const token = Buffer.from(email).toString('base64');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ZerosByKai</title>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier Prime', monospace; background: #ffffff;">
  <!--[if !mso]><!-- -->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    You're in. 10 AI-validated startup ideas every Monday.
  </div>
  <!--<![endif]-->
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: 700; letter-spacing: 1px; margin: 0;">ZEROSBYKAI</h1>
      <div style="font-size: 13px; color: #666; margin-top: 4px;">Startup Opportunity Analysis</div>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 16px;">Welcome, ${displayName}.</h2>
      <p style="font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 16px;">
        You're now on the list. Every Monday, you'll get:
      </p>
      <div style="background: #fafafa; border-left: 3px solid #fbbf24; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6;"><strong>10 AI-validated startup ideas</strong> scraped from Reddit</p>
        <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6;">Real problems. Real opportunities. No AI fluff.</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6;">Vote on your favorites and earn badges for spotting winners.</p>
      </div>
      <p style="font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 24px;">
        In the meantime, check out what's live right now:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${process.env.FRONTEND_URL}?utm_source=welcome_email"
           style="display: inline-block; padding: 14px 28px; background: #000; color: #fbbf24; text-decoration: none; font-weight: 700; border-radius: 6px; font-size: 15px;">
          BROWSE THIS WEEK'S IDEAS
        </a>
      </div>
    </div>

    <hr style="border: none; border-top: 1px solid #000; margin: 32px 0;">

    <!-- Footer -->
    <div style="padding-top: 24px; font-size: 13px; color: #666;">
      <p style="margin-bottom: 16px;">
        See you Monday,<br>
        <strong style="color: #000;">Kai</strong>
      </p>
      <p style="font-size: 11px; color: #999;">
        <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}" style="color: #666;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

export function generateMagicLinkEmail({ email, actionLink }) {
  // const token = Buffer.from(email).toString('base64'); // Not used in this template currently

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to ZerosByKai</title>
  <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier Prime', monospace; background: #ffffff;">
  <!--[if !mso]><!-- -->
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Here is your magic link to log in to ZerosByKai.
  </div>
  <!--<![endif]-->
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="font-size: 24px; font-weight: 700; letter-spacing: 1px; margin: 0;">ZEROSBYKAI</h1>
      <div style="font-size: 13px; color: #666; margin-top: 4px;">Startup Opportunity Analysis</div>
    </div>

    <!-- Main Content -->
    <div style="margin-bottom: 32px;">
      <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 16px;">Your Magic Link</h2>
      <p style="font-size: 15px; line-height: 1.7; color: #333; margin-bottom: 24px;">
        Click the button below to log in. This link will expire in 24 hours.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionLink}"
           style="display: inline-block; padding: 14px 28px; background: #000; color: #fbbf24; text-decoration: none; font-weight: 700; border-radius: 6px; font-size: 15px;">
          LOG IN TO ZEROSBYKAI
        </a>
      </div>
      
      <p style="font-size: 13px; color: #666; margin-top: 24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #000; margin: 32px 0;">

    <!-- Footer -->
    <div style="padding-top: 24px; font-size: 13px; color: #666;">
      <p style="margin-bottom: 16px;">
        <strong style="color: #000;">Kai</strong>
      </p>
    </div>

  </div>
</body>
</html>
  `;
}
