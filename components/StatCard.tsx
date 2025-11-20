import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  colorClass: string;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, colorClass, subtext }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center space-x-4 transition-transform hover:scale-[1.02]">
      <div className={`p-4 rounded-full ${colorClass} bg-opacity-10 text-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline space-x-1">
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
};

export default StatCard;