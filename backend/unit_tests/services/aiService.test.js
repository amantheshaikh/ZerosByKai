import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../../src/services/aiService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the @google/generative-ai module
vi.mock('@google/generative-ai', () => {
    const generateContentMock = vi.fn();
    const getGenerativeModelMock = vi.fn(() => ({
        generateContent: generateContentMock
    }));

    // Mock constructor
    const GoogleGenerativeAI = vi.fn().mockImplementation(function () {
        this.getGenerativeModel = getGenerativeModelMock;
        return this;
    });

    return { GoogleGenerativeAI };
});

describe('AIService', () => {
    let aiService;
    const mockConfig = {
        gemini: {
            apiKey: 'test-api-key',
            models: {
                primary: 'gemini-1.5-pro',
                fallback: 'gemini-1.5-flash',
                fallbackBackup: 'gemini-1.0-pro'
            }
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        aiService = new AIService(mockConfig);
    });

    describe('constructor()', () => {
        it('should initialize with correct config', () => {
            expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
            expect(aiService.models).toEqual(mockConfig.gemini.models);
            expect(aiService.exclusionList).toEqual([]);
        });
    });

    describe('setExclusionList()', () => {
        it('should update exclusion list', () => {
            const titles = ['Idea 1', 'Idea 2'];
            aiService.setExclusionList(titles);
            expect(aiService.exclusionList).toEqual(titles);
        });
    });

    describe('generateIdeas()', () => {
        const mockPosts = [
            { title: 'Pain point 1', body: 'This is hard' },
            { title: 'Pain point 2', body: 'This is also hard' }
        ];

        it('should throw error if posts is not an array or empty', async () => {
            await expect(aiService.generateIdeas(null, 10)).rejects.toThrow('Posts array is required');
            await expect(aiService.generateIdeas([], 10)).rejects.toThrow('Posts array is required');
        });

        it('should cap generation count between 1 and 50', async () => {
            const mockResponse = {
                response: {
                    text: () => JSON.stringify([{ name: 'Test Idea', title: 'Test', tags: [], problem: '', solution: '', target: '', why: '' }])
                }
            };
            const genAIInstance = new GoogleGenerativeAI();
            const modelMock = genAIInstance.getGenerativeModel();
            modelMock.generateContent.mockResolvedValue(mockResponse);

            // Test high count
            await aiService.generateIdeas(mockPosts, 100);
            expect(modelMock.generateContent).toHaveBeenCalledWith(expect.stringContaining('Generate 50 distinct'));

            // Test low count
            await aiService.generateIdeas(mockPosts, -5);
            expect(modelMock.generateContent).toHaveBeenCalledWith(expect.stringContaining('Generate 1 distinct'));
        });

        it('should sanitize and truncate posts', async () => {
            const longPost = [{ title: 'a'.repeat(2000), body: 'b'.repeat(10000) }];
            const mockResponse = {
                response: {
                    text: () => JSON.stringify([])
                }
            };
            const modelMock = new GoogleGenerativeAI().getGenerativeModel();
            modelMock.generateContent.mockResolvedValue(mockResponse);

            await aiService.generateIdeas(longPost, 5);

            const prompt = modelMock.generateContent.mock.calls[0][0];
            expect(prompt.length).toBeLessThan(12000); // Truncated length should be within limits
            expect(prompt).not.toContain('a'.repeat(2000));
            expect(prompt).toContain('a'.repeat(1000));
        });

        it('should trim exclusion list to last 100 items', async () => {
            const largeExclusionList = Array.from({ length: 150 }, (_, i) => `Idea ${i}`);
            aiService.setExclusionList(largeExclusionList);

            const mockResponse = {
                response: {
                    text: () => JSON.stringify([])
                }
            };
            const modelMock = new GoogleGenerativeAI().getGenerativeModel();
            modelMock.generateContent.mockResolvedValue(mockResponse);

            await aiService.generateIdeas(mockPosts, 5);

            const prompt = modelMock.generateContent.mock.calls[0][0];
            expect(prompt).toContain('Idea 149');
            expect(prompt).not.toContain('Idea 0');
        });

        it('should handle multi-model fallback chain', async () => {
            const genAIInstance = new GoogleGenerativeAI();
            const modelMock = genAIInstance.getGenerativeModel();

            // First two models fail, third succeeds
            modelMock.generateContent
                .mockRejectedValueOnce(new Error('Primary Failed'))
                .mockRejectedValueOnce(new Error('Fallback Failed'))
                .mockResolvedValueOnce({
                    response: {
                        text: () => JSON.stringify([{ name: 'Success Idea' }])
                    }
                });

            const result = await aiService.generateIdeas(mockPosts, 5);
            expect(result[0].name).toBe('Success Idea');
            expect(modelMock.generateContent).toHaveBeenCalledTimes(3);
        });

        it('should retry on 429 rate limit error', async () => {
            vi.useFakeTimers();
            const genAIInstance = new GoogleGenerativeAI();
            const modelMock = genAIInstance.getGenerativeModel();

            // First call 429, second success
            modelMock.generateContent
                .mockRejectedValueOnce(new Error('429 Rate Limit'))
                .mockResolvedValueOnce({
                    response: {
                        text: () => JSON.stringify([{ name: 'Success After Wait' }])
                    }
                });

            const promise = aiService.generateIdeas(mockPosts, 5);

            // Advance timers to trigger retry
            await vi.runAllTimersAsync();

            const result = await promise;
            expect(result[0].name).toBe('Success After Wait');
            expect(modelMock.generateContent).toHaveBeenCalledTimes(2);
            vi.useRealTimers();
        });

        it('should throw error if AI does not return an array', async () => {
            const modelMock = new GoogleGenerativeAI().getGenerativeModel();
            modelMock.generateContent.mockResolvedValue({
                response: {
                    text: () => JSON.stringify({ not: 'an array' })
                }
            });

            await expect(aiService.generateIdeas(mockPosts, 5)).rejects.toThrow('AI did not return an array');
        });
    });

    describe('dedupeAndSynthesizeIdeas()', () => {
        it('should return empty array if no ideas provided', async () => {
            const result = await aiService.dedupeAndSynthesizeIdeas({});
            expect(result).toEqual([]);
        });

        it('should format and send ideas for synthesis', async () => {
            const input = {
                reddit: [{ title: 'R1', problem: 'P1', solution: 'S1' }],
                hn: [{ title: 'H1', problem: 'P2', solution: 'S2' }]
            };
            const mockResponse = {
                response: {
                    text: () => JSON.stringify([{ title: 'Synthesized Idea' }])
                }
            };
            const modelMock = new GoogleGenerativeAI().getGenerativeModel();
            modelMock.generateContent.mockResolvedValue(mockResponse);

            const result = await aiService.dedupeAndSynthesizeIdeas(input);
            expect(result[0].title).toBe('Synthesized Idea');

            const prompt = modelMock.generateContent.mock.calls[0][0];
            expect(prompt).toContain('R1');
            expect(prompt).toContain('H1');
        });
    });

    describe('generateNewsletterSubject()', () => {
        it('should use fallback if ideas are missing', async () => {
            const result = await aiService.generateNewsletterSubject([], null);
            expect(result.subject).toBe("Kai's Zeros: This Week's Startup Opportunities");
        });

        it('should generate subject using AI', async () => {
            const ideas = [{ title: 'Idea 1', tags: ['T1'] }];
            const winner = { name: 'Winner', title: 'Winner Title' };
            const mockResponse = {
                response: {
                    text: () => JSON.stringify({ subject: 'AI Generated Subject' })
                }
            };
            const modelMock = new GoogleGenerativeAI().getGenerativeModel();
            modelMock.generateContent.mockResolvedValue(mockResponse);

            const result = await aiService.generateNewsletterSubject(ideas, winner);
            expect(result).toBe('AI Generated Subject');

            const prompt = modelMock.generateContent.mock.calls[0][0];
            expect(prompt).toContain('Idea 1');
            expect(prompt).toContain('Winner Title');
        });
    });

    describe('_callGeminiGeneric()', () => {
        it('should clean and parse JSON even with markdown formatting', async () => {
            const modelMock = new GoogleGenerativeAI().getGenerativeModel();
            modelMock.generateContent.mockResolvedValue({
                response: {
                    text: () => '```json\n{"key": "value"}\n```'
                }
            });

            const result = await aiService._callGeminiGeneric('model', 'prompt');
            expect(result).toEqual({ key: 'value' });
        });

        it('should throw error on invalid JSON', async () => {
            const modelMock = new GoogleGenerativeAI().getGenerativeModel();
            modelMock.generateContent.mockResolvedValue({
                response: {
                    text: () => 'Not JSON'
                }
            });

            await expect(aiService._callGeminiGeneric('model', 'prompt')).rejects.toThrow('Failed to parse AI response as JSON');
        });
    });
});
