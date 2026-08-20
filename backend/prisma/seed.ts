import { PrismaClient, Provider } from '@prisma/client';
const prisma = new PrismaClient();
const models = [
  ['gpt-4o-mini','openai','GPT-4o Mini','128k','Fast','OpenAI compact model'],
  ['gpt-4o','openai','GPT-4o','128k','Medium','OpenAI general reasoning model'],
  ['claude-3-5-sonnet','anthropic','Claude 3.5 Sonnet','200k','Medium','Anthropic coding model'],
  ['gemini-2.5-pro','google','Gemini 2.5 Pro','1m','Medium','Google large-context model'],
  ['deepseek-chat','deepseek','DeepSeek Chat','64k','Fast','DeepSeek coding model']
] as const;
async function main(): Promise<void> {
  try {
    for (const [modelId, provider, displayName, contextWindow, latency, description] of models) {
      await prisma.aIModelConfig.upsert({ where: { modelId }, update: { displayName, contextWindow, latency, description, enabled: true }, create: { modelId, provider: provider as Provider, displayName, contextWindow, latency, description, enabled: true } });
    }
  } finally {
    await prisma.$disconnect();
  }
}
void main();
