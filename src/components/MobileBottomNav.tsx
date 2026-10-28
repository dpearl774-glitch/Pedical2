import React from 'react';
import { Sun, Users, Calculator, TrendingUp, Droplets, HeartHandshake, Activity } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  patientCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  patientCount = 5,
}) => {
  const tabs = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'screener', label: 'Screen', icon: Activity },
    { id: 'ward', label: `Ward (${patientCount})`, icon: Users },
    { id: 'calculator', label: 'Inpatient', icon: Calculator },
    { id: 'schedule', label: 'Feed Log', icon: Droplets },
    { id: 'outpatient', label: 'Outpatient', icon: HeartHandshake },
  ];

  return (
    <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_-2px_rgba(15,23,42,0.08)] safe-bottom">
      <div className="grid grid-cols-6 items-center h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'calculator' &&
              (activeTab === 'resomal' || activeTab === 'feeding' || activeTab === 'recipe'));

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-all relative ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_1px_3px_rgba(37,99,235,0.4)]" />
              )}
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50/80 text-blue-700 shadow-2xs' : ''}`}>
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[56px] font-sans">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
