import { NextRequest, NextResponse } from 'next/server';
import { BlockchainService } from '../../../../server/blockchain';

// 序列化 BigInt 的辅助函数
function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInts(value);
    }
    return result;
  }
  
  return obj;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Stable query API called');
    
    const { searchParams } = new URL(request.url);
    const fromBlock = searchParams.get('fromBlock');
    const toBlock = searchParams.get('toBlock');
    
    console.log('📊 Query parameters:', { fromBlock, toBlock });
    
    const blockchainService = new BlockchainService();
    
    // 使用新的稳定查询方法，直接调用合约事件
    console.log('🚀 Using stable event query with contract events...');
    const { wrapEvents, unwrapEvents, takeBackEvents } = await blockchainService.getEventsStable();
    
    console.log(`✅ Stable query completed: wrap=${wrapEvents.length}, unwrap=${unwrapEvents.length}, takeBack=${takeBackEvents.length}`);
    
    // 处理事件并获取礼物详情
    const presents: any[] = [];
    const processedPresentIds = new Set<string>();
    
    // 处理 wrap 事件
    for (const event of wrapEvents) {
      try {
        const presentId = event.args?.[0] || event.topics?.[1];
        if (!presentId || processedPresentIds.has(presentId)) continue;
        
        processedPresentIds.add(presentId);
        
        // 获取礼物详情
        const presentDetails = await blockchainService.getPresent(presentId);
        if (presentDetails) {
          // 转换 assets 数据结构以匹配前端期望
          const assets = presentDetails.content ? presentDetails.content.map((item: any) => ({
            token: item[0] || '0x0000000000000000000000000000000000000000',
            amount: item[1] || BigInt(0),
            tokenType: item[0] === '0x0000000000000000000000000000000000000000' ? 0 : 1 // 0: ETH, 1: ERC20
          })) : [];
          
          const present = {
            id: presentId,
            sender: event.args?.[1] || '0x0000000000000000000000000000000000000000',
            recipients: presentDetails.recipients || [],
            assets: assets,
            message: presentDetails.title || '',
            metadata: presentDetails.description || '',
            status: presentDetails.status || 0, // wrap 事件通常是 Active 状态
            expiryTime: presentDetails.expiryTime || BigInt(0),
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
            updatedAt: BigInt(Math.floor(Date.now() / 1000)),
            eventType: 'wrap',
            eventBlock: event.blockNumber,
            eventTx: event.transactionHash
          };
          
          presents.push(serializeBigInts(present));
        }
      } catch (error) {
        console.warn('⚠️ Failed to process wrap event:', error);
        continue;
      }
    }
    
    // 处理 unwrap 事件
    for (const event of unwrapEvents) {
      try {
        const presentId = event.args?.[0] || event.topics?.[1];
        if (!presentId || processedPresentIds.has(presentId)) continue;
        
        processedPresentIds.add(presentId);
        
        const presentDetails = await blockchainService.getPresent(presentId);
        if (presentDetails) {
          // 转换 assets 数据结构以匹配前端期望
          const assets = presentDetails.content ? presentDetails.content.map((item: any) => ({
            token: item[0] || '0x0000000000000000000000000000000000000000',
            amount: item[1] || BigInt(0),
            tokenType: item[0] === '0x0000000000000000000000000000000000000000' ? 0 : 1 // 0: ETH, 1: ERC20
          })) : [];
          
          const present = {
            id: presentId,
            sender: presentDetails.sender || '0x0000000000000000000000000000000000000000',
            recipients: presentDetails.recipients || [],
            assets: assets,
            message: presentDetails.title || '',
            metadata: presentDetails.description || '',
            status: 1, // unwrap 事件表示已领取
            expiryTime: presentDetails.expiryTime || BigInt(0),
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
            updatedAt: BigInt(Math.floor(Date.now() / 1000)),
            eventType: 'unwrap',
            eventBlock: event.blockNumber,
            eventTx: event.transactionHash
          };
          
          presents.push(serializeBigInts(present));
        }
      } catch (error) {
        console.warn('⚠️ Failed to process unwrap event:', error);
        continue;
      }
    }
    
    // 处理 takeBack 事件
    for (const event of takeBackEvents) {
      try {
        const presentId = event.args?.[0] || event.topics?.[1];
        if (!presentId || processedPresentIds.has(presentId)) continue;
        
        processedPresentIds.add(presentId);
        
        const presentDetails = await blockchainService.getPresent(presentId);
        if (presentDetails) {
          // 转换 assets 数据结构以匹配前端期望
          const assets = presentDetails.content ? presentDetails.content.map((item: any) => ({
            token: item[0] || '0x0000000000000000000000000000000000000000',
            amount: item[1] || BigInt(0),
            tokenType: item[0] === '0x0000000000000000000000000000000000000000' ? 0 : 1 // 0: ETH, 1: ERC20
          })) : [];
          
          const present = {
            id: presentId,
            sender: presentDetails.sender || '0x0000000000000000000000000000000000000000',
            recipients: presentDetails.recipients || [],
            assets: assets,
            message: presentDetails.title || '',
            metadata: presentDetails.description || '',
            status: 3, // takeBack 事件表示已取回
            expiryTime: presentDetails.expiryTime || BigInt(0),
            createdAt: BigInt(Math.floor(Date.now() / 1000)),
            updatedAt: BigInt(Math.floor(Date.now() / 1000)),
            eventType: 'takeBack',
            eventBlock: event.blockNumber,
            eventTx: event.transactionHash
          };
          
          presents.push(serializeBigInts(present));
        }
      } catch (error) {
        console.warn('⚠️ Failed to process takeBack event:', error);
        continue;
      }
    }
    
    console.log(`🎯 Total presents processed: ${presents.length}`);
    
    return NextResponse.json({
      success: true,
      data: {
        presents,
        eventCounts: {
          wrap: wrapEvents.length,
          unwrap: unwrapEvents.length,
          takeBack: takeBackEvents.length
        },
        totalPresents: presents.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error in stable query API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to query events using contract events'
      },
      { status: 500 }
    );
  }
}
