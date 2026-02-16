"use client";

import { useEffect, useState } from "react";
import { Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerCardProps {
  timerEnd: number;
  punishmentMode: boolean;
  tier: string;
}

export function TimerCard({ timerEnd, punishmentMode, tier }: TimerCardProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, timerEnd - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnd]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const isCritical = timeLeft < 24 * 60 * 60 * 1000;

  return (
    <div className={cn(
      "w-full p-8 rounded-[2rem] neumorphic-flat relative overflow-hidden transition-all duration-500",
      isCritical && "animate-pulse-red border-2 border-red-500/30",
      punishmentMode && "bg-red-950/20"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full neumorphic-inset">
            <Lock className={cn("w-5 h-5", isCritical ? "text-red-500" : "text-primary")} />
          </div>
          <span className="text-sm font-bold tracking-widest uppercase opacity-70">Locked In</span>
        </div>
        {punishmentMode && (
          <div className="flex items-center gap-1 text-red-500 font-bold text-xs uppercase animate-bounce">
            <Zap className="w-4 h-4" /> Punishment Active
          </div>
        )}
      </div>

      <div className="flex justify-center items-center gap-4 py-4">
        <TimeUnit value={days} label="d" />
        <span className="text-4xl font-bold opacity-30">:</span>
        <TimeUnit value={hours} label="h" />
        <span className="text-4xl font-bold opacity-30">:</span>
        <TimeUnit value={minutes} label="m" />
        <span className="text-4xl font-bold opacity-30">:</span>
        <TimeUnit value={seconds} label="s" />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="px-6 py-2 rounded-full neumorphic-inset text-sm font-medium tracking-wide">
          <span className="text-accent mr-2">Tier {tier.toUpperCase()}</span>
          <span className="opacity-50">|</span>
          <span className="ml-2 opacity-70">LIVE MONITORING</span>
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl font-headline font-black tracking-tighter tabular-nums">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-[10px] uppercase font-bold opacity-40 mt-1">{label}</div>
    </div>
  );
}
