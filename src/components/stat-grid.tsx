"use client";

import { Battery, Flame, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StatGridProps {
  willpower: number;
  streak: number;
  releaseDate: string;
}

export function StatGrid({ willpower, streak, releaseDate }: StatGridProps) {
  const formattedDate = new Date(releaseDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <StatCard 
        icon={<Battery className="w-4 h-4" />} 
        label="Willpower" 
        value={`${willpower}/100`}
        sub={<Progress value={willpower} className="h-1 mt-2" />}
      />
      <StatCard 
        icon={<Flame className="w-4 h-4 text-orange-500" />} 
        label="Streak" 
        value={`${streak} Days`}
        sub={<div className="text-[10px] opacity-50 mt-1">Consistency is Key</div>}
      />
      <StatCard 
        icon={<CalendarIcon className="w-4 h-4" />} 
        label="Next Release" 
        value={formattedDate}
        sub={<div className="text-[10px] opacity-50 mt-1">Pending Compliance</div>}
      />
      <StatCard 
        icon={<AlertCircle className="w-4 h-4" />} 
        label="Violation" 
        value="Clean"
        sub={<div className="text-[10px] opacity-50 mt-1 text-green-500">No active extensions</div>}
      />
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl neumorphic-flat flex flex-col justify-between">
      <div className="flex items-center gap-2 opacity-60 mb-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
      </div>
      <div>
        <div className="text-lg font-bold">{value}</div>
        {sub}
      </div>
    </div>
  );
}
