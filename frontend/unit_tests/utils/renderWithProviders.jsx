import React from 'react';
import { render } from '@testing-library/react';
import { useAuth } from '@/lib/auth';
import { vi } from 'vitest';

/**
 * Custom render helper that provides initial auth state
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Custom options including initialAuthState
 */
export function renderWithProviders(ui, { initialAuthState = {}, ...renderOptions } = {}) {
    const defaultAuthState = {
        user: null,
        showAuthModal: false,
        showSubscribeModal: false,
        showFeedbackModal: false,
        openAuthModal: vi.fn(),
        closeAuthModal: vi.fn(),
        openSubscribeModal: vi.fn(),
        closeSubscribeModal: vi.fn(),
        openFeedbackModal: vi.fn(),
        closeFeedbackModal: vi.fn(),
        signInWithProvider: vi.fn(),
        signOut: vi.fn(),
        subscribeNewsletter: vi.fn(),
        ...initialAuthState
    };

    useAuth.mockReturnValue(defaultAuthState);

    return {
        ...render(ui, renderOptions),
        authState: defaultAuthState,
    };
}
