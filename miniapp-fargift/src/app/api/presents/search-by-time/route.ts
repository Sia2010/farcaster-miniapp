import { NextRequest, NextResponse } from 'next/server';
import { BlockchainService } from '../../../../server/blockchain';
import { ethers } from 'ethers';

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

export async function POST(request: NextRequest) {
  try {
    const { fromDate, toDate } = await request.json();
    
    if (!fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'fromDate and toDate are required' },
        { status: 400 }
      );
    }
    
    console.log(`🕐 Time-based search: ${fromDate} to ${toDate}`);
    
    const blockchainService = new BlockchainService();
    
    // 获取当前区块号
    const currentBlock = await blockchainService.getCurrentBlockNumber();
    console.log(`📊 Current block: ${currentBlock}`);
    
    // 转换时间范围到时间戳
    const fromTimestamp = Math.floor(new Date(fromDate).getTime() / 1000);
    const toTimestamp = Math.floor(new Date(toDate).getTime() / 1000);
    
    console.log(`🕐 Time range: ${fromTimestamp} to ${toTimestamp}`);
    
    // 第一步：使用二分查找找到精确的区块范围
    console.log(`🔍 Finding precise block range for time ${fromTimestamp} to ${toTimestamp}`);
    
    let fromBlock = 0;
    let toBlock = currentBlock;
    
    // 二分查找开始区块
    let left = 0;
    let right = currentBlock;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      try {
        const blockTimestamp = await blockchainService.getBlockTimestamp(mid);
        if (blockTimestamp !== null) {
          if (blockTimestamp >= fromTimestamp) {
            right = mid - 1;
            fromBlock = mid;
          } else {
            left = mid + 1;
          }
        } else {
          // 如果无法获取时间戳，使用估算
          fromBlock = Math.max(0, currentBlock - Math.ceil((Date.now() / 1000 - fromTimestamp) / 12));
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get block ${mid} timestamp, using estimation`);
        fromBlock = Math.max(0, currentBlock - Math.ceil((Date.now() / 1000 - fromTimestamp) / 12));
        break;
      }
    }
    
    // 二分查找结束区块
    left = fromBlock;
    right = currentBlock;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      try {
        const blockTimestamp = await blockchainService.getBlockTimestamp(mid);
        if (blockTimestamp !== null) {
          if (blockTimestamp <= toTimestamp) {
            left = mid + 1;
            toBlock = mid;
          } else {
            right = mid - 1;
          }
        } else {
          // 如果无法获取时间戳，使用估算
          toBlock = Math.min(currentBlock, currentBlock - Math.ceil((Date.now() / 1000 - toTimestamp) / 12));
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to get block ${mid} timestamp, using estimation`);
        toBlock = Math.min(currentBlock, currentBlock - Math.ceil((Date.now() / 1000 - toTimestamp) / 12));
        break;
      }
    }
    
    console.log(`🎯 Precise block range found: ${fromBlock} to ${toBlock} (${toBlock - fromBlock} blocks)`);
    
    // 第二步：使用分页+并发方法搜索精确区块范围
    console.log(`🚀 Using paginated search with concurrent workers for precise block range ${fromBlock}-${toBlock}`);
    
    // 分页参数
    const BLOCK_RANGE = 500; // Alchemy RPC 限制
    const MAX_CONCURRENT_WORKERS = 5; // 并发工作器数量
    const DELAY_BETWEEN_BATCHES = 300; // 批次间延迟（毫秒）
    
    const presents: any[] = [];
    const processedPresentIds = new Set<string>();
    
    // 事件签名
    const WRAP_PRESENT_TOPIC = ethers.id('WrapPresent(bytes32,address)');
    const UNWRAP_PRESENT_TOPIC = ethers.id('UnwrapPresent(bytes32,address)');
    const TAKE_BACK_TOPIC = ethers.id('TakeBack(bytes32,address)');
    
    // 分批查询区块范围
    const totalBatches = Math.ceil((toBlock - fromBlock + 1) / BLOCK_RANGE);
    console.log(`📦 Total batches: ${totalBatches}, blocks per batch: ${BLOCK_RANGE}`);
    
    for (let batchStart = 0; batchStart < totalBatches; batchStart += MAX_CONCURRENT_WORKERS) {
      const batchEnd = Math.min(batchStart + MAX_CONCURRENT_WORKERS, totalBatches);
      const currentBatches = [];
      
      // 准备当前批次的工作
      for (let i = batchStart; i < batchEnd; i++) {
        const startBlock = fromBlock + i * BLOCK_RANGE;
        const endBlock = Math.min(startBlock + BLOCK_RANGE - 1, toBlock);
        
        currentBatches.push({
          batchIndex: i,
          startBlock,
          endBlock
        });
      }
      
      console.log(`🔄 Processing batch ${batchStart + 1}-${batchEnd} of ${totalBatches}`);
      
      // 并发执行当前批次
      const batchPromises = currentBatches.map(async ({ batchIndex, startBlock, endBlock }) => {
        try {
          console.log(`📦 Worker ${batchIndex + 1}: Querying blocks ${startBlock} to ${endBlock}`);
          
          // 查询所有事件
          const logs = await blockchainService.sendRpcRequest('eth_getLogs', [{
            address: blockchainService.getContractAddress(),
            fromBlock: `0x${startBlock.toString(16)}`,
            toBlock: `0x${endBlock.toString(16)}`,
            topics: [] // 获取所有事件
          }]);
          
          console.log(`✅ Worker ${batchIndex + 1}: Found ${logs.length} logs in blocks ${startBlock}-${endBlock}`);
          
          // 处理日志
          const batchPresents: any[] = [];
          for (const log of logs) {
            try {
              const topic0 = log.topics[0];
              const presentId = log.topics[1];
              
              if (!presentId || processedPresentIds.has(presentId)) continue;
              
              let eventType = '';
              let sender = '';
              
              if (topic0 === WRAP_PRESENT_TOPIC) {
                eventType = 'wrap';
                sender = log.topics[2] ? `0x${log.topics[2].slice(26)}` : '0x0000000000000000000000000000000000000000';
              } else if (topic0 === UNWRAP_PRESENT_TOPIC) {
                eventType = 'unwrap';
                sender = log.topics[2] ? `0x${log.topics[2].slice(26)}` : '0x0000000000000000000000000000000000000000';
              } else if (topic0 === TAKE_BACK_TOPIC) {
                eventType = 'takeBack';
                sender = log.topics[2] ? `0x${log.topics[2].slice(26)}` : '0x0000000000000000000000000000000000000000';
              } else {
                continue; // 忽略其他事件
              }
              
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
                
                // 根据事件类型设置状态
                let actualStatus = presentDetails.status || 0;
                if (eventType === 'unwrap') {
                  actualStatus = 1; // Claimed
                } else if (eventType === 'takeBack') {
                  actualStatus = 3; // Taken Back
                }
                
                const present = {
                  id: presentId,
                  sender: eventType === 'wrap' ? sender : (presentDetails.sender || '0x0000000000000000000000000000000000000000'),
                  recipients: presentDetails.recipients || [],
                  assets: assets,
                  message: presentDetails.title || '',
                  metadata: presentDetails.description || '',
                  status: actualStatus,
                  expiryTime: presentDetails.expiryTime || BigInt(0),
                  createdAt: BigInt(Math.floor(Date.now() / 1000)),
                  updatedAt: BigInt(Math.floor(Date.now() / 1000)),
                  eventType,
                  eventBlock: parseInt(log.blockNumber, 16),
                  eventTx: log.transactionHash
                };
                
                batchPresents.push(serializeBigInts(present));
              }
            } catch (parseError) {
              console.warn(`⚠️ Worker ${batchIndex + 1}: Failed to parse event log:`, parseError);
            }
          }
          
          return batchPresents;
          
        } catch (error) {
          console.warn(`⚠️ Worker ${batchIndex + 1}: Failed to query blocks ${startBlock}-${endBlock}:`, error);
          return [];
        }
      });
      
      // 等待当前批次完成
      const batchResults = await Promise.all(batchPromises);
      
      // 合并结果
      for (const batchPresents of batchResults) {
        presents.push(...batchPresents);
      }
      
      // 添加延迟避免 RPC 限制
      if (batchEnd < totalBatches) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    console.log(`🎯 Time-based search completed: ${presents.length} presents found in precise block range ${fromBlock}-${toBlock}`);
    
    return NextResponse.json({
      success: true,
      data: {
        presents,
        eventCounts: {
          wrap: presents.filter(p => p.eventType === 'wrap').length,
          unwrap: presents.filter(p => p.eventType === 'unwrap').length,
          takeBack: presents.filter(p => p.eventType === 'takeBack').length
        },
        totalPresents: presents.length,
        searchMethod: 'time-based-precise-block-range',
        preciseBlockRange: { fromBlock, toBlock },
        timeRange: { fromDate, toDate },
        searchStats: {
          totalBatches,
          blocksPerBatch: BLOCK_RANGE,
          concurrentWorkers: MAX_CONCURRENT_WORKERS,
          delayBetweenBatches: DELAY_BETWEEN_BATCHES
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in time-based search API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to search events by time range'
      },
      { status: 500 }
    );
  }
}
