import { NextRequest, NextResponse } from 'next/server';
import { BlockchainService } from '../../../../server/blockchain';

export async function POST(request: NextRequest) {
  try {
    const { message, metadata, ethAmount, isPublic, recipients, sender } = await request.json();

    if (!message || !ethAmount || !sender) {
      return NextResponse.json(
        { success: false, error: 'message, ethAmount, and sender are required' },
        { status: 400 }
      );
    }

    console.log(`🎁 Wrapping present: ${message}, amount: ${ethAmount} ETH, public: ${isPublic}`);

    const blockchainService = new BlockchainService();

    // 验证参数
    const ethAmountWei = parseFloat(ethAmount) * 1e18;
    if (isNaN(ethAmountWei) || ethAmountWei <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid ETH amount' },
        { status: 400 }
      );
    }

    // 准备 wrap 参数
    const wrapParams = {
      message: message || '',
      metadata: metadata || '',
      ethAmount: BigInt(ethAmountWei),
      isPublic,
      recipients: isPublic ? [] : (recipients || []).filter(r => r.trim()),
      sender
    };

    console.log('📝 Wrap parameters:', wrapParams);

    // 调用 WrapPresent 函数
    // 注意：这里需要用户的私钥来签名交易，实际应用中应该通过钱包连接
    console.log(`📝 Calling WrapPresent with parameters`);
    
    // TODO: 实际实现需要用户钱包签名
    // const tx = await blockchainService.wrapPresent(wrapParams);
    
    // 模拟成功响应
    return NextResponse.json({
      success: true,
      data: {
        message: 'Present wrapped successfully (simulated)',
        presentId: '0x' + Math.random().toString(16).substr(2, 64), // 模拟 presentId
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64), // 模拟 tx hash
        wrapParams: {
          ...wrapParams,
          ethAmount: wrapParams.ethAmount.toString() // 转换 BigInt 为字符串
        }
      }
    });

  } catch (error) {
    console.error('❌ Error wrapping present:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to wrap present'
      },
      { status: 500 }
    );
  }
}
