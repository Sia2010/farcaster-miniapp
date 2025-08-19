'use client';

import { useState, useEffect } from 'react';
import TimeRangeSelector, { TimeRange } from '@/components/TimeRangeSelector';
import { PresentCard } from '@/components/PresentCard';
import { CreatePresentModal } from '@/components/CreatePresentModal';
import { Present } from '@/types';
import { TabNavigation } from '@/components/TabNavigation';
import { BottomNavigation } from '@/components/BottomNavigation';

// 扩展 Window 接口以包含 ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export default function Home() {
  const [presents, setPresents] = useState<Present[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange | null>(null);
  const [searching, setSearching] = useState(false);
  const [activeTopTab, setActiveTopTab] = useState('live');
  const [activeBottomTab, setActiveBottomTab] = useState('explore');
  const [currentUserAddress, setCurrentUserAddress] = useState<string>(''); // 当前用户地址
  const [isWalletConnected, setIsWalletConnected] = useState(false); // 钱包连接状态

  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        console.log('🔌 Connecting to MetaMask...');
        
        // 请求用户连接钱包
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          setCurrentUserAddress(accounts[0]);
          setIsWalletConnected(true);
          console.log('✅ Wallet connected:', accounts[0]);
        }
      } catch (error) {
        console.error('❌ Failed to connect wallet:', error);
        alert('连接钱包失败，请检查 MetaMask 是否已安装并解锁');
      }
    } else {
      console.error('❌ MetaMask not installed');
      alert('请安装 MetaMask 钱包扩展');
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    setCurrentUserAddress('');
    setIsWalletConnected(false);
    console.log('🔌 Wallet disconnected');
  };

  // 监听钱包账户变化
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      // 监听账户变化
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setCurrentUserAddress(accounts[0]);
          setIsWalletConnected(true);
          console.log('🔄 Account changed to:', accounts[0]);
        } else {
          setCurrentUserAddress('');
          setIsWalletConnected(false);
          console.log('🔄 Account disconnected');
        }
      });

      // 监听链变化
      window.ethereum.on('chainChanged', (chainId: string) => {
        console.log('🔄 Chain changed to:', chainId);
        // 可以在这里检查是否是 Arbitrum Sepolia
        if (chainId !== '0x66eee') { // 421614 in hex
          alert('请切换到 Arbitrum Sepolia 测试网');
        }
      });

      // 检查是否已经连接
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setCurrentUserAddress(accounts[0]);
          setIsWalletConnected(true);
          console.log('✅ Already connected to wallet:', accounts[0]);
        }
      });
    }
  }, []);

  // 默认选择"本周"
  useEffect(() => {
    const now = new Date();
    const defaultRange: TimeRange = {
      label: '本周',
      days: 7,
      fromDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      toDate: now
    };
    setSelectedTimeRange(defaultRange);
    
    // 获取当前用户地址（这里模拟，实际应该从钱包获取）
    // setCurrentUserAddress('0x1840fCD5a8cC90F18d320477c691A038aa800B6B');
  }, []);

  // 监听 presents 状态变化
  useEffect(() => {
    console.log(`🔧 Presents state changed:`, { 
      count: presents.length, 
      presents: presents,
      loading,
      searching
    });
  }, [presents, loading, searching]);

  // 根据顶部标签页过滤礼物
  const livePresents = presents.filter(p => p.status === 0); // Active presents
  const historicPresents = presents.filter(p => p.status !== 0); // Claimed, Expired, Taken Back

  // 根据当前选中的顶部标签页显示对应的礼物
  const displayedPresents = activeTopTab === 'live' ? livePresents : historicPresents;

  // 检查用户是否有权限领取礼物
  const canUserClaim = (present: Present) => {
    // 如果没有连接钱包，无法领取
    if (!isWalletConnected || !currentUserAddress) return false;
    
    if (present.status !== 0) return false; // 只有 Active 状态可以 claim
    
    // 检查是否是公开礼物（recipients 为空）
    if (present.recipients.length === 0) return true;
    
    // 检查用户地址是否在 recipients 中
    return present.recipients.some(recipient => 
      recipient.toLowerCase() === currentUserAddress.toLowerCase()
    );
  };

  const searchPresentsByTimeRange = async (timeRange: TimeRange) => {
    if (!timeRange) return;
    
    setLoading(true);
    setSearching(true);
    try {
      console.log(`🔍 Searching presents for time range: ${timeRange.label}`);
      
      const response = await fetch('/api/presents/search-by-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromDate: timeRange.fromDate.toISOString(),
          toDate: timeRange.toDate.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 API Response:`, data);
        
        if (data.success && data.data && data.data.presents) {
          setPresents(data.data.presents);
          console.log(`✅ Found ${data.data.presents.length} presents for ${timeRange.label}`);
        } else {
          console.warn('API returned success but no presents data');
          setPresents([]);
        }
      } else {
        console.error('Failed to search presents by time range');
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setPresents([]);
      }
    } catch (error) {
      console.error('Error searching presents by time range:', error);
      setPresents([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // 稳定查询：使用 Arbiscan API 进行可靠查询
  const searchPresentsStable = async () => {
    setLoading(true);
    setSearching(true);
    try {
      console.log(`🔒 Executing stable query using Arbiscan API`);
      
      const response = await fetch('/api/presents/stable');
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Stable Query Response:`, data);
        console.log(`📊 Response structure:`, {
          success: data.success,
          hasData: !!data.data,
          hasPresents: !!data.data?.presents,
          presentsLength: data.data?.presents?.length,
          presentsType: typeof data.data?.presents,
          isArray: Array.isArray(data.data?.presents)
        });
        
        if (data.success && data.data && data.data.presents) {
          console.log(`✅ Stable query found ${data.data.presents.length} presents`);
          console.log(`📋 First present:`, data.data.presents[0]);
          setPresents(data.data.presents);
        } else {
          console.warn('Stable query returned success but no presents data');
          console.warn('Data structure:', data);
          setPresents([]);
        }
      } else {
        console.error('Failed to execute stable query');
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setPresents([]);
      }
    } catch (error) {
      console.error('Error executing stable query:', error);
      setPresents([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // 移除快速查询函数
  // const searchPresentsFast = async () => {
  //   // 已移除
  // };

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
  };

  const handleTimeRangeSearch = () => {
    console.log('🔍 Time range search button clicked');
    console.log('📊 Current selectedTimeRange:', selectedTimeRange);
    
    if (selectedTimeRange) {
      console.log('✅ Using selected time range:', selectedTimeRange.label);
      searchPresentsByTimeRange(selectedTimeRange);
    } else {
      console.log('⚠️ No time range selected, using default "本周"');
      // 如果没有选择时间范围，使用默认的"本周"
      const now = new Date();
      const defaultRange: TimeRange = {
        label: '本周',
        days: 7,
        fromDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        toDate: now
      };
      searchPresentsByTimeRange(defaultRange);
    }
  };

  const handleStableQuery = () => {
    console.log('🔒 Stable query button clicked');
    searchPresentsStable();
  };

  const handleClaim = async (presentId: string) => {
    console.log('🎉 Claiming present:', presentId);
    
    try {
      const response = await fetch(`/api/presents/${presentId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentId,
          userAddress: currentUserAddress
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Present claimed successfully:', result);
        
        // 刷新礼物列表
        if (selectedTimeRange) {
          searchPresentsByTimeRange(selectedTimeRange);
        } else {
          searchPresentsStable();
        }
        
        // 显示成功消息
        alert('🎉 Present claimed successfully!');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to claim present:', errorData);
        alert(`❌ Failed to claim present: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error claiming present:', error);
      alert(`❌ Error claiming present: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBottomTabChange = (tab: string) => {
    setActiveBottomTab(tab);
    if (tab === 'new') {
      setShowCreateModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🎁 Fargift</h1>
              <p className="text-gray-300">在 Farcaster 上发送和接收加密礼物</p>
            </div>
            
            {/* 钱包连接按钮 */}
            <div className="flex items-center space-x-4">
              {isWalletConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-300">
                    已连接: {currentUserAddress.slice(0, 6)}...{currentUserAddress.slice(-4)}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    断开连接
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  🔌 连接钱包
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Top Tab Navigation */}
        <TabNavigation 
          activeTab={activeTopTab}
          onTabChange={setActiveTopTab}
        />

        {/* Time Range Selector */}
        <div className="mb-6">
          <TimeRangeSelector 
            onTimeRangeChange={handleTimeRangeChange} 
            selectedRange={selectedTimeRange || undefined} 
          />
        </div>

        {/* 操作按钮区域 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索操作</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleTimeRangeSearch}
              disabled={loading || !selectedTimeRange}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              type="button"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  搜索中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  按时间搜索
                </>
              )}
            </button>
            
            <button
              onClick={handleStableQuery}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg text-base font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              type="button"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  查询中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  稳定查询
                </>
              )}
            </button>
          </div>
          
          {/* 搜索状态提示 */}
          {!selectedTimeRange && (
            <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
              <span className="font-medium">提示：</span>请先选择时间范围，然后点击"按时间搜索"
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-gray-800 rounded-lg text-sm border border-gray-700">
          <div className="text-gray-300 mb-2">Debug Info:</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div>Loading: {loading ? 'true' : 'false'}</div>
            <div>Searching: {searching ? 'true' : 'false'}</div>
            <div>Presents: {presents.length}</div>
            <div>Top Tab: {activeTopTab}</div>
            <div>Bottom Tab: {activeBottomTab}</div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : displayedPresents.length > 0 ? (
          <div>
            {/* Tab-specific header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {activeTopTab === 'live' ? '🎁 Live Presents' : '📚 Historic Presents'}
              </h2>
              <span className="text-sm text-gray-400">
                {activeTopTab === 'live' 
                  ? `等待领取的礼物 (${livePresents.length})` 
                  : `已处理的历史记录 (${historicPresents.length})`
                }
              </span>
            </div>
            
            {/* Presents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPresents.map((present) => (
                <PresentCard 
                  key={present.id} 
                  present={present}
                  onClaim={handleClaim}
                  canClaim={canUserClaim(present)}
                  userAddress={currentUserAddress}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              {activeTopTab === 'live' ? '🎁' : '📚'}
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searching ? '搜索中...' : 
                activeTopTab === 'live' ? '没有活跃的礼物' : '没有历史记录'
              }
            </h3>
            <p className="text-gray-400">
              {searching 
                ? '正在搜索指定时间范围内的礼物...' 
                : activeTopTab === 'live'
                  ? '尝试选择不同的时间范围或创建新礼物'
                  : '历史记录将在这里显示'
              }
            </p>
          </div>
        )}

        {/* Status Message */}
        {displayedPresents.length > 0 && (
          <div className="mt-6 text-center text-gray-400">
            {activeTopTab === 'live' 
              ? `找到 ${livePresents.length} 个活跃礼物`
              : `找到 ${historicPresents.length} 个历史记录`
            }
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeBottomTab}
        onTabChange={handleBottomTabChange}
      />

      {/* Create Present Modal */}
      {showCreateModal && (
        <CreatePresentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            if (selectedTimeRange) {
              searchPresentsByTimeRange(selectedTimeRange);
            }
          }}
        />
      )}
    </div>
  )
}
