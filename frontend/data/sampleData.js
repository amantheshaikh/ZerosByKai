// Static sample/fallback data and schema used by the landing page

export const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "What is ZerosByKai?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "ZerosByKai is a free weekly startup ideas newsletter. Every Monday, Kai curates 10 validated business opportunities by analyzing thousands of Reddit threads to find real pain points people are willing to pay to solve."
            }
        },
        {
            "@type": "Question",
            "name": "How does ZerosByKai find startup ideas?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Kai uses AI to analyze 20+ subreddits and thousands of Reddit threads weekly, looking for complaint clusters and validated pain points. These are turned into actionable startup opportunities with problem statements, solution ideas, target audiences, and market potential."
            }
        },
        {
            "@type": "Question",
            "name": "Is ZerosByKai free?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, ZerosByKai is 100% free. You can subscribe to the weekly newsletter or create an account to vote on ideas and earn badges. There is no paid tier."
            }
        },
        {
            "@type": "Question",
            "name": "What are Zero Finder badges?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Zero Finder badges are earned when you vote for the winning startup idea of the week. Badges stack across tiers: Bronze (1-2 picks), Silver (3-5), Gold (6-10), and Diamond (11+). They prove your ability to spot winning business opportunities."
            }
        },
        {
            "@type": "Question",
            "name": "Who is ZerosByKai for?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "ZerosByKai is for entrepreneurs, indie hackers, solopreneurs, builders, and investors looking for validated startup ideas and business opportunities backed by real market demand from Reddit communities."
            }
        }
    ]
};

