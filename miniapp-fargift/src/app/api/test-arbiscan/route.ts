import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ARBISCAN_API_KEY || '3UW2NN2N6DKM213P9QXX13C7PUSSQNSMDY';
    const contractAddress = '0x3B3cF7ee8dbCDDd8B8451e38269D982F351ca3db';
    
    console.log(`🧪 Testing Arbiscan API with key: ${apiKey.substring(0, 8)}...`);
    
    // 测试查询最近的事件
    const testUrl = `https://api-sepolia.arbiscan.io/api?module=logs&action=getLogs&address=${contractAddress}&fromBlock=0&toBlock=99999999&apikey=${apiKey}`;
    
    console.log(`🌐 Test URL: ${testUrl}`);
    
    const response = await fetch(testUrl);
    console.log(`📡 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 API Response:`, JSON.stringify(data, null, 2));
      
      if (data.status === '1' && data.result) {
        console.log(`✅ Found ${data.result.length} total events`);
        
        // 显示前几个事件的信息
        const sampleEvents = data.result.slice(0, 5);
        const eventInfo = sampleEvents.map((event: any) => ({
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timeStamp: event.timeStamp,
          topics: event.topics,
          data: event.data
        }));
        
        return NextResponse.json({
          success: true,
          message: `Found ${data.result.length} events`,
          sampleEvents: eventInfo,
          totalEvents: data.result.length
        });
      } else {
        return NextResponse.json({
          success: false,
          error: `API returned status: ${data.status}`,
          message: data.message || 'Unknown error',
          data: data
        });
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      console.error(`Error response: ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('❌ Error testing Arbiscan API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test Arbiscan API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
