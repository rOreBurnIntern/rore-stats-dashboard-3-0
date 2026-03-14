import * as React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({
  label,
  value,
  unit,
  icon,
  className = ''
}: StatCardProps) {
  return (
    <div
      className={`rounded border border-gray-700 bg-[#090805] shadow p-4 ${className}`}
      data-testid="stat-card"
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="text-sm text-[#fff3e8]">{label}</h2>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold text-[#fff3e8]">{value}</p>
        {unit && <p className="text-sm text-[#fff3e8]">{unit}</p>}
      </div>
    </div>
  );
}
