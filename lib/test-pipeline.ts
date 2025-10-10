/**
 * Test Pipeline Script
 * Quick test to verify all AI services work end-to-end
 */

/**
 * Simple test runner for development
 * Usage: npx tsx lib/test-pipeline.ts
 */

async function testPipeline() {
  console.log('🧪 Testing AI Pipeline...');

  try {
    // Test Azure OpenAI connection
    console.log('\n1. Testing Azure OpenAI connection...');
    const { getAzureConfig } = await import('./ai');
    const config = getAzureConfig();
    console.log('✅ Azure config loaded:', config.modelName);

    // Test embeddings
    console.log('\n2. Testing embeddings...');
    const { getEmbedding } = await import('./ai');
    const testEmbedding = await getEmbedding('Sri Lanka budget announcement highlights education spending');
    console.log('✅ Embedding computed:', testEmbedding.length, 'dimensions');

    // Test clustering
    console.log('\n3. Testing clustering...');
    const { cosineSimilarity } = await import('./ai');
    const similarity = cosineSimilarity(testEmbedding, testEmbedding);
    console.log('✅ Cosine similarity test:', similarity);

    // Test chat completion
    console.log('\n4. Testing chat completion...');
    const { chatCompletion } = await import('./ai');
    const testResponse = await chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Summarize this in 10 words: Sri Lanka announced new education funding for schools.' }
      ],
      max_tokens: 100
    });
    console.log('✅ Chat completion:', testResponse.substring(0, 100) + '...');

    console.log('\n🎉 All tests passed! Pipeline is ready.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testPipeline();
}

export { testPipeline };