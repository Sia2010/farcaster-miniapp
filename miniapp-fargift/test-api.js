const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Miniapp Fargift Backend API...\n');
  
  try {
    // Test 1: Get indexer status
    console.log('1️⃣ Testing indexer status...');
    const statusResponse = await fetch(`${BASE_URL}/api/indexer/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Indexer Status:', statusData);
    
    // Test 2: Get presents (empty initially)
    console.log('\n2️⃣ Testing presents endpoint...');
    const presentsResponse = await fetch(`${BASE_URL}/api/presents?page=1&limit=10`);
    const presentsData = await presentsResponse.json();
    console.log('✅ Presents:', presentsData);
    
    // Test 3: Create a present (mock) - Fixed field format
    console.log('\n3️⃣ Testing present creation...');
    const createResponse = await fetch(`${BASE_URL}/api/presents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'],
        assets: [
          {
            token: '0x0000000000000000000000000000000000000000',
            amount: '100000000000000000',
            tokenType: 0
          }
        ],
        message: 'Test Gift from API',
        metadata: 'API Test'
      })
    });
    const createData = await createResponse.json();
    console.log('✅ Created Present:', createData);
    
    // Test 4: Get presents after creation
    console.log('\n4️⃣ Testing presents after creation...');
    const presentsAfterResponse = await fetch(`${BASE_URL}/api/presents?page=1&limit=10`);
    const presentsAfterData = await presentsAfterResponse.json();
    console.log('✅ Presents After Creation:', presentsAfterData);
    
    // Test 5: Test live events endpoint
    console.log('\n5️⃣ Testing live events...');
    const eventsResponse = await fetch(`${BASE_URL}/api/events/live?fromBlock=0&eventType=all`);
    const eventsData = await eventsResponse.json();
    console.log('✅ Live Events:', eventsData);
    
    console.log('\n🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI(); 