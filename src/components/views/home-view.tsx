"use client";

import { TimerCard } from "@/components/timer-card";
import { StatGrid } from "@/components/stat-grid";
import { TaskCard } from "@/components/task-card";
import { AppState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface HomeViewProps {
  state: AppState;
  completeTask: (id: string) => void;
  failTask: (id: string) => void;
}

export function HomeView({ state, completeTask, failTask }: HomeViewProps) {
  const activeTask = state.tasks.find(t => t.status === 'Pending') || state.tasks[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <TimerCard 
        timerEnd={state.timerEnd} 
        punishmentMode={state.punishmentMode} 
        tier={state.tier} 
      />
      
      <StatGrid 
        willpower={state.willpower} 
        streak={state.streak} 
        releaseDate={state.releaseDate} 
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-60">Active Objective</h2>
        </div>
        
        {activeTask ? (
          <TaskCard 
            task={activeTask} 
            onComplete={() => completeTask(activeTask.id)} 
            onFail={() => failTask(activeTask.id)}
          />
        ) : (
          <div className="p-8 rounded-3xl neumorphic-inset text-center opacity-40">
            <p className="text-sm">No active tasks. Check the Tasks tab to generate new ones.</p>
          </div>
        )}
      </section>
    </div>
  );
}
