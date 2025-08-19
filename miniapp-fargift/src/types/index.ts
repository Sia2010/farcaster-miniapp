// Blockchain types
export interface Asset {
  token: string;
  amount: bigint;
  tokenType: number; // 0: ERC20, 1: ERC721, 2: ERC1155
}

export interface Present {
  id: string;
  sender: string;
  recipients: string[];
  assets: Asset[];
  message: string;
  metadata: string;
  status: number; // 0: Active, 1: Unwrapped, 2: Expired, 3: TakenBack
  expiryTime: bigint;
  createdAt: bigint;
  updatedAt?: bigint;
  // 添加事件相关字段
  eventType?: string;
  eventBlock?: number;
  eventTx?: string;
}

export interface PresentStatus {
  id: string;
  status: number;
  isExpired: boolean;
}

// NFT related types
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface PresentNFT {
  tokenId: string;
  presentId: string;
  metadata: NFTMetadata;
  owner: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PresentListResponse {
  presents: Present[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePresentRequest {
  recipients: string[];
  assets: Asset[];
  message: string;
  metadata: string;
}

export interface UnwrapPresentRequest {
  presentId: string;
}

// Event types
export interface PresentEvent {
  presentId: string;
  sender: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  timestamp: number;
}

export interface WrapPresentEvent extends PresentEvent {
  recipients: string[];
  assets: Asset[];
  message: string;
  metadata: string;
}

export interface UnwrapPresentEvent extends PresentEvent {
  taker: string;
}

export interface TakeBackEvent extends PresentEvent {}

// UI types
export interface TabType {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
}
