import { Present } from '@/types'

interface PresentCardProps {
  present: Present
  onClaim: (presentId: string) => void
  canClaim: boolean
  userAddress: string
}

export function PresentCard({ present, onClaim, canClaim, userAddress }: PresentCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatAmount = (amount: string | bigint, tokenType: number) => {
    const amountStr = typeof amount === 'bigint' ? amount.toString() : amount;
    
    if (tokenType === 0) {
      // ETH
      const ethAmount = Number(amountStr) / 1e18
      return `${ethAmount.toFixed(4)} ETH`
    } else {
      // ERC20
      return `${amountStr} tokens`
    }
  }

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return { text: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
      case 1:
        return { text: 'Claimed', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' }
      case 2:
        return { text: 'Expired', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }
      case 3:
        return { text: 'Taken Back', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' }
      default:
        return { text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' }
    }
  }

  const statusInfo = getStatusInfo(present.status)
  const isPublic = present.recipients.length === 0
  const isUserRecipient = present.recipients.some(recipient => 
    recipient.toLowerCase() === userAddress.toLowerCase()
  )

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg">
      <div className="space-y-4">
        {/* Header with Status */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              {present.message || 'Unnamed Gift'} 🎁
            </h3>
            {present.metadata && (
              <p className="text-gray-300 text-sm italic">"{present.metadata}"</p>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.border} ${statusInfo.color}`}>
            {statusInfo.text}
          </div>
        </div>

        {/* Gift Details */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">from:</span>
              <a 
                href={`https://arbiscan.io/address/${present.sender}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-mono text-sm transition-colors duration-200"
              >
                {formatAddress(present.sender)}
                <span className="ml-1 text-xs">↗</span>
              </a>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">to:</span>
              {isPublic ? (
                <span className="text-emerald-400 font-semibold text-sm">EVERYONE</span>
              ) : (
                <div className="space-y-1">
                  {present.recipients.map((recipient, index) => (
                    <a 
                      key={index}
                      href={`https://arbiscan.io/address/${recipient}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-mono text-sm transition-colors duration-200 block ${
                        recipient.toLowerCase() === userAddress.toLowerCase()
                          ? 'text-purple-400 font-semibold' // 当前用户高亮显示
                          : 'text-blue-400 hover:text-blue-300 underline'
                      }`}
                    >
                      {formatAddress(recipient)}
                      {recipient.toLowerCase() === userAddress.toLowerCase() && (
                        <span className="ml-1 text-xs">👤</span>
                      )}
                      <span className="ml-1 text-xs">↗</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            
            {present.assets.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">amount:</span>
                <span className="text-white font-semibold">
                  {formatAmount(present.assets[0].amount, present.assets[0].tokenType)}
                </span>
              </div>
            )}
            
            {present.expiryTime && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">expires:</span>
                <span className="text-white text-sm">
                  {new Date(Number(present.expiryTime) * 1000).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {canClaim && present.status === 0 ? (
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => onClaim(present.id)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span className="text-lg">🎉</span>
              <span>CLAIM!</span>
            </button>
            <div className="text-center mt-2 text-xs text-gray-400">
              {isPublic ? '公开礼物，任何人都可以领取' : '您有权限领取此礼物'}
            </div>
          </div>
        ) : present.status === 0 ? (
          <div className="pt-4 border-t border-gray-700">
            <div className="text-center py-3 text-gray-400">
              <span className="text-lg">🔒</span>
              <span className="ml-2">您没有权限领取此礼物</span>
            </div>
          </div>
        ) : null}

        {/* Event Info */}
        {present.eventType && (
          <div className="pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Event: {present.eventType}</div>
              <div>Block: {present.eventBlock}</div>
              <div>Tx: {formatAddress(present.eventTx || '')}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
