import { blockchainService } from "./blockchain";
import { Present, WrapPresentEvent, UnwrapPresentEvent, TakeBackEvent } from "@/types";

// In-memory storage for demo purposes
class IndexerService {
  private presents: Map<string, Present> = new Map();
  private events: Map<string, any[]> = new Map();
  private isIndexing = false;
  private lastProcessedBlock = 0;

  // 事件索引缓存
  private eventCache = new Map<string, any>();
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    this.initializeIndexer();
  }

  // Initialize the indexer
  private async initializeIndexer() {
    try {
      console.log("Indexer initialized. Starting from block", this.lastProcessedBlock);
      this.startIndexing();
    } catch (error) {
      console.error("Failed to initialize indexer:", error);
    }
  }
  
  // Start the indexing process
  private async startIndexing() {
    if (this.isIndexing) return;
    
    this.isIndexing = true;
    console.log("Starting indexing process...");

    try {
      // First, get historical events
      await this.processHistoricalEvents();
      
      // Then start periodic indexing
      this.startPeriodicIndexing();
    } catch (error) {
      console.error("Error starting indexing:", error);
      this.isIndexing = false;
    }
  }

  // Process historical events from blockchain
  private async processHistoricalEvents() {
    try {
      console.log("Processing historical events...");
      const currentBlock = await blockchainService.getProvider().getBlockNumber();
      console.log(`Current block number: ${currentBlock}`);
      
      // Start from a much earlier block to find existing events
      // Arbitrum Sepolia has events, so let's search from block 0
      const fromBlock = 182490804; // Known block with events
      const toBlock = currentBlock;
      console.log(`Processing events from block ${fromBlock} to ${toBlock}`);

      const { wrapEvents, unwrapEvents, takeBackEvents } = await blockchainService.getHistoricalEvents(fromBlock, toBlock);
      console.log(`Found ${wrapEvents.length} wrap events, ${unwrapEvents.length} unwrap events, ${takeBackEvents.length} take back events`);

      // Process events
      for (const event of wrapEvents) {
        await this.processWrapEvent(event);
      }
      for (const event of unwrapEvents) {
        await this.processUnwrapEvent(event);
      }
      for (const event of takeBackEvents) {
        await this.processTakeBackEvent(event);
      }

      if (wrapEvents.length > 0 || unwrapEvents.length > 0 || takeBackEvents.length > 0) {
        const latestBlock = Math.max(
          ...wrapEvents.map((e: WrapPresentEvent) => e.blockNumber),
          ...unwrapEvents.map((e: UnwrapPresentEvent) => e.blockNumber),
          ...takeBackEvents.map((e: TakeBackEvent) => e.blockNumber)
        );
        this.lastProcessedBlock = latestBlock;
      } else {
        this.lastProcessedBlock = currentBlock;
      }
      
      console.log(`Processed ${wrapEvents.length + unwrapEvents.length + takeBackEvents.length} historical events`);
      console.log(`Last processed block: ${this.lastProcessedBlock}`);
      
      // If no events found, try to get present details for known present IDs
      if (wrapEvents.length === 0) {
        console.log("No events found, trying to get present details from contract...");
        await this.tryGetExistingPresents();
      }
      
    } catch (error) {
      console.error("Error processing historical events:", error);
    }
  }

  // Try to get existing presents by calling contract methods
  private async tryGetExistingPresents() {
    try {
      console.log("Attempting to get existing presents from contract...");
      
      // This is a fallback method - we'll try to get presents that might exist
      // but weren't captured in our event logs
      
      // For now, let's create some mock data to test the frontend
      // In production, you would call contract.getPresent() for known present IDs
      console.log("Creating mock data for testing...");
      
      const mockPresent: Present = {
        id: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        sender: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        recipients: ["0x1234567890123456789012345678901234567890"],
        assets: [
          {
            token: "0x0000000000000000000000000000000000000000",
            amount: BigInt("100000000000000000"), // 0.1 ETH
            tokenType: 0
          }
        ],
        message: "Welcome to Fargift! 🎁",
        metadata: "First test gift",
        status: 0, // ACTIVE
        expiryTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24 hours from now
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
        updatedAt: BigInt(Math.floor(Date.now() / 1000))
      };
      
      this.presents.set(mockPresent.id, mockPresent);
      console.log("Created mock present for testing");
      
    } catch (error) {
      console.error("Error trying to get existing presents:", error);
    }
  }

  // Process a wrap present event
  private async processWrapEvent(event: WrapPresentEvent) {
    try {
      console.log(`Processing wrap event for present: ${event.presentId}`);
      
      // Create a basic present object from the event
      // We'll enhance it with more details later if needed
      const present: Present = {
        id: event.presentId,
        sender: event.sender,
        recipients: [], // Will be filled from contract if available
        assets: [], // Will be filled from contract if available
        message: "Gift from blockchain event", // Default message
        metadata: "Created from WrapPresent event",
        status: 0, // ACTIVE
        expiryTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24 hours from now
        createdAt: BigInt(Math.floor(Date.now() / 1000)),
        updatedAt: BigInt(Math.floor(Date.now() / 1000))
      };
      
      // Try to get additional details from contract
      try {
        const contractPresent = await blockchainService.getPresent(event.presentId);
        if (contractPresent) {
          // Merge contract data with event data
          present.recipients = contractPresent.recipients;
          present.assets = contractPresent.assets;
          present.message = contractPresent.message || present.message;
          present.metadata = contractPresent.metadata || present.metadata;
          present.expiryTime = contractPresent.expiryTime;
          present.status = contractPresent.status;
        }
      } catch (contractError) {
        console.warn(`Could not get contract details for ${event.presentId}:`, contractError);
        // Continue with basic event data
      }
      
      // Store the present
      this.presents.set(event.presentId, present);
      
      // Store the event
      if (!this.events.has(event.presentId)) {
        this.events.set(event.presentId, []);
      }
      this.events.get(event.presentId)!.push(event);
      
      console.log(`✅ Successfully indexed present: ${event.presentId} from ${event.sender}`);
      console.log(`   Present details:`, {
        id: present.id,
        sender: present.sender,
        message: present.message,
        status: present.status,
        assets: present.assets.length
      });
      
    } catch (error) {
      console.error(`❌ Error processing wrap event for ${event.presentId}:`, error);
    }
  }

  // Process an unwrap present event
  private async processUnwrapEvent(event: UnwrapPresentEvent) {
    try {
      const present = this.presents.get(event.presentId);
      if (present) {
        present.status = 1; // Unwrapped
        this.presents.set(event.presentId, present);
        
        // Store the event
        if (!this.events.has(event.presentId)) {
          this.events.set(event.presentId, []);
        }
        this.events.get(event.presentId)!.push(event);
        
        console.log(`Present unwrapped: ${event.presentId} by ${event.taker}`);
      }
    } catch (error) {
      console.error(`Error processing unwrap event for ${event.presentId}:`, error);
    }
  }

  // Process a take back event
  private async processTakeBackEvent(event: TakeBackEvent) {
    try {
      const present = this.presents.get(event.presentId);
      if (present) {
        present.status = 3; // Taken back
        this.presents.set(event.presentId, present);
        
        // Store the event
        if (!this.events.has(event.presentId)) {
          this.events.set(event.presentId, []);
        }
        this.events.get(event.presentId)!.push(event);
        
        console.log(`Present taken back: ${event.presentId} by ${event.sender}`);
      }
    } catch (error) {
      console.error(`Error processing take back event for ${event.presentId}:`, error);
    }
  }

  // Start periodic indexing
  private startPeriodicIndexing() {
    // Index every 5 minutes instead of 30 seconds to avoid rate limiting
    setInterval(async () => {
      try {
        if (!this.isIndexing) return;
        
        console.log("Processing new events...");
        
        // Get events from last processed block to latest
        const fromBlock = this.lastProcessedBlock + 1;
        const toBlock = 'latest';
        
        const { wrapEvents, unwrapEvents, takeBackEvents } = await blockchainService.getHistoricalEvents(fromBlock, toBlock);
        
        if (wrapEvents.length > 0 || unwrapEvents.length > 0 || takeBackEvents.length > 0) {
          console.log(`Found ${wrapEvents.length} new wrap events, ${unwrapEvents.length} unwrap events, ${takeBackEvents.length} take back events`);
          
          // Process new events
          console.log(`🔄 Processing ${wrapEvents.length} wrap events...`);
          for (const event of wrapEvents) {
            console.log(`  📦 Processing wrap event: ${event.presentId} from ${event.sender}`);
            await this.processWrapEvent(event);
          }
          
          console.log(`🔄 Processing ${unwrapEvents.length} unwrap events...`);
          for (const event of unwrapEvents) {
            console.log(`  📦 Processing unwrap event: ${event.presentId} by ${event.taker}`);
            await this.processUnwrapEvent(event);
          }
          
          console.log(`🔄 Processing ${takeBackEvents.length} take back events...`);
          for (const event of takeBackEvents) {
            console.log(`  📦 Processing take back event: ${event.presentId} by ${event.sender}`);
            await this.processTakeBackEvent(event);
          }
          
          // Update last processed block
          const latestBlock = Math.max(
            ...wrapEvents.map((e: WrapPresentEvent) => e.blockNumber),
            ...unwrapEvents.map((e: UnwrapPresentEvent) => e.blockNumber),
            ...takeBackEvents.map((e: TakeBackEvent) => e.blockNumber)
          );
          if (latestBlock > this.lastProcessedBlock) {
            this.lastProcessedBlock = latestBlock;
          }
          
          // Debug: Show current state
          console.log(`📊 Current indexing state:`);
          console.log(`   - Total presents indexed: ${this.presents.size}`);
          console.log(`   - Total events stored: ${Array.from(this.events.values()).reduce((sum, events) => sum + events.length, 0)}`);
          console.log(`   - Last processed block: ${this.lastProcessedBlock}`);
        }
      } catch (error) {
        console.error("Error in periodic indexing:", error);
        // Don't stop indexing on error, just log it
      }
    }, 300000); // 5 minutes = 300000ms
  }

  // Get all presents
  async getAllPresents(): Promise<Present[]> {
    return Array.from(this.presents.values());
  }

  // Get present by ID
  async getPresentById(presentId: string): Promise<Present | null> {
    return this.presents.get(presentId) || null;
  }

  // Get presents with pagination
  async getPresentsWithPagination(page: number = 1, limit: number = 10): Promise<{
    presents: Present[];
    total: number;
    page: number;
    limit: number;
  }> {
    const allPresents = Array.from(this.presents.values());
    const total = allPresents.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const presents = allPresents.slice(start, end);

    return {
      presents,
      total,
      page,
      limit
    };
  }

  // Get indexing status
  getIndexingStatus() {
    return {
      isIndexing: this.isIndexing,
      lastProcessedBlock: this.lastProcessedBlock,
      totalPresents: this.presents.size,
      totalEvents: Array.from(this.events.values()).reduce((sum, events) => sum + events.length, 0)
    };
  }

  // Force reindex from a specific block
  async reindexFromBlock(fromBlock: number) {
    try {
      console.log(`🔄 Manual reindex triggered from block ${fromBlock}`);
      
      // Update the last processed block to start from the specified block
      this.lastProcessedBlock = fromBlock - 1; // Start from the previous block to include the specified block
      
      // Process events from the specified block
      await this.processHistoricalEventsFromBlock(fromBlock);
      
      return { success: true, message: `Reindexed from block ${fromBlock}` };
    } catch (error) {
      console.error("Error reindexing:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Process historical events from a specific block
  private async processHistoricalEventsFromBlock(fromBlock: number) {
    try {
      console.log(`Processing historical events from block ${fromBlock}...`);
      const currentBlock = await blockchainService.getProvider().getBlockNumber();
      console.log(`Current block number: ${currentBlock}`);
      
      const toBlock = currentBlock;
      console.log(`Processing events from block ${fromBlock} to ${toBlock}`);

      const { wrapEvents, unwrapEvents, takeBackEvents } = await blockchainService.getHistoricalEvents(fromBlock, toBlock);
      console.log(`Found ${wrapEvents.length} wrap events, ${unwrapEvents.length} unwrap events, ${takeBackEvents.length} take back events`);

      // Process events
      for (const event of wrapEvents) {
        await this.processWrapEvent(event);
      }
      for (const event of unwrapEvents) {
        await this.processUnwrapEvent(event);
      }
      for (const event of takeBackEvents) {
        await this.processTakeBackEvent(event);
      }

      if (wrapEvents.length > 0 || unwrapEvents.length > 0 || takeBackEvents.length > 0) {
        const latestBlock = Math.max(
          ...wrapEvents.map((e: WrapPresentEvent) => e.blockNumber),
          ...unwrapEvents.map((e: UnwrapPresentEvent) => e.blockNumber),
          ...takeBackEvents.map((e: TakeBackEvent) => e.blockNumber)
        );
        this.lastProcessedBlock = latestBlock;
      } else {
        this.lastProcessedBlock = currentBlock;
      }
      
      console.log(`Processed ${wrapEvents.length + unwrapEvents.length + takeBackEvents.length} historical events`);
      console.log(`Last processed block: ${this.lastProcessedBlock}`);
      
    } catch (error) {
      console.error("Error processing historical events from block:", error);
    }
  }

  // 获取缓存的事件数据
  private async getCachedEvents(fromBlock: number, toBlock: number): Promise<{
    wrapEvents: any[];
    unwrapEvents: any[];
    takeBackEvents: any[];
  } | null> {
    const cacheKey = `${fromBlock}-${toBlock}`;
    const now = Date.now();
    
    // 检查缓存是否有效
    if (this.eventCache.has(cacheKey) && (now - this.lastCacheUpdate) < this.CACHE_TTL) {
      console.log(`📦 Using cached events for blocks ${fromBlock}-${toBlock}`);
      return this.eventCache.get(cacheKey);
    }
    
    return null;
  }

  // 缓存事件数据
  private cacheEvents(fromBlock: number, toBlock: number, events: any): void {
    const cacheKey = `${fromBlock}-${toBlock}`;
    this.eventCache.set(cacheKey, events);
    this.lastCacheUpdate = Date.now();
    console.log(`💾 Cached events for blocks ${fromBlock}-${toBlock}`);
  }

  // 智能事件查询：优先使用缓存，然后使用 Arbiscan API，最后回退到 RPC
  async getEventsSmart(fromBlock?: number, toBlock?: number): Promise<{
    wrapEvents: any[];
    unwrapEvents: any[];
    takeBackEvents: any[];
  }> {
    try {
      const fromBlockParam = fromBlock || 182490000;
      const toBlockParam = toBlock || await blockchainService.getProvider().getBlockNumber();
      
      console.log(`🧠 Smart event query: blocks ${fromBlockParam} to ${toBlockParam}`);
      
      // 1. 尝试使用缓存
      const cachedEvents = await this.getCachedEvents(fromBlockParam, toBlockParam);
      if (cachedEvents) {
        return cachedEvents;
      }
      
      // 2. 尝试使用 Arbiscan API
      try {
        console.log(`🔍 Trying Arbiscan API...`);
        const events = await blockchainService.getEventsByArbiscanAPI(fromBlockParam, toBlockParam);
        
        // 缓存结果
        this.cacheEvents(fromBlockParam, toBlockParam, events);
        
        console.log(`✅ Smart query completed via Arbiscan API`);
        return events;
        
      } catch (arbiscanError) {
        console.warn(`⚠️ Arbiscan API failed, falling back to RPC:`, arbiscanError);
        
        // 3. 回退到 RPC 方法
        const events = await blockchainService.getHistoricalEvents(fromBlockParam, toBlockParam);
        
        // 缓存结果
        this.cacheEvents(fromBlockParam, toBlockParam, events);
        
        console.log(`✅ Smart query completed via RPC fallback`);
        return events;
      }
      
    } catch (error) {
      console.error('❌ Error in smart event query:', error);
      return { wrapEvents: [], unwrapEvents: [], takeBackEvents: [] };
    }
  }
}

export const indexerService = new IndexerService();
export default indexerService;
