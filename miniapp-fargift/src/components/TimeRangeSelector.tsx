'use client';

import { useState, useEffect } from 'react';

export type TimeRange = {
  label: string;
  days: number;
  fromDate: Date;
  toDate: Date;
};

const PRESET_RANGES: TimeRange[] = [
  {
    label: '今天',
    days: 1,
    fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    toDate: new Date()
  },
  {
    label: '本周',
    days: 7,
    fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    toDate: new Date()
  },
  {
    label: '本月',
    days: 30,
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    toDate: new Date()
  }
];

interface TimeRangeSelectorProps {
  onTimeRangeChange: (timeRange: TimeRange) => void;
  selectedRange?: TimeRange;
}

export default function TimeRangeSelector({ onTimeRangeChange, selectedRange }: TimeRangeSelectorProps) {
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');

  // 当 selectedRange 改变时，更新自定义日期输入
  useEffect(() => {
    if (selectedRange) {
      setCustomFromDate(selectedRange.fromDate.toISOString().split('T')[0]);
      setCustomToDate(selectedRange.toDate.toISOString().split('T')[0]);
    }
  }, [selectedRange]);

  const handlePresetClick = (range: TimeRange) => {
    console.log('🎯 Preset clicked:', range.label);
    // 确保日期对象是新的实例
    const newRange: TimeRange = {
      ...range,
      fromDate: new Date(range.fromDate),
      toDate: new Date(range.toDate)
    };
    onTimeRangeChange(newRange);
  };

  const handleCustomRangeSubmit = () => {
    if (customFromDate && customToDate) {
      console.log('🎯 Custom range submitted:', { customFromDate, customToDate });
      const fromDate = new Date(customFromDate);
      const toDate = new Date(customToDate);
      
      // 验证日期
      if (fromDate > toDate) {
        alert('开始日期不能晚于结束日期');
        return;
      }
      
      const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const customRange: TimeRange = {
        label: `自定义 (${days}天)`,
        days,
        fromDate,
        toDate
      };
      
      onTimeRangeChange(customRange);
    } else {
      alert('请选择开始和结束日期');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">选择时间范围</h3>
      
      {/* 预设时间范围 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">快速选择</h4>
        <div className="flex flex-wrap gap-3">
          {PRESET_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => handlePresetClick(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedRange?.label === range.label
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义时间范围 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">自定义时间范围</h4>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="fromDate" className="block text-xs text-gray-600 mb-2">
              开始日期
            </label>
            <input
              type="date"
              id="fromDate"
              value={customFromDate}
              onChange={(e) => setCustomFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="toDate" className="block text-xs text-gray-600 mb-2">
              结束日期
            </label>
            <input
              type="date"
              id="toDate"
              value={customToDate}
              onChange={(e) => setCustomToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCustomRangeSubmit}
              disabled={!customFromDate || !customToDate}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              应用
            </button>
          </div>
        </div>
      </div>

      {/* 当前选择的时间范围 */}
      {selectedRange && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-800">
            <span className="font-medium">当前选择：</span>
            {selectedRange.label} ({selectedRange.fromDate.toLocaleDateString()} - {selectedRange.toDate.toLocaleDateString()})
          </p>
        </div>
      )}
    </div>
  );
}
