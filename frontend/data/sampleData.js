// Static sample/fallback data, constants, and schema used by the landing page

export const LIVE_SIGNAL_SOURCES = ['Reddit', 'Hacker News', 'X (Twitter)', 'Indie Hackers'];

export const MISSION_DESIGNATIONS = [
    { img: '/badges/bronze-circle.png', title: 'ONLOOKER', tier: '0-2 winning picks', color: 'text-gray-400', special: '' },
    { img: '/badges/silver-pentagon.png', title: 'FIELD AGENT', tier: '3-6 winning picks', color: 'text-gray-300', special: '' },
    { img: '/badges/gold-hexagon.png', title: 'LEAD ANALYST', tier: '7-11 winning picks', color: 'text-yellow-400', special: '' },
    { img: '/badges/platinum-shield.png', title: 'HEAD OF INTEL', tier: '12-19 winning picks', color: 'text-yellow-500', special: 'Expert' },
    { img: '/badges/unicorn-prism.png', title: 'UNICORN HUNTER', tier: '20+ winning picks', color: 'text-indigo-400', special: 'Legendary' }
];

export const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "How does Zeros By Kai find profitable startup ideas?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Zeros By Kai uses an AI analyst (Kai) to scan millions of online conversations on Reddit, X, and Hacker News. We identify 'complaint clusters' where real people are struggling with specific pain points, ensuring every startup idea we provide is based on proven market demand."
            }
        },
        {
            "@type": "Question",
            "name": "Why are these ideas better than a random AI idea generator?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Unlike random generators that combine keywords (e.g., 'Uber for Cats'), Zeros By Kai uses social listening and sentiment analysis. We only surface opportunities where there is demonstrable 'willingness to pay' and where existing solutions are failing users."
            }
        },
        {
            "@type": "Question",
            "name": "What type of business models are covered in the newsletter?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our weekly startup stash focuses on high-leverage digital models: SaaS, Micro-SaaS, B2B services, and newsletter opportunities. We prioritize niches like DevTools, Marketing Tech, and Productivity where solo founders can build and scale quickly."
            }
        },
        {
            "@type": "Question",
            "name": "How are startup ideas validated by Zeros By Kai?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our validation process involves four checks: 1) Detecting a complaint cluster. 2) Measuring frustration intensity. 3) Identifying 'gap signals' in existing products. 4) Preliminary market size vetting. Only ideas that pass all four stages are delivered to your inbox."
            }
        },
        {
            "@type": "Question",
            "name": "Who should subscribe to Zeros By Kai?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Zeros By Kai is built for Indie Hackers, Solopreneurs, and Developers who can ship code but struggle to find a winning idea. It's the primary resource for builders who want to stop brainstorming and start building validated products."
            }
        },
        {
            "@type": "Question",
            "name": "Is Zeros By Kai a free startup idea resource?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, Zeros By Kai is free. Every Monday, you get 10 fresh, validated startup ideas delivered to your inbox. There is no paywall for our weekly curation—our mission is to help more founders build products that solve real problems."
            }
        }
    ]
};

