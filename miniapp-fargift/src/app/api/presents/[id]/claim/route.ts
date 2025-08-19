import { NextRequest, NextResponse } from 'next/server';
import { BlockchainService } from '../../../../../server/blockchain';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { presentId } = params;
    const { userAddress } = await request.json();

    if (!presentId || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'presentId and userAddress are required' },
        { status: 400 }
      );
    }

    console.log(`🎉 Claiming present ${presentId} for user ${userAddress}`);

    const blockchainService = new BlockchainService();

    // 获取礼物详情以验证权限
    const presentDetails = await blockchainService.getPresent(presentId);
    if (!presentDetails) {
      return NextResponse.json(
        { success: false, error: 'Present not found' },
        { status: 404 }
      );
    }

    // 检查用户是否有权限领取
    const isPublic = presentDetails.recipients.length === 0;
    const hasPermission = isPublic || presentDetails.recipients.some(recipient => 
      recipient.toLowerCase() === userAddress.toLowerCase()
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'User does not have permission to claim this present' },
        { status: 403 }
      );
    }

    // 检查礼物状态
    if (presentDetails.status !== 0) {
      return NextResponse.json(
        { success: false, error: 'Present is not in active state' },
        { status: 400 }
      );
    }

    // 调用 UnwrapPresent 函数
    // 注意：这里需要用户的私钥来签名交易，实际应用中应该通过钱包连接
    console.log(`📝 Calling UnwrapPresent for present ${presentId}`);
    
    // TODO: 实际实现需要用户钱包签名
    // const tx = await blockchainService.unwrapPresent(presentId, userAddress);
    
    // 模拟成功响应
    return NextResponse.json({
      success: true,
      data: {
        presentId,
        userAddress,
        status: 'claimed',
        message: 'Present claimed successfully (simulated)'
      }
    });

  } catch (error) {
    console.error('❌ Error claiming present:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to claim present'
      },
      { status: 500 }
    );
  }
}
