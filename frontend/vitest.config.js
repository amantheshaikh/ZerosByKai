import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            'estree-walker': path.resolve(__dirname, 'node_modules/estree-walker/src/index.js'),
            '@rolldown/pluginutils': path.resolve(__dirname, 'node_modules/@rolldown/pluginutils/dist/index.js'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.jsx'],
        testTimeout: 20000,
        hookTimeout: 20000,
        isolate: true,
    },
    esbuild: {
        loader: 'jsx',
        include: /.*\.(jsx?|tsx?)$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
});
