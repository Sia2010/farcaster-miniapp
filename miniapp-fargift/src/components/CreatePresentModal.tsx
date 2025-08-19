import { useState } from 'react'
import { Present, Asset } from '@/types'

interface CreatePresentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreatePresentModal({ isOpen, onClose, onSuccess }: CreatePresentModalProps) {
  const [formData, setFormData] = useState({
    message: '',
    metadata: '',
    ethAmount: '0.01',
    isPublic: true,
    recipients: [''] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // 准备 wrap 请求数据
      const wrapData = {
        message: formData.message,
        metadata: formData.metadata,
        ethAmount: formData.ethAmount,
        isPublic: formData.isPublic,
        recipients: formData.isPublic ? [] : formData.recipients.filter(r => r.trim()),
        sender: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' // Mock sender for now
      }

      console.log('🎁 Creating present with data:', wrapData)

      // 调用 wrap API
      const response = await fetch('/api/presents/wrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wrapData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Present created successfully:', result)
        onSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create present')
      }
    } catch (err) {
      console.error('❌ Error creating present:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }))
  }

  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }))
  }

  const updateRecipient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold gradient-text">Create New Gift 🎁</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gift Message *
            </label>
            <input
              type="text"
              required
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Happy Birthday! 🎉"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Metadata */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.metadata}
              onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
              placeholder="A special gift for you..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          {/* ETH Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ETH Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0.001"
                step="0.001"
                value={formData.ethAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, ethAmount: e.target.value }))}
                className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">
                ETH
              </span>
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-300">
                Make this gift public (anyone can claim)
              </span>
            </label>
          </div>

          {/* Recipients (if private) */}
          {!formData.isPublic && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Recipients *
              </label>
              {formData.recipients.map((recipient, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={recipient}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                  {formData.recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecipient(index)}
                      className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors duration-200"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRecipient}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200"
              >
                + Add another recipient
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span className="text-lg">🎁</span>
                <span>Create Gift</span>
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="text-red-400 text-sm text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              ❌ {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