export const sampleIdeas = [
    {
        id: 1,
        name: "SubScribe",
        title: "Automated SaaS Waste Detector for Small Teams",
        tag: "🌍 Global",
        category: "FinOps",
        problem: "Small teams bleed money on forgotten subscriptions and duplicate tools, often tracking spend in messy spreadsheets that nobody updates.",
        solution: "A 'set and forget' tool that connects to bank feeds/email to flag unused seats and duplicate SaaS tools instantly.",
        target: "Bootstrapped teams & agencies with 5-50 employees.",
        why: "Subscription fatigue is at an all-time high. Companies waste ~30% of software spend."
    },
    {
        id: 2,
        name: "FocusFoundry",
        title: "AI Boss for Remote Solopreneurs",
        tag: "🌍 Global",
        category: "Productivity",
        problem: "Solo founders struggle with 'drifting'—losing weeks to minor tasks because they lack the accountability of a manager or team.",
        solution: "An AI manager that plans your sprint, blocks distractions during deep work, and demands a daily EOD standup.",
        target: "Remote solopreneurs and indie hackers.",
        why: "Loneliness and lack of structure are the #1 killers of early-stage startups."
    },
    {
        id: 3,
        name: "SpyGlass",
        title: "Real-Time Competitor Change Tracker",
        tag: "🌍 Global",
        category: "E-commerce",
        problem: "Small e-commerce brands find out too late when competitors drop prices or launch copycat products, losing sales in the process.",
        solution: "A silent monitor that alerts you *only* when a competitor changes pricing, copy, or stock levels on their storefront.",
        target: "Shopify store owners doing $10k-$1M/year.",
        why: "Competitive intelligence is currently an expensive Enterprise-only luxury."
    },
    {
        id: 4,
        name: "NoCodeX",
        title: "Automated Technical Auditor for Bubble Apps",
        tag: "🇺🇸 USA",
        category: "DevTools",
        problem: "Non-technical founders build complex No-Code apps that inevitably slow down or break as they scale, with no way to debug.",
        solution: "A 'Lighthouse for No-Code' that scans Bubble/Webflow setups for security risks, redundancy, and performance bottlenecks.",
        target: "No-code agencies and non-technical founders.",
        why: "No-code adoption is exploding, but 'technical debt' in no-code is a silent killer."
    },
    {
        id: 5,
        name: "MultiPost",
        title: "Context-Aware 'Build in Public' Publisher",
        tag: "🌍 Global",
        category: "Marketing",
        problem: "Founders know they should 'build in public', but formatting the same update for LinkedIn, Twitter, and Reddit takes hours.",
        solution: "Write one raw update; AI reformats it perfectly for each platform's distinct culture (e.g., professional for LI, casual for X).",
        target: "Indie hackers and personal brands.",
        why: "Content is the primary growth engine for bootstrapped startups today."
    },
    {
        id: 6,
        name: "NichePick",
        title: "Instant Feedback from Verified Professionals",
        tag: "🇪🇺 Europe",
        category: "Research",
        problem: "You need feedback from a 'German Dentist', but consumer panels only give you random people who don't understand your B2B product.",
        solution: "A micro-consulting marketplace where you pay $10 for 15 mins of feedback from verified industry-specific professionals.",
        target: "B2B founders validating niche verticals.",
        why: "Validation is cheap; *accurate* validation is rare and expensive."
    },
    {
        id: 7,
        name: "GapFinder",
        title: "Social Sentiment Opportunity Scanner",
        tag: "🌍 Global",
        category: "AI Analytics",
        problem: "Finding business ideas requires reading thousands of comments to find the one person saying 'I wish this existed.'",
        solution: "An NLP engine that scrapes Reddit/X for 'complaint clusters' and groups them into validated problem statements.",
        target: "Serial entrepreneurs and product managers.",
        why: "Automating the 'Idea Maze' is the holy grail for builders."
    },
    {
        id: 8,
        name: "SoloOS",
        title: "Modular Admin Middleware for Freelancers",
        tag: "🌍 Global",
        category: "SaaS",
        problem: "Freelancers are forced to choose between complex ERPs (Salesforce) or disjointed tools (Trello + InvoiceNinja + CRM).",
        solution: "A modular 'operating system' where you toggle features on/off. Start with just invoicing, add CRM later. No bloat.",
        target: "Designers, developers, and consultants.",
        why: "The gig economy needs 'just enough' software, not enterprise bloat."
    },
    {
        id: 9,
        name: "WarmStart",
        title: "No-Sales Outreach Automation",
        tag: "🇺🇸 USA",
        category: "Sales",
        problem: "Technical founders are terrified of cold outreach and often build in silence rather than selling to their first 10 customers.",
        solution: "A tool that identifies warm intro paths via existing networks and automates the 'ask' without feeling salesy.",
        target: "Introverted technical founders.",
        why: "Distribution is the biggest failure point for developer-led startups."
    },
    {
        id: 10,
        name: "LocalizeIt",
        title: "Market Adaptation Intelligence",
        tag: "APAC",
        category: "Strategic",
        problem: "US-based ideas often fail abroad because they ignore local payment preferences, cultural nuances, or privacy laws.",
        solution: "An intelligence layer that analyzes a business model and flags 'blockers' for specific regions (e.g., 'India requires UPI').",
        target: "Startups expanding to emerging markets.",
        why: "Copy-pasting US success stories is a popular but risky global strategy."
    }
];

export const sampleWinners = [
    {
        name: "GovJob Resume AI",
        title: "AI-Powered Resume Formatter for Government Jobs",
        votes: 89,
        category: "EdTech",
        problem: "Job seekers spend hours formatting resumes to match specific government application requirements, often getting rejected due to formatting errors rather than qualifications.",
        solution: "An AI tool that auto-formats any resume to match strict government templates instantly, increasing acceptance rates."
    },
    {
        name: "LocalMedic",
        title: "Telehealth aggregator for rural communities",
        votes: 64,
        category: "HealthTech",
        problem: "Rural patients travel 50+ miles for basic consults because they can't easily find which specialists take their insurance remotely.",
        solution: "A localized directory connecting rural patients with telehealth-ready specialists who accept their specific state insurance."
    },
    {
        name: "AgriDrone",
        title: "Crop monitoring for small-scale farmers",
        votes: 51,
        category: "AgTech",
        problem: "Satellite data is too expensive for small farms, leaving them guessing about crop health until it's too late.",
        solution: "A service using low-cost community drones to provide weekly crop health precision maps to small cooperative farmers."
    }
];
