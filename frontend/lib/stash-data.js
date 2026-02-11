// Category color mappings for badges
export const CATEGORY_COLORS = {
  'Hosting': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'Database & Auth': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  'Email': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'Payments': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  'SEO & Analytics': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  'CDN & Storage': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  'AI Models': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  'Vibe Coding': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  'Content & Design': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  'Productivity': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  'Testing & Code Quality': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  'Domains': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  'Brainstorming': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
};

export const CATEGORIES = [
  {
    id: 'hosting',
    name: 'Hosting',
    description: 'Where your app lives and runs. Choose based on your stack: static sites need simple hosting, full-stack apps need servers, APIs need backends. Free tiers are generous enough for MVPs.',
    icon: '🚀'
  },
  {
    id: 'database-auth',
    name: 'Database & Auth',
    description: 'Store user data and handle logins. Most MVPs need both. Supabase gives you PostgreSQL + authentication + real-time features in one package, saving weeks of setup.',
    icon: '🗄️'
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Send emails to users. Transactional emails (password resets, receipts) vs. marketing emails (newsletters, campaigns). Pick based on volume and whether you need templates.',
    icon: '✉️'
  },
  {
    id: 'payments',
    name: 'Payments',
    description: 'Accept money from customers. Merchant of Record (MoR) services handle tax/compliance for you. Choose based on whether you\'re selling digital products, SaaS subscriptions, or physical goods.',
    icon: '💳'
  },
  {
    id: 'analytics',
    name: 'SEO & Analytics',
    description: 'Understand what users do and how they find you. Analytics tracks behavior, monitoring catches errors. You need both—analytics for growth, monitoring for stability.',
    icon: '📊'
  },
  {
    id: 'cdn-storage',
    name: 'CDN & Storage',
    description: 'Serve files fast globally and store user uploads. CDNs cache content at edge locations worldwide. Storage is for images, videos, and files users upload. Often used together.',
    icon: '⚡'
  },
  {
    id: 'ai-models',
    name: 'AI Models',
    description: 'Access powerful foundation models for text, vision, and more. Use for chatbots, analysis, and multimodal tasks. Free tiers are surprisingly generous.',
    icon: '🧠'
  },
  {
    id: 'vibe-coding',
    name: 'Vibe Coding',
    description: 'Write code faster with AI assistance. These tools autocomplete code, explain functions, find bugs, and generate boilerplate. Game-changers for solo developers and learners.',
    icon: '💻'
  },
  {
    id: 'ai-content',
    name: 'Content & Design',
    description: 'Create images, videos, UIs, and presentations with AI. Perfect for mockups, marketing materials, and prototypes when you don\'t have a designer. Quality varies—experiment to find what works.',
    icon: '🎨'
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Organize your work, docs, and ideas. Essential for solo builders to stay organized. Use for roadmaps, documentation, project management, and knowledge bases.',
    icon: '✅'
  },
  {
    id: 'testing',
    name: 'Testing & Code Quality',
    description: 'Test your app and maintain code quality. Automated tests catch bugs before users do. Code reviews improve quality. CI/CD automates deployment. Essential as you scale.',
    icon: '🧪'
  },
  {
    id: 'domains',
    name: 'Domains',
    description: 'Your website address (e.g., yourapp.com). Likely your only expense. Budget ~$10/year. Get it early—good domains go fast. Free WHOIS privacy is a must.',
    icon: '🌐'
  },
  {
    id: 'brainstorming',
    name: 'Brainstorming',
    description: 'Refine your ideas. Use these AI tools to research, brainstorm, and plan before you build.',
    icon: '💡'
  },
];

