import { TimeRange } from '@/components/TimeRangeSelector';

// 估算区块时间（Arbitrum Sepolia 大约每 2 秒一个区块）
const BLOCK_TIME_SECONDS = 2;

// 根据时间范围估算区块范围
export async function estimateBlockRange(
  timeRange: TimeRange,
  provider: any
): Promise<{ fromBlock: number; toBlock: number }> {
  try {
    // 获取当前区块
    const currentBlock = await provider.getBlockNumber();
    
    // 计算时间差（秒）
    const timeDiffSeconds = Math.floor(
      (timeRange.toDate.getTime() - timeRange.fromDate.getTime()) / 1000
    );
    
    // 估算区块数量
    const estimatedBlocks = Math.ceil(timeDiffSeconds / BLOCK_TIME_SECONDS);
    
    // 计算起始区块（从当前区块减去估算的区块数量）
    const fromBlock = Math.max(0, currentBlock - estimatedBlocks);
    const toBlock = currentBlock;
    
    console.log(`📅 Time range: ${timeRange.label}`);
    console.log(`   From: ${timeRange.fromDate.toLocaleString()}`);
    console.log(`   To: ${timeRange.toDate.toLocaleString()}`);
    console.log(`   Time diff: ${timeDiffSeconds} seconds`);
    console.log(`   Estimated blocks: ${estimatedBlocks}`);
    console.log(`   Block range: ${fromBlock} to ${toBlock}`);
    
    return { fromBlock, toBlock };
  } catch (error) {
    console.error('Error estimating block range:', error);
    // 如果出错，返回一个合理的默认范围（最近 1000 个区块）
    const currentBlock = await provider.getBlockNumber();
    return {
      fromBlock: Math.max(0, currentBlock - 1000),
      toBlock: currentBlock
    };
  }
}

// 根据区块号估算时间
export function estimateTimeFromBlock(blockNumber: number, currentBlock: number): Date {
  const blocksDiff = currentBlock - blockNumber;
  const secondsDiff = blocksDiff * BLOCK_TIME_SECONDS;
  const timeDiff = secondsDiff * 1000; // 转换为毫秒
  
  return new Date(Date.now() - timeDiff);
}

// 获取区块的时间戳
export async function getBlockTimestamp(blockNumber: number, provider: any): Promise<number> {
  try {
    const block = await provider.getBlock(blockNumber);
    return block.timestamp;
  } catch (error) {
    console.error(`Error getting block ${blockNumber} timestamp:`, error);
    // 如果无法获取，使用估算时间
    const currentBlock = await provider.getBlockNumber();
    const estimatedTime = estimateTimeFromBlock(blockNumber, currentBlock);
    return Math.floor(estimatedTime.getTime() / 1000);
  }
}

// 验证时间范围是否合理
export function validateTimeRange(timeRange: TimeRange): boolean {
  const now = new Date();
  const maxPastDays = 365; // 最多查询过去一年的数据
  
  // 检查开始时间不能晚于结束时间
  if (timeRange.fromDate >= timeRange.toDate) {
    return false;
  }
  
  // 检查结束时间不能晚于现在
  if (timeRange.toDate > now) {
    return false;
  }
  
  // 检查时间范围不能太长
  if (timeRange.days > maxPastDays) {
    return false;
  }
  
  return true;
}
