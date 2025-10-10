/**
 * Azure OpenAI Client
 * Handles all interactions with Azure OpenAI API
 */

export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  modelName: string;
  apiVersion: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Get Azure OpenAI configuration from environment
 */
export function getAzureConfig(): AzureConfig {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
  const apiKey = process.env.AZURE_OPENAI_KEY || '';
  const modelName = process.env.AZURE_MODEL_NAME || 'gpt-4o-mini';
  const apiVersion = process.env.AZURE_API_VERSION || '2024-08-01-preview';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI credentials not configured');
  }

  return { endpoint, apiKey, modelName, apiVersion };
}

/**
 * Call Azure OpenAI Chat Completion API
 */
export async function chatCompletion(
  request: ChatCompletionRequest,
  config?: Partial<AzureConfig>
): Promise<string> {
  const azureConfig = { ...getAzureConfig(), ...config };

  // Build the full endpoint URL
  const url = `${azureConfig.endpoint}/openai/deployments/${azureConfig.modelName}/chat/completions?api-version=${azureConfig.apiVersion}`;

  const body = {
    messages: request.messages,
    temperature: request.temperature ?? 0.3,
    max_tokens: request.max_tokens ?? 2000,
    top_p: request.top_p ?? 0.95,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureConfig.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data: ChatCompletionResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No completion choices returned from Azure OpenAI');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Azure OpenAI API call failed:', error);
    throw error;
  }
}

/**
 * Get embeddings for text using Azure OpenAI
 */
export async function getEmbedding(text: string, config?: Partial<AzureConfig>): Promise<number[]> {
  const azureConfig = { ...getAzureConfig(), ...config };

  // Use text-embedding-ada-002 model for embeddings
  const embeddingModel = process.env.AZURE_EMBED_MODEL || process.env.AZURE_EMBED_DEPLOYMENT || 'text-embedding-ada-002';
  const url = `${azureConfig.endpoint}/openai/deployments/${embeddingModel}/embeddings?api-version=${azureConfig.apiVersion}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureConfig.apiKey,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure Embedding API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('No embedding data returned from Azure OpenAI');
    }

    return data.data[0].embedding;
  } catch (error) {
    console.error('Azure Embedding API call failed:', error);
    throw error;
  }
}
