import { useState } from 'react';
import { getApiUrl } from '@/lib/auth';

export function useSubscribe() {
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [error, setError] = useState('');

    const subscribe = async ({ email, name }) => {
        setStatus('loading');
        setError('');
        try {
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            setStatus('success');
            return true;
        } catch (err) {
            setError(err.message);
            setStatus('error');
            return false;
        }
    };

    const reset = () => {
        setStatus('idle');
        setError('');
    };

    return { subscribe, status, error, reset };
}