export const TOOLS = [
  // Hosting (3)
  {
    id: 1,
    name: 'Fly.io',
    category: 'Hosting',
    hook: 'Clean. Minimal. Fast.',
    features: ['3 shared-cpu VMs (256MB RAM each)', '160GB bandwidth/month', 'Deploy from CLI in 30 seconds'],
    perfectFor: 'APIs, backends, cron jobs',
    cost: 'Free (if bill < $5)',
    url: 'https://fly.io',
    detailedDescription: 'Fly.io runs full-stack applications close to users globally with edge computing. Unlike static hosts, it supports long-running processes, WebSockets, and databases. Perfect for backends that need to stay alive 24/7. The $5 forgiveness policy means most MVPs run completely free.',
    bestFor: 'Node.js/Python/Go backends, REST APIs, Discord bots, scheduled jobs, WebSocket servers, microservices',
    notGoodFor: 'Static sites (use Vercel instead), apps with unpredictable traffic spikes that might exceed $5',
    keyDifferentiator: 'Only platform that forgives bills under $5—truly free for most MVPs. Supports any language/framework via Docker.'
  },
  {
    id: 2,
    name: 'Vercel',
    category: 'Hosting',
    hook: 'Git push = deploy. That\'s it.',
    features: ['Unlimited deployments', '100GB bandwidth/month', 'Auto HTTPS, CDN, custom domains'],
    perfectFor: 'Next.js, React, static sites',
    cost: 'Free',
    url: 'https://vercel.com',
    detailedDescription: 'Vercel is the gold standard for frontend deployment, built by the Next.js team. Zero-config deployments with automatic HTTPS, global CDN, and preview URLs for every commit. Serverless functions let you add backend logic without managing servers. Ideal for landing pages and marketing sites.',
    bestFor: 'Landing pages, Next.js apps, React SPAs, portfolio sites, documentation sites, serverless APIs',
    notGoodFor: 'Long-running processes, WebSocket servers, heavy compute tasks, apps needing persistent connections',
    keyDifferentiator: 'Best Next.js integration in the industry. Preview deployments for every PR make collaboration seamless.'
  },
  {
    id: 3,
    name: 'Railway',
    category: 'Hosting',
    hook: '$5 credit every month. No strings.',
    features: ['$5 free credit/month', 'Deploy Docker, Node, Python', 'Built-in Redis, Postgres, MySQL'],
    perfectFor: 'Full-stack apps with DB',
    cost: 'Free ($5 credit/month)',
    url: 'https://railway.app',
    detailedDescription: 'Railway simplifies full-stack deployment with one-click databases and automatic deployments. Unlike other platforms, you get Postgres, Redis, and MySQL with zero config. The $5/month credit renews monthly, making it perfect for MVPs that need a database and backend together.',
    bestFor: 'Full-stack apps, monolithic apps, projects needing Postgres/Redis/MySQL, Django/Rails apps, hobby projects',
    notGoodFor: 'High-traffic production apps (credit runs out fast), static sites (overkill), apps needing advanced database features',
    keyDifferentiator: 'Easiest database setup in the game. One click gets you Postgres + Redis + your app deployed together.'
  },
  // Database & Auth (1)
  {
    id: 4,
    name: 'Supabase',
    category: 'Database & Auth',
    hook: 'Two free projects. No credit card.',
    features: [
      '500MB database per project',
      '50,000 monthly active users',
      '1GB file storage',
      'Magic link auth built-in',
      'Real-time subscriptions',
      'Auto REST APIs',
    ],
    perfectFor: 'Full-stack apps needing DB + Auth',
    cost: 'Free (2 projects)',
    url: 'https://supabase.com',
    detailedDescription: 'Supabase is an open-source Firebase alternative built on PostgreSQL. Get a production-ready database, authentication (email, OAuth, magic links), real-time subscriptions, and file storage in minutes. Auto-generated REST and GraphQL APIs mean you can start building immediately without writing backend code.',
    bestFor: 'MVPs needing user accounts, SaaS apps, real-time apps (chat, collaboration), projects needing relational data',
    notGoodFor: 'Apps needing 24/7 uptime on free tier (pauses after 7 days), projects with >500MB data initially',
    keyDifferentiator: 'Only free platform giving you PostgreSQL + Auth + Real-time + Storage in one package. No vendor lock-in.'
  },
  // Email (2)
  {
    id: 5,
    name: 'Resend',
    category: 'Email',
    hook: 'The email service that doesn\'t suck.',
    features: ['3,000 emails/month', 'Custom domain (verify via DNS)', 'React email templates', 'Actual delivery (not spam)'],
    perfectFor: 'Transactional emails',
    cost: 'Free',
    url: 'https://resend.com',
    detailedDescription: 'Resend is built for developers who need transactional emails that actually land in inboxes. Unlike legacy providers, it has a modern API, React-based templates, and excellent deliverability. Perfect for password resets, order confirmations, and user notifications. Setup takes 10 minutes.',
    bestFor: 'Password resets, order confirmations, welcome emails, notification emails, receipts, account alerts',
    notGoodFor: 'Marketing campaigns (use Brevo), bulk newsletters, emails without a verified domain',
    keyDifferentiator: 'Best developer experience in email. React templates and modern API make it a joy to use.'
  },
  {
    id: 6,
    name: 'Brevo',
    category: 'Email',
    hook: '300 emails per DAY. Not month.',
    features: ['300 emails/day (9,000/month)', 'Marketing + transactional', 'SMS (20 free credits)', 'Email builder'],
    perfectFor: 'Newsletters, marketing',
    cost: 'Free',
    url: 'https://brevo.com',
    detailedDescription: 'Brevo (formerly Sendinblue) excels at marketing emails and newsletters with a generous 300 emails/day limit. The visual email builder makes creating campaigns easy without code. Also includes SMS credits and basic CRM features. Great for content creators and early-stage marketing.',
    bestFor: 'Weekly newsletters, marketing campaigns, drip campaigns, product announcements, content distribution',
    notGoodFor: 'High-volume transactional emails, professional emails (has branding), enterprise-grade deliverability',
    keyDifferentiator: 'Highest free email limit (9,000/month) plus SMS and email builder. Best for marketing on a budget.'
  },
  // Payments (2)
  {
    id: 7,
    name: 'Lemon Squeezy',
    category: 'Payments',
    hook: 'Payments for creators. Marketing built-in.',
    features: [
      'No monthly fees (5% + payment fees)',
      'Built-in affiliate system',
      'Email marketing tools',
      'PDF stamping, license keys',
      'VAT/tax handling (global)',
    ],
    perfectFor: 'Digital products, courses, creators, beginners',
    cost: 'Free (5% per transaction)',
    url: 'https://lemonsqueezy.com',
    detailedDescription: 'Lemon Squeezy is a merchant of record built for creators selling digital products. They handle all tax compliance globally, so you don\'t deal with VAT/sales tax nightmares. Built-in affiliate system, email marketing, and license key generation make it perfect for courses, ebooks, and software. Easiest payment setup for beginners.',
    bestFor: 'Digital downloads, online courses, ebooks, software licenses, Notion templates, design assets, creator products',
    notGoodFor: 'Physical products, high-volume SaaS (5% adds up), complex subscription logic, apps needing custom checkout',
    keyDifferentiator: 'Only MoR with built-in affiliate system and email marketing. Zero tax headaches for global sales.'
  },
  {
    id: 8,
    name: 'Paddle',
    category: 'Payments',
    hook: 'SaaS billing. Enterprise-grade.',
    features: [
      'Merchant of record (they handle tax)',
      'Global payment methods',
      'Subscription management',
      'Revenue recovery tools',
      'Invoicing & compliance',
    ],
    perfectFor: 'Scaling SaaS, B2B products, established businesses',
    cost: 'Free monthly (5% + payment fees)',
    url: 'https://paddle.com',
    detailedDescription: 'Paddle is an enterprise-grade merchant of record for SaaS companies. Unlike Stripe, they handle all tax compliance, invoicing, and revenue recovery. Advanced subscription management, dunning, and global payment methods make it ideal for B2B SaaS. More expensive than Stripe but saves engineering time.',
    bestFor: 'B2B SaaS, subscription software, enterprise products, international SaaS, products selling to businesses',
    notGoodFor: 'Simple one-time payments, marketplaces, platforms with complex splits, apps needing full checkout control',
    keyDifferentiator: 'Best-in-class subscription management and revenue recovery. Handles all tax/compliance globally.'
  },
  // SEO & Analytics (2)
  {
    id: 9,
    name: 'Google Search Console',
    category: 'SEO & Analytics',
    hook: 'Know what Google sees. Completely free.',
    features: ['Search performance data', 'Indexing status', 'Mobile usability reports', 'Core Web Vitals', 'Submit sitemaps'],
    perfectFor: 'SEO, organic traffic insights',
    cost: 'Free',
    url: 'https://search.google.com/search-console',
    detailedDescription: 'Google Search Console is essential for understanding how Google sees your site. Track which keywords bring traffic, identify indexing issues, and monitor Core Web Vitals for SEO. Completely free and directly from Google. Every website should have this set up from day one.',
    bestFor: 'SEO optimization, tracking organic traffic, fixing indexing issues, monitoring search rankings, content strategy',
    notGoodFor: 'User behavior analytics (use PostHog), tracking non-Google traffic, real-time analytics',
    keyDifferentiator: 'Direct insights from Google itself. Only way to see exactly how Google indexes and ranks your site.'
  },
  {
    id: 10,
    name: 'PostHog',
    category: 'SEO & Analytics',
    hook: 'Product analytics. 1M events/month free.',
    features: ['Event tracking', 'Session replay', 'Feature flags', 'A/B testing', 'Funnels, retention, trends'],
    perfectFor: 'Understanding user behavior, product analytics',
    cost: 'Free (1M events/month)',
    url: 'https://posthog.com',
    detailedDescription: 'PostHog is an all-in-one product analytics platform that shows exactly how users interact with your app. Session replay lets you watch user sessions like a movie. Feature flags enable gradual rollouts. A/B testing helps optimize conversions. The 1M event limit is generous for MVPs.',
    bestFor: 'Product analytics, user behavior tracking, conversion funnels, A/B testing, feature flags, session replay',
    notGoodFor: 'Simple page view tracking (overkill), SEO analytics, apps with >1M events/month on free tier',
    keyDifferentiator: 'Only free platform combining analytics + session replay + feature flags + A/B testing in one.'
  },
  // CDN & Storage (2)
  {
    id: 11,
    name: 'Cloudflare',
    category: 'CDN & Storage',
    hook: 'Free CDN, SSL, DDoS protection. Everything.',
    features: ['Unlimited bandwidth CDN', 'Free SSL certificates', 'DDoS protection', 'DNS management (fastest)', 'Workers (serverless functions)'],
    perfectFor: 'Making your site fast globally, free SSL',
    cost: 'Free',
    url: 'https://cloudflare.com',
    detailedDescription: 'Cloudflare is the internet\'s infrastructure layer, offering free CDN, SSL, and DDoS protection. Point your domain to Cloudflare and your site instantly loads faster worldwide. Also includes serverless Workers for edge computing. Every website should use Cloudflare—it\'s genuinely free with no catch.',
    bestFor: 'CDN for any website, free SSL certificates, DDoS protection, DNS management, edge computing with Workers',
    notGoodFor: 'File storage (use R2 instead), complex server-side logic (use Fly.io)',
    keyDifferentiator: 'Industry-leading free tier with unlimited bandwidth. Powers 20% of the internet for a reason.'
  },
  {
    id: 12,
    name: 'Cloudflare R2',
    category: 'CDN & Storage',
    hook: 'Store files. No egress fees. Ever.',
    features: ['10GB storage free', 'No egress fees (unlike AWS S3)', 'S3-compatible API', 'Unlimited reads'],
    perfectFor: 'User uploads, images, files, videos',
    cost: 'Free (10GB storage)',
    url: 'https://cloudflare.com/products/r2/',
    detailedDescription: 'Cloudflare R2 is object storage without the egress fee nightmare of AWS S3. Store user uploads, images, and files with an S3-compatible API. The killer feature: zero egress fees means serving files to users is completely free. Perfect for user-generated content and media-heavy apps.',
    bestFor: 'User uploads, image storage, video hosting, file downloads, backups, static assets',
    notGoodFor: 'Databases (use Supabase), apps needing >10GB on free tier, real-time file processing',
    keyDifferentiator: 'Zero egress fees unlike AWS S3. Serve unlimited files to users without paying for bandwidth.'
  },
  // AI Models (3)
  {
    id: 13,
    name: 'Google Gemini',
    category: 'AI Models',
    hook: 'Free AI API with generous limits.',
    features: ['15 requests/minute', '1,500 requests/day', 'Gemini Flash + Pro models', 'Vision, embeddings included', 'Function calling, structured outputs'],
    perfectFor: 'Text analysis, chatbots, content generation',
    cost: 'Free tier, then $0.075/1M tokens',
    url: 'https://ai.google.dev',
    detailedDescription: 'Google Gemini offers powerful LLMs with a generous free tier. Gemini Flash is fast and cheap, while Pro handles complex reasoning. Supports vision (analyze images), function calling, and structured outputs. The 1,500 requests/day limit is enough for most MVPs. Excellent for chatbots and content generation.',
    bestFor: 'Chatbots, content generation, text summarization, sentiment analysis, image analysis, AI features in MVPs',
    notGoodFor: 'High-volume production apps (rate limits), real-time streaming (use OpenAI), offline use (use Ollama)',
    keyDifferentiator: 'Most generous free tier among major LLM providers. Multimodal (text + vision) included.'
  },
  {
    id: 14,
    name: 'Ollama',
    category: 'AI Models',
    hook: 'Self-hosted AI. Completely free.',
    features: ['Run LLMs locally (Llama, Mistral, etc.)', 'No API costs', 'Full privacy (data never leaves)', 'Multiple models available'],
    perfectFor: 'Privacy-focused apps, unlimited usage',
    cost: 'Free (just your electricity)',
    url: 'https://ollama.ai',
    detailedDescription: 'Ollama lets you run powerful LLMs locally on your machine. Perfect for privacy-sensitive applications where data can\'t leave your infrastructure. No API costs mean unlimited usage. Supports Llama, Mistral, and many other models. Requires decent hardware (GPU recommended but not required).',
    bestFor: 'Privacy-focused apps, unlimited AI usage, offline AI, sensitive data processing, development/testing',
    notGoodFor: 'Production apps without GPU servers, mobile apps, apps needing latest GPT-4 level models',
    keyDifferentiator: 'Only way to run LLMs completely free with full privacy. Data never leaves your machine.'
  },
  {
    id: 15,
    name: 'NotebookLM',
    category: 'Brainstorming',
    hook: 'AI research assistant. Completely free.',
    features: ['Upload docs, PDFs, URLs', 'AI summarization', 'Generate podcasts from content', 'Citation tracking'],
    perfectFor: 'Research, content creation',
    cost: 'Free',
    url: 'https://notebooklm.google.com',
    detailedDescription: 'NotebookLM is Google\'s AI research assistant that turns documents into insights. Upload PDFs, docs, or URLs and ask questions with accurate citations. The podcast generation feature creates audio summaries of your content. Perfect for research, learning, and content repurposing. Completely free as a Google experiment.',
    bestFor: 'Research, studying, content summarization, podcast generation, learning from documents, citation-based Q&A',
    notGoodFor: 'Production apps (it\'s an experiment), API integration (no API), real-time data processing',
    keyDifferentiator: 'Only free tool that generates podcasts from documents. Best citation tracking in AI.'
  },
  // Vibe Coding (3)
  {
    id: 16,
    name: 'Windsurf',
    category: 'Vibe Coding',
    hook: 'The first agentic IDE.',
    features: ['Deep Context awareness', 'AI Flows', 'Multi-file edits', 'Command execution'],
    perfectFor: 'ChatGPT Pro or Claude Pro users',
    cost: 'Free tier (BYOK recommended)',
    url: 'https://codeium.com/windsurf',
    detailedDescription: 'Windsurf is the first agentic IDE that truly understands your codebase. While it has a basic free tier, it becomes the "deadliest combination" when you bring your own keys (Claude Code or Codex). It combines deep context awareness with agentic capabilities to plan, edit, and execute complex coding tasks across multiple files.',
    bestFor: 'Full-stack development, refactoring, understanding large codebases, agentic workflows',
    notGoodFor: 'Environments where you can\'t install a new IDE',
    keyDifferentiator: 'True agentic capabilities. Combining it with your own Claude/OpenAI keys makes it unstoppable for pro users.'
  },
  {
    id: 17,
    name: 'GitHub Copilot',
    category: 'Vibe Coding',
    hook: 'The world\'s most widely adopted AI developer tool.',
    features: ['AI code suggestions', 'Multi-line completions', 'Works in VS Code, JetBrains', 'Chat context awareness'],
    perfectFor: 'Professional developers, teams',
    cost: '$10/month (Free for students/OSS)',
    url: 'https://github.com/features/copilot',
    detailedDescription: 'GitHub Copilot is the market-leading AI coding assistant, trained on billions of lines of code. It suggests entire functions as you type, turning natural language prompts into code. Works seamlessly in VS Code, JetBrains, and Visual Studio. The standard for AI-assisted development.',
    bestFor: 'Speeding up development, boilerplate generation, learning new APIs, writing tests',
    notGoodFor: 'Complex architectural decisions, entirely novel algorithms without context',
    keyDifferentiator: 'Deepest integration with GitHub and the most widely used AI coding tool in the industry.'
  },
  {
    id: 18,
    name: 'Google Antigravity',
    category: 'Vibe Coding',
    hook: 'Experience liftoff with the next-generation IDE.',
    features: ['Agent-first IDE', 'Cross-surface synchronization', 'Browser-in-the-loop agents', 'Gemini 3 Flash integration'],
    perfectFor: 'Professional, Frontend, and Fullstack development',
    cost: 'Free',
    url: 'https://antigravity.google/',
    detailedDescription: 'Google Antigravity is an agentic development platform designed for the agent-first era. It evolves the traditional IDE into a synchronized environment where agents assist developers across the editor, terminal, and browser. Built for user trust, it orchestrates multiple agents to reduce context switching and improve efficiency.',
    bestFor: 'Learning to code, debugging, small projects, cloud-based development, no local setup needed',
    notGoodFor: 'Professional development (limited features), offline coding, complex enterprise projects',
    keyDifferentiator: 'Fully cloud-based IDE with AI built in. Zero local setup required to start coding.'
  },

  // Content & Design (5)
  {
    id: 19,
    name: 'Google Gemini (Image)',
    category: 'Content & Design',
    hook: 'Create images with Gemini Nano Banana.',
    features: ['Generates photorealistic images', 'Text-to-image', 'Multiple styles', 'High resolution'],
    perfectFor: 'Visual content, mockups',
    cost: 'Free tier',
    url: 'https://gemini.google.com', // Direct link to Gemini web UI where image gen is available
    detailedDescription: 'Google Gemini (powered by Gemini Nano Banana) generates high-quality images from text prompts. Create photorealistic scenes, artwork, and design elements directly within the Gemini interface. While rate limits apply, the free tier is capable for most casual and prototyping needs.',
    bestFor: 'Creating unique images, visual content for blogs/socials, design inspiration, rapid prototyping',
    notGoodFor: 'Bulk generation, copyrighted character consistency, precise text rendering in images',
    keyDifferentiator: 'State-of-the-art image generation (Gemini Nano Banana) integrated directly into Google\'s powerful AI assistant.'
  },
  // Brainstorming (3)
  {
    id: 30, // Using a new ID range to avoid conflict or reuse
    name: 'Perplexity',
    category: 'Brainstorming',
    hook: 'Search engine replacement. Cited answers.',
    features: ['Real-time web search', 'Cited sources', 'Follow-up questions', 'Pro search mode'],
    perfectFor: 'Research, fact-checking',
    cost: 'Free',
    url: 'https://perplexity.ai',
    detailedDescription: 'Perplexity is an AI-powered answer engine that searches the web and provides concise answers with citations. It\'s faster than Google for finding specific information and great for deep dives into topics. The Pro search (limited free uses) goes even deeper.',
    bestFor: 'Researching topics, finding facts quickly, technical answers, getting summaries of news',
    notGoodFor: 'Creative writing, coding (though capable, others are better specialized)',
    keyDifferentiator: 'Combines the knowledge of an LLM with real-time web search and sourcing.'
  },
  {
    id: 31,
    name: 'Claude',
    category: 'Brainstorming',
    hook: 'The best AI for thinking and writing.',
    features: ['Large context window', 'Nuanced writing', 'Artifacts UI', 'Project knowledge'],
    perfectFor: 'Brainstorming, long-form writing',
    cost: 'Free tier',
    url: 'https://claude.ai',
    detailedDescription: 'Claude by Anthropic is renowned for its natural, human-like writing and reasoning capabilities. The Artifacts UI allows you to preview code and documents side-by-side. Excellent for brainstorming complex ideas, writing drafts, and coding assistance.',
    bestFor: 'Brainstorming, refining ideas, writing blog posts/emails, coding with context, summarizing long docs',
    notGoodFor: 'Image generation (cannot generate images), real-time web search (no browsing)',
    keyDifferentiator: 'Superior reasoning and writing quality compared to most other models. Artifacts UI is game-changing.'
  },
  {
    id: 20,
    name: 'Leonardo AI',
    category: 'Content & Design',
    hook: '150 free credits daily. Unlimited images.',
    features: ['150 tokens/day (resets daily)', 'Multiple AI models', 'Image upscaling', 'Canvas editor'],
    perfectFor: 'Product mockups, marketing',
    cost: 'Free',
    url: 'https://leonardo.ai',
    detailedDescription: 'Leonardo AI offers 150 free credits daily for image generation. Unlike monthly limits, credits reset every day, so you can generate images consistently. Multiple AI models, upscaling, and a canvas editor make it versatile. Perfect for product mockups, marketing materials, and social media content.',
    bestFor: 'Product mockups, marketing images, social media content, concept art, UI mockups, daily content needs',
    notGoodFor: 'Bulk generation (daily limit), professional photography, print-quality images',
    keyDifferentiator: 'Daily credit reset means consistent free usage. More generous than monthly limits for regular users.'
  },
  {
    id: 21,
    name: 'SlidesGo',
    category: 'Content & Design',
    hook: 'Free Google Slides & PowerPoint templates.',
    features: ['Thousands of free templates', 'Google Slides & PowerPoint', 'Easy to edit', 'Various categories'],
    perfectFor: 'Presentations, pitch decks, education',
    cost: 'Free',
    url: 'https://slidesgo.com',
    detailedDescription: 'SlidesGo offers a vast library of free Google Slides and PowerPoint templates for creative presentations. Whether for business, education, or marketing, you\'ll find professional designs that are easy to customize. The free tier requires attribution but gives access to thousands of high-quality templates.',
    bestFor: 'Pitch decks, educational presentations, marketing slides, creative projects, quick design needs',
    notGoodFor: 'Users needing exclusive designs (templates are public), highly complex data visualizations',
    keyDifferentiator: 'Massive library of high-quality free templates for both Google Slides and PowerPoint.'
  },
  {
    id: 23,
    name: 'Remotion',
    category: 'Content & Design',
    hook: 'Code your videos. Open source.',
    features: ['Programmatic video creation', 'React-based', 'Export MP4', 'Full control over timing/animation'],
    perfectFor: 'Automated videos, demos',
    cost: 'Free (open source)',
    url: 'https://remotion.dev',
    detailedDescription: 'Remotion lets you create videos using React code. Perfect for automated video generation like product demos, social media content, or data visualizations. Write once, render thousands of variations. Open source and completely free. Rendering is CPU-intensive but you have full control over every frame.',
    bestFor: 'Automated video generation, product demos, social media videos, data visualizations, programmatic content',
    notGoodFor: 'Manual video editing, complex effects, users without coding skills, real-time rendering',
    keyDifferentiator: 'Only tool for programmatic video creation with React. Automate video generation at scale.'
  },
  // Productivity (1)
  {
    id: 24,
    name: 'Notion',
    category: 'Productivity',
    hook: 'Free personal workspace. Unlimited pages.',
    features: ['Unlimited pages & blocks', 'All block types (DB, Kanban, etc.)', '5MB file uploads', 'API access'],
    perfectFor: 'Docs, roadmaps, wikis',
    cost: 'Free',
    url: 'https://notion.so',
    detailedDescription: 'Notion is an all-in-one workspace for notes, docs, databases, and project management. The free personal plan has unlimited pages and all features except large file uploads. Perfect for solo builders to organize ideas, roadmaps, and documentation. Databases and Kanban boards make it versatile.',
    bestFor: 'Documentation, roadmaps, project management, wikis, note-taking, knowledge bases, personal organization',
    notGoodFor: 'Large file storage (5MB limit), real-time collaboration at scale, complex databases',
    keyDifferentiator: 'Most versatile free productivity tool. Combines docs, databases, and project management in one.'
  },
  // Testing & Code Quality (3)
  {
    id: 25,
    name: 'GitHub',
    category: 'Testing & Code Quality',
    hook: 'Free repos. Free CI/CD.',
    features: ['Unlimited private repos', '2,000 CI/CD minutes/month', 'GitHub Pages hosting', 'Project management'],
    perfectFor: 'Code hosting, automation',
    cost: 'Free',
    url: 'https://github.com',
    detailedDescription: 'GitHub is the industry standard for code hosting and version control. Free unlimited private repos, 2,000 CI/CD minutes for automated testing/deployment, and GitHub Pages for free static site hosting. Essential for any developer. GitHub Actions automates workflows without paying for separate CI/CD.',
    bestFor: 'Code hosting, version control, CI/CD, automated testing, static site hosting, collaboration',
    notGoodFor: 'Large file storage (use Git LFS), heavy CI/CD usage (2,000 min limit), non-code projects',
    keyDifferentiator: 'Industry standard with best free tier. Unlimited repos + CI/CD + Pages hosting all free.'
  },
  {
    id: 26,
    name: 'Coderabbit',
    category: 'Testing & Code Quality',
    hook: 'AI code reviews on every PR.',
    features: ['Automated PR reviews', 'Security vulnerability detection', 'Code quality suggestions', 'Free for open source'],
    perfectFor: 'Open source projects, code quality',
    cost: 'Free (open source), $12/month (private)',
    url: 'https://coderabbit.ai',
    detailedDescription: 'Coderabbit provides AI-powered code reviews on every pull request. It catches bugs, security vulnerabilities, and suggests improvements automatically. Free for open source projects, making it perfect for public repos. For private repos, $12/month is cheaper than hiring a code reviewer.',
    bestFor: 'Open source projects, automated code review, security scanning, code quality improvement, solo developers',
    notGoodFor: 'Private repos on a budget (paid), teams wanting human reviews, non-GitHub workflows',
    keyDifferentiator: 'Best AI code reviewer for open source. Free for public repos with professional-grade reviews.'
  },
  {
    id: 27,
    name: 'Playwright',
    category: 'Testing & Code Quality',
    hook: 'Browser automation. Open source.',
    features: ['Test automation for web apps', 'Cross-browser (Chrome, Firefox, Safari)', 'Record & replay tests', 'Completely free'],
    perfectFor: 'E2E testing, web scraping',
    cost: 'Free (open source)',
    url: 'https://playwright.dev',
    detailedDescription: 'Playwright is Microsoft\'s open-source browser automation tool for end-to-end testing. Test your web app across Chrome, Firefox, and Safari automatically. Record tests by clicking through your app, then replay them. Also great for web scraping. Completely free and actively maintained.',
    bestFor: 'E2E testing, automated testing, web scraping, browser automation, QA automation, regression testing',
    notGoodFor: 'Mobile app testing, API testing (use other tools), users unfamiliar with testing concepts',
    keyDifferentiator: 'Best free E2E testing tool. Cross-browser support and record/replay make it accessible for beginners.'
  },
  // Domains (2)
  {
    id: 28,
    name: 'Namecheap',
    category: 'Domains',
    hook: 'Probably your only cost if you want a custom domain.',
    features: ['.com domains', 'Free WHOIS privacy', 'DNS management', 'No upsell BS'],
    perfectFor: 'Most reliable, established registrar',
    cost: '~$10/year',
    url: 'https://namecheap.com',
    detailedDescription: 'Namecheap is a reliable, no-nonsense domain registrar with transparent pricing. ~$10/year for .com domains with free WHOIS privacy (hides your personal info). No aggressive upsells or hidden fees. Been around since 2000, so they\'re trustworthy. Your only real expense when building for $0.',
    bestFor: 'Domain registration, reliable registrar, transparent pricing, WHOIS privacy, established businesses',
    notGoodFor: 'Free solutions (domains cost money), users wanting bundled hosting (they separate concerns)',
    keyDifferentiator: 'Most trusted budget registrar. Free WHOIS privacy and no upsell tactics make it hassle-free.'
  },
  {
    id: 29,
    name: 'Spaceship',
    category: 'Domains',
    hook: 'Slightly cheaper. Cleaner interface.',
    features: ['.com domains', 'Free WHOIS privacy', 'Modern, clean UI', 'DNS management'],
    perfectFor: 'If you want a cleaner UI',
    cost: '~$9/year',
    url: 'https://spaceship.com',
    detailedDescription: 'Spaceship is a newer domain registrar (launched 2019) with a modern, clean interface. Slightly cheaper than Namecheap at ~$9/year for .com domains. Free WHOIS privacy included. The UI is more polished and user-friendly. Good alternative if you value design and ease of use.',
    bestFor: 'Domain registration, modern UI, slightly cheaper pricing, users who value design, new projects',
    notGoodFor: 'Users wanting established track record (newer company), complex domain management needs',
    keyDifferentiator: 'Best UI/UX among budget registrars. Slightly cheaper than Namecheap with modern design.'
  },
];
