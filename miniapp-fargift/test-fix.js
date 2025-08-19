// 测试修复后的功能
const testData = {
  fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  toDate: new Date().toISOString()
};

console.log('🧪 Testing fixed functionality...');
console.log('📅 Time range:', testData);

// 测试 BigInt 序列化
function serializeBigInts(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }
  
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInts(value);
    }
    return result;
  }
  
  return obj;
}

// 测试数据
const testPresent = {
  id: '0x1234567890abcdef',
  sender: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  recipients: [],
  assets: [{
    token: '0x0000000000000000000000000000000000000000',
    amount: BigInt('1000000000000000000'), // 1 ETH
    tokenType: 0
  }],
  message: 'Test Gift',
  metadata: 'Test Description',
  status: 0,
  expiryTime: BigInt(Math.floor(Date.now() / 1000) + 86400),
  createdAt: BigInt(Math.floor(Date.now() / 1000))
};

console.log('📦 Test present before serialization:', testPresent);
const serialized = serializeBigInts(testPresent);
console.log('✅ Test present after serialization:', serialized);

// 测试 JSON 序列化
try {
  const jsonString = JSON.stringify(serialized);
  console.log('🎯 JSON serialization successful, length:', jsonString.length);
} catch (error) {
  console.error('❌ JSON serialization failed:', error);
}

console.log('✨ Test completed!');
