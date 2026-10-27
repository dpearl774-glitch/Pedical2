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
    <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-bottom">
      <div className="grid grid-cols-6 items-center h-16 max-w-lg mx-auto">
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
              className={`flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-colors relative ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-blue-700 rounded-full" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[56px] font-sans">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
