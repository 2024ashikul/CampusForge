import React from 'react';

// Define what a single tab configuration looks like
export interface TabOption<T extends string> {
    key: T;
    label: string;
}

// Define the properties our modular TabBar requires
export interface TabsProps<T extends string> {
    options: TabOption<T>[];
    activeTab: T;
    onChange: (key: T) => void;
}

export function Tabs<T extends string>({
    options,
    activeTab,
    onChange
}: TabsProps<T>) {
    return (
        <div className="flex sticky top-0 mb-4 z-50 bg-primary border-b border-customBorder space-x-1 overflow-x-auto">
            {options.map((option) => (
                <button
                    key={option.key}
                    onClick={() => onChange(option.key)}
                    className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === option.key
                            ? 'border-accent text-accent'
                            : 'border-transparent text-subText hover:text-mainText'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export default Tabs;


// example use:
// import React, { useState } from 'react';
// import { Tabs, TabOption } from './Tabs'; // Adjust path accordingly

// // 1. Define your strict tab keys union
// type tabkeys = 'posts' | 'projects' | 'achievements';

// export const UserProfile = () => {
//   const [activeTab, setActiveTab] = useState<tabkeys>('posts');

//   // 2. Build your options array using the same strict keys
//   const tabOptions: TabOption<tabkeys>[] = [
//     { key: 'posts', label: 'My Posts' },
//     { key: 'projects', label: 'Projects' },
//     { key: 'achievements', label: 'Awards' },
//   ];

//   return (
//     <div className="space-y-4">
//       {/* 3. Render the component */}
//       <Tabs 
//         options={tabOptions} 
//         activeTab={activeTab} 
//         onChange={(key) => setActiveTab(key)} 
//       />
      
//       {/* 4. Conditional Content Mapping */}
//       {activeTab === 'posts' && <div>Rendering Posts View...</div>}
//       {activeTab === 'projects' && <div>Rendering Projects View...</div>}
//       {activeTab === 'achievements' && <div>Rendering Achievements View...</div>}
//     </div>
//   );
// };