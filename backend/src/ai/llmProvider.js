const mockProvider = require('./providers/mockProvider');
const openaiProvider = require('./providers/openaiProvider');

let currentProvider = mockProvider;

const setProvider = (providerName) => {
  if (providerName === 'openai') {
    currentProvider = openaiProvider;
  } else {
    currentProvider = mockProvider;
  }
};

const generateSummary = async (context) => {
  try {
    return await currentProvider.generateNaturalLanguageSummary(context);
  } catch (error) {
    console.warn('[llmProvider] Provider failed, executing resilient fallback:', error.message);
    return await mockProvider.generateNaturalLanguageSummary(context);
  }
};

const getProviderMetadata = () => {
  return {
    engine: 'MRF-AI',
    engineVersion: '3.0.0',
    rulesVersion: '1.2.0',
    llmVersion: currentProvider.providerName
  };
};

module.exports = {
  setProvider,
  generateSummary,
  getProviderMetadata
};
