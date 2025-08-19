import { ethers } from 'ethers';
import { config } from '../lib/config';
import PresentABI from '../abi/raw/Present.abi.json';
import WrappedPresentNFTABI from '../abi/raw/WrappedPresentNFT.abi.json';
import UnwrappedPresentNFTABI from '../abi/raw/UnwrappedPresentNFT.abi.json';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private presentContract: ethers.Contract;
  private wrappedNFTContract: ethers.Contract;
  private unwrappedNFTContract: ethers.Contract;

  constructor() {
    // 初始化 Alchemy RPC 提供商
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    
    // 初始化合约
    this.presentContract = new ethers.Contract(
      config.blockchain.contractAddress,
      PresentABI,
      this.provider
    );
    
    // NFT 合约地址（占位符）
    this.wrappedNFTContract = new ethers.Contract(
      '0x0000000000000000000000000000000000000000',
      WrappedPresentNFTABI,
      this.provider
    );
    
    this.unwrappedNFTContract = new ethers.Contract(
      '0x0000000000000000000000000000000000000000',
      UnwrappedPresentNFTABI,
      this.provider
    );
    
    console.log('✅ Initialized Alchemy RPC provider');
  }

  // 稳定查询：使用 eth_getLogs 直接查询，支持分页和并发
  async getEventsStable(): Promise<{
    wrapEvents: any[];
    unwrapEvents: any[];
    takeBackEvents: any[];
  }> {
    try {
      console.log('🔍 Executing stable event query using eth_getLogs...');
      
      // 获取当前区块号
      const currentBlock = await this.provider.getBlockNumber();
      console.log(`📊 Current block: ${currentBlock}`);
      
      // Alchemy RPC 限制：一次最多查询 500 个区块
      const BLOCK_RANGE = 500; // 符合 RPC 限制
      const MAX_CONCURRENT_WORKERS = 5; // 并发 worker 数量
      
      // 事件签名（topic0）
      const WRAP_PRESENT_TOPIC = ethers.id('WrapPresent(bytes32,address)');
      const UNWRAP_PRESENT_TOPIC = ethers.id('UnwrapPresent(bytes32,address)');
      const TAKE_BACK_TOPIC = ethers.id('TakeBack(bytes32,address)');
      
      const wrapEvents: any[] = [];
      const unwrapEvents: any[] = [];
      const takeBackEvents: any[] = [];
      
      // 计算需要查询的区块范围
      const fromBlock = 182490804; // 从合约部署区块开始
      const totalBlocks = currentBlock - fromBlock;
      const totalPages = Math.ceil(totalBlocks / BLOCK_RANGE);
      
      console.log(`📦 Total blocks to query: ${totalBlocks}, Total pages: ${totalPages}`);
      
      // 创建分页任务
      const tasks: Array<{ page: number; startBlock: number; endBlock: number }> = [];
      for (let page = 0; page < totalPages; page++) {
        const startBlock = fromBlock + page * BLOCK_RANGE;
        const endBlock = Math.min(startBlock + BLOCK_RANGE - 1, currentBlock);
        tasks.push({ page, startBlock, endBlock });
      }
      
      // 并发执行查询任务 - 一次查询获取所有事件类型
      const processPage = async (task: { page: number; startBlock: number; endBlock: number }) => {
        try {
          console.log(`📦 Worker processing page ${task.page}: blocks ${task.startBlock} to ${task.endBlock}`);
          
          // 一次查询获取所有事件，不指定具体 topic，让 RPC 返回所有事件
          const logs = await this.provider.send('eth_getLogs', [{
            address: config.blockchain.contractAddress,
            fromBlock: `0x${task.startBlock.toString(16)}`,
            toBlock: `0x${task.endBlock.toString(16)}`,
            topics: [] // 不指定 topic，获取所有事件
          }]);
          
          // 解析日志，根据 topic0 分类事件
          for (const log of logs) {
            try {
              const topic0 = log.topics[0];
              const presentId = log.topics[1]; // indexed presentId
              
              if (topic0 === WRAP_PRESENT_TOPIC) {
                // WrapPresent(bytes32 presentId, address sender)
                const sender = log.topics[2] ? `0x${log.topics[2].slice(26)}` : '0x0000000000000000000000000000000000000000';
                
                const event = {
                  args: [presentId, sender],
                  blockNumber: parseInt(log.blockNumber, 16),
                  blockHash: log.blockHash,
                  transactionHash: log.transactionHash,
                  logIndex: parseInt(log.logIndex, 16)
                };
                
                wrapEvents.push(event);
              } else if (topic0 === UNWRAP_PRESENT_TOPIC) {
                // UnwrapPresent(bytes32 presentId, address taker)
                const taker = log.topics[2] ? `0x${log.topics[2].slice(26)}` : '0x0000000000000000000000000000000000000000';
                
                const event = {
                  args: [presentId, taker],
                  blockNumber: parseInt(log.blockNumber, 16),
                  blockHash: log.blockHash,
                  transactionHash: log.transactionHash,
                  logIndex: parseInt(log.logIndex, 16)
                };
                
                unwrapEvents.push(event);
              } else if (topic0 === TAKE_BACK_TOPIC) {
                // TakeBack(bytes32 presentId, address sender)
                const sender = log.topics[2] ? `0x${log.topics[2].slice(26)}` : '0x0000000000000000000000000000000000000000';
                
                const event = {
                  args: [presentId, sender],
                  blockNumber: parseInt(log.blockNumber, 16),
                  blockHash: log.blockHash,
                  transactionHash: log.transactionHash,
                  logIndex: parseInt(log.logIndex, 16)
                };
                
                takeBackEvents.push(event);
              }
              // 忽略其他类型的事件
            } catch (parseError) {
              console.warn(`⚠️ Failed to parse event log:`, parseError);
            }
          }
          
          console.log(`✅ Page ${task.page} completed: found ${logs.length} total events`);
          
        } catch (error) {
          console.warn(`⚠️ Worker failed on page ${task.page}:`, error);
        }
      };
      
      // 分批并发执行所有任务
      const chunks = [];
      for (let i = 0; i < tasks.length; i += MAX_CONCURRENT_WORKERS) {
        chunks.push(tasks.slice(i, i + MAX_CONCURRENT_WORKERS));
      }
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🚀 Executing chunk ${i + 1}/${chunks.length} with ${chunk.length} workers`);
        
        await Promise.all(chunk.map(processPage));
        
        // 在批次之间添加延迟，避免 RPC 限制
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log(`✅ Contract events query completed: wrap=${wrapEvents.length}, unwrap=${unwrapEvents.length}, takeBack=${takeBackEvents.length}`);
      
      return {
        wrapEvents,
        unwrapEvents,
        takeBackEvents
      };
      
    } catch (error) {
      console.error('❌ Error in stable events query:', error);
      throw new Error(`Failed to query contract events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 获取礼物详情
  async getPresent(presentId: string): Promise<any> {
    try {
      const result = await this.presentContract.getPresent(presentId);
      
      return {
        sender: result[0],
        recipients: result[1],
        content: result[2],
        title: result[3],
        description: result[4],
        status: result[5],
        expiryTime: result[6]
      };
    } catch (error) {
      console.warn(`⚠️ Failed to get present details for ${presentId}:`, error);
      return null;
    }
  }

  // 获取礼物 NFT 信息
  async getPresentNFT(presentId: string): Promise<any> {
    try {
      // 将 presentId 转换为 tokenId
      const tokenId = BigInt(presentId);
      
      return {
        tokenId: tokenId.toString(),
        presentId: presentId,
        tokenURI: null, // 需要实际的 NFT 合约地址
        metadata: null
      };
    } catch (error) {
      console.warn(`⚠️ Failed to get NFT info for present ${presentId}:`, error);
      return null;
    }
  }

  // 获取区块时间戳
  async getBlockTimestamp(blockNumber: number): Promise<number | null> {
    try {
      const block = await this.provider.getBlock(blockNumber);
      return block?.timestamp || null;
    } catch (error) {
      console.warn(`⚠️ Failed to get block ${blockNumber} timestamp:`, error);
      return null;
    }
  }

  // 获取当前区块号
  async getCurrentBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  // 获取提供商实例（供外部使用）
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  // 获取合约实例（供外部使用）
  getContract() {
    return this.presentContract;
  }

  // 获取合约地址
  getContractAddress(): string {
    return config.blockchain.contractAddress;
  }

  // 发送 RPC 请求
  async sendRpcRequest(method: string, params: any[]): Promise<any> {
    return this.provider.send(method, params);
  }
}
