export const config = {
  blockchain: {
    chainId: 421614,
    contractAddress: '0x3B3cF7ee8dbCDDd8B8451e38269D982F351ca3db',
    // 只使用 Alchemy RPC
    rpcUrl: 'https://arb-sepolia.g.alchemy.com/v2/4Xqx2rdpX8hQgTdWLXotp',
    // 移除 Arbiscan API
    arbiscanApiKey: null,
    arbiscanApiUrl: null
  },
  indexer: {
    // 简化索引配置
    requestDelay: 100,           // 请求间隔（毫秒）
    retryAttempts: 3,            // 重试次数
    retryDelay: 1000             // 重试延迟（毫秒）
  }
};

export default config;
