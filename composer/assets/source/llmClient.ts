export async function callLLM(prompt: string): Promise<string> {
    // Simulate latency
    await new Promise(res => setTimeout(res, 300));

    // Mock response
    return `[MOCKED LLM RESPONSE]:\n---\n${prompt}\n---\n(This would be the actual model output.)`;
}