export const sampleIdeas = [
    {
        id: 1,
        name: "SubScribe",
        title: "Automated SaaS Waste Detector for Small Teams",
        tags: ["🌍 Global", "FinOps", "SaaS"],
        problem: "Small teams bleed money on forgotten subscriptions and duplicate tools, often tracking spend in messy spreadsheets that nobody updates.",
        solution: "A 'set and forget' tool that connects to bank feeds/email to flag unused seats and duplicate SaaS tools instantly.",
        target_audience: "Bootstrapped teams & agencies with 5-50 employees.",
        why_it_matters: "Subscription fatigue is at an all-time high. Companies waste ~30% of software spend."
    },
    {
        id: 2,
        name: "FocusFoundry",
        title: "AI Boss for Remote Solopreneurs",
        tags: ["🌍 Global", "Productivity", "Solopreneur"],
        problem: "Solo founders struggle with 'drifting'—losing weeks to minor tasks because they lack the accountability of a manager or team.",
        solution: "An AI manager that plans your sprint, blocks distractions during deep work, and demands a daily EOD standup.",
        target_audience: "Remote solopreneurs and indie hackers.",
        why_it_matters: "Loneliness and lack of structure are the #1 killers of early-stage startups."
    },
    {
        id: 3,
        name: "SpyGlass",
        title: "Real-Time Competitor Change Tracker",
        tags: ["🌍 Global", "E-commerce", "SaaS"],
        problem: "Small e-commerce brands find out too late when competitors drop prices or launch copycat products, losing sales in the process.",
        solution: "A silent monitor that alerts you *only* when a competitor changes pricing, copy, or stock levels on their storefront.",
        target_audience: "Shopify store owners doing $10k-$1M/year.",
        why_it_matters: "Competitive intelligence is currently an expensive Enterprise-only luxury."
    },
    {
        id: 4,
        name: "NoCodeX",
        title: "Automated Technical Auditor for Bubble Apps",
        tags: ["🇺🇸 USA", "DevTools", "NoCode"],
        problem: "Non-technical founders build complex No-Code apps that inevitably slow down or break as they scale, with no way to debug.",
        solution: "A 'Lighthouse for No-Code' that scans Bubble/Webflow setups for security risks, redundancy, and performance bottlenecks.",
        target_audience: "No-code agencies and non-technical founders.",
        why_it_matters: "No-code adoption is exploding, but 'technical debt' in no-code is a silent killer."
    },
    {
        id: 5,
        name: "MultiPost",
        title: "Context-Aware 'Build in Public' Publisher",
        tags: ["🌍 Global", "Marketing", "Creator Economy"],
        problem: "Founders know they should 'build in public', but formatting the same update for LinkedIn, Twitter, and Reddit takes hours.",
        solution: "Write one raw update; AI reformats it perfectly for each platform's distinct culture (e.g., professional for LI, casual for X).",
        target_audience: "Indie hackers and personal brands.",
        why_it_matters: "Content is the primary growth engine for bootstrapped startups today."
    },
    {
        id: 6,
        name: "NichePick",
        title: "Instant Feedback from Verified Professionals",
        tags: ["🇪🇺 Europe", "Research", "B2B"],
        problem: "You need feedback from a 'German Dentist', but consumer panels only give you random people who don't understand your B2B product.",
        solution: "A micro-consulting marketplace where you pay $10 for 15 mins of feedback from verified industry-specific professionals.",
        target_audience: "B2B founders validating niche verticals.",
        why_it_matters: "Validation is cheap; *accurate* validation is rare and expensive."
    },
    {
        id: 7,
        name: "GapFinder",
        title: "Social Sentiment Opportunity Scanner",
        tags: ["🌍 Global", "AI Analytics", "Research"],
        problem: "Finding business ideas requires reading thousands of comments to find the one person saying 'I wish this existed.'",
        solution: "An NLP engine that scrapes Reddit/X for 'complaint clusters' and groups them into validated problem statements.",
        target_audience: "Serial entrepreneurs and product managers.",
        why_it_matters: "Automating the 'Idea Maze' is the holy grail for builders."
    },
    {
        id: 8,
        name: "SoloOS",
        title: "Modular Admin Middleware for Freelancers",
        tags: ["🌍 Global", "SaaS", "Freelance"],
        problem: "Freelancers are forced to choose between complex ERPs (Salesforce) or disjointed tools (Trello + InvoiceNinja + CRM).",
        solution: "A modular 'operating system' where you toggle features on/off. Start with just invoicing, add CRM later. No bloat.",
        target_audience: "Designers, developers, and consultants.",
        why_it_matters: "The gig economy needs 'just enough' software, not enterprise bloat."
    },
    {
        id: 9,
        name: "WarmStart",
        title: "No-Sales Outreach Automation",
        tags: ["🇺🇸 USA", "Sales", "B2B"],
        problem: "Technical founders are terrified of cold outreach and often build in silence rather than selling to their first 10 customers.",
        solution: "A tool that identifies warm intro paths via existing networks and automates the 'ask' without feeling salesy.",
        target_audience: "Introverted technical founders.",
        why_it_matters: "Distribution is the biggest failure point for developer-led startups."
    },
    {
        id: 10,
        name: "LocalizeIt",
        title: "Market Adaptation Intelligence",
        tags: ["APAC", "Strategic", "Business"],
        problem: "US-based ideas often fail abroad because they ignore local payment preferences, cultural nuances, or privacy laws.",
        solution: "An intelligence layer that analyzes a business model and flags 'blockers' for specific regions (e.g., 'India requires UPI').",
        target_audience: "Startups expanding to emerging markets.",
        why_it_matters: "Copy-pasting US success stories is a popular but risky global strategy."
    }
];

export const sampleWinners = [
    {
        name: "GovJob Resume AI",
        title: "AI-Powered Resume Formatter for Government Jobs",
        votes: 89,
        tags: ["🇺🇸 USA", "EdTech", "AI"],
        problem: "Job seekers spend hours formatting resumes to match specific government application requirements, often getting rejected due to formatting errors rather than qualifications.",
        solution: "An AI tool that auto-formats any resume to match strict government templates instantly, increasing acceptance rates.",
        target_audience: "Government job seekers in the USA.",
        why_it_matters: "Federal hiring is complex; 40% of applicants are rejected for formatting."
    },
    {
        name: "LocalMedic",
        title: "Telehealth aggregator for rural communities",
        votes: 64,
        tags: ["🌍 Global", "HealthTech", "Telehealth"],
        problem: "Rural patients travel 50+ miles for basic consults because they can't easily find which specialists take their insurance remotely.",
        solution: "A localized directory connecting rural patients with telehealth-ready specialists who accept their specific state insurance.",
        target_audience: "Rural residents in medical deserts.",
        why_it_matters: "Access to specialized care is the #1 health challenge in rural areas."
    },
    {
        name: "AgriDrone",
        title: "Crop monitoring for small-scale farmers",
        votes: 51,
        tags: ["🌍 Global", "AgTech", "Drones"],
        problem: "Satellite data is too expensive for small farms, leaving them guessing about crop health until it's too late.",
        solution: "A service using low-cost community drones to provide weekly crop health precision maps to small cooperative farmers.",
        target_audience: "Small cooperatives in developing nations.",
        why_it_matters: "Early disease detection can save up to 20% of annual crop yields."
    }
];
