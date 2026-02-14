import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, apiFetch } from '@/lib/auth';

const TIER_EMOJI = {
  unicorn_hunter: '🦄',
  head_intelligence: '🌐',
  lead_analyst: '🧠',
  field_agent: '🦾',
  onlooker: '🕵️',
};

export default function BadgeDisplay() {
  const { session } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!session) return;
    apiFetch('/api/votes/badges', {}, session)
      .then(setData)
      .catch(() => { });
  }, [session]);

  try {
    if (!data || !data.count || data.count === 0) return null;

    const emoji = TIER_EMOJI[data.tier] || '🕵️';

    return (
      <Link href="/profile" className="flex items-center gap-1.5 px-3 py-1 border-2 border-black bg-yellow-100 hover:bg-yellow-200 transition-colors comic-body text-sm font-bold text-black">
        <span>{emoji}</span>
        <span>{data.count}</span>
      </Link>
    );
  } catch (err) {
    console.error('BadgeDisplay rendering error:', err);
    return null;
  }
}
