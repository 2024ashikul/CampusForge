import React from 'react';

export interface TabOption<T extends string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
  locked?: boolean;
}

export interface TabsProps<T extends string> {
  options: TabOption<T>[];
  activeTab: T;
  onChange: (key: T) => void;
}

export function Tabs<T extends string>({ options, activeTab, onChange }: TabsProps<T>) {
  return (
    <div className="flex gap-1 p-1 bg-footer border border-customBorder rounded-lg overflow-x-auto max-w-full [scrollbar-width:none]">
      {options.map((option) => {
        const isActive = activeTab === option.key;
        return (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-accent text-[#101614]'
                : option.locked
                ? 'text-subText/50 cursor-not-allowed'
                : 'text-subText hover:text-mainText hover:bg-primary/50'
            }`}
          >
            {option.icon}
            {option.label}
            {option.locked && <span className="text-[10px]">🔒</span>}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
