import Header from './Header';
import Footer from './Footer';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/react';

const AuthModal = dynamic(() => import('@/components/AuthModal'), {
    loading: () => null,
});
const SubscribeModal = dynamic(() => import('@/components/SubscribeModal'), {
    loading: () => null,
});
const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), {
    loading: () => null,
});

export default function Layout({ children, headerVariant }) {
    const showCommon = headerVariant !== 'none';

    return (
        <>
            {showCommon && <Header variant={headerVariant} />}
            {children}
            {showCommon && <Footer />}
            <AuthModal />
            <SubscribeModal />
            <ScrollToTop />
            <Analytics />
            <div id="mobile-menu-portal" />
        </>
    );
}
