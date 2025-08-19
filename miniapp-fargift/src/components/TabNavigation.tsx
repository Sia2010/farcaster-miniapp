import { TabType } from '@/types'

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'live', label: 'live' },
    { id: 'historic', label: 'historic' }
  ]

  return (
    <div className="flex bg-gray-700 rounded-lg p-1 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-gray-800 text-white shadow-sm'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
