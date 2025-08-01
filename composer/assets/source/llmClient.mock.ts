// Mock responses for different types of prompts
const mockResponses = {
    summarize: [
        "This article discusses the latest developments in blockchain technology and its impact on decentralized finance. Key points include the emergence of new consensus mechanisms, improved scalability solutions, and growing institutional adoption.",
        "The cryptocurrency market continues to evolve with new regulatory frameworks being established globally. This analysis covers recent policy changes, market reactions, and potential implications for digital asset adoption.",
        "Recent trends in DeFi protocols show increased focus on security and user experience. The article examines new lending mechanisms, yield farming strategies, and cross-chain interoperability solutions."
    ],
    title: [
        "Breaking: Major Cryptocurrency Exchange Announces New Security Features",
        "DeFi Protocol Launches Revolutionary Yield Farming Mechanism",
        "Regulatory Update: New Guidelines for Digital Asset Trading",
        "Blockchain Innovation: Next-Generation Consensus Algorithm Unveiled",
        "Market Analysis: Cryptocurrency Adoption Reaches New Milestone"
    ],
    general: [
        "The blockchain ecosystem continues to mature with new innovations emerging across various sectors including finance, supply chain, and digital identity management.",
        "Recent developments in cryptocurrency technology demonstrate significant progress in addressing scalability, security, and usability challenges that have historically limited mainstream adoption.",
        "The integration of artificial intelligence with blockchain technology is creating new opportunities for automated trading, smart contract optimization, and predictive market analysis."
    ]
};

// Helper function to detect prompt type
function detectPromptType(prompt: string): keyof typeof mockResponses {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
        return 'summarize';
    }
    if (lowerPrompt.includes('title') || lowerPrompt.includes('headline')) {
        return 'title';
    }
    return 'general';
}

// Helper function to add realistic delay
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callLLM(prompt: string): Promise<string> {
    // Simulate network delay (500-2000ms)
    const delayTime = Math.floor(Math.random() * 1500) + 500;
    await delay(delayTime);

    // Simulate occasional API errors (5% chance)
    if (Math.random() < 0.05) {
        throw new Error('Mock API error: Service temporarily unavailable');
    }

    // Detect prompt type and select appropriate response pool
    const promptType = detectPromptType(prompt);
    const responses = mockResponses[promptType];

    // Select a random response from the appropriate pool
    const randomIndex = Math.floor(Math.random() * responses.length);
    const selectedResponse = responses[randomIndex];

    // Add some variation to make responses feel more dynamic
    const variations = [
        selectedResponse,
        `${selectedResponse} This represents current market trends and technological advancements.`,
        `Based on recent analysis: ${selectedResponse}`,
        `${selectedResponse} These developments are shaping the future of digital finance.`
    ];

    const finalResponse = variations[Math.floor(Math.random() * variations.length)];

    console.log(`[MOCK LLM] Prompt type: ${promptType}, Response length: ${finalResponse.length} chars`);

    return finalResponse;
}