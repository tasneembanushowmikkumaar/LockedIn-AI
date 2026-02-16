"use client";

import { useState } from "react";
import { generateTasks } from "@/ai/flows/ai-generated-tasks";
import { AppState, useLockedInStore } from "@/lib/store";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TasksViewProps {
  state: AppState;
  completeTask: (id: string) => void;
  failTask: (id: string) => void;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export function TasksView({ state, completeTask, failTask, updateState }: TasksViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    try {
      const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening' as any;
      const newTasks = await generateTasks({
        tier: state.tier,
        punishmentMode: state.punishmentMode,
        timeOfDay: timeOfDay,
      });
      
      updateState((prev) => ({
        ...prev,
        tasks: newTasks,
        lastTaskGeneration: Date.now(),
      }));
      
      toast({
        title: "Tasks Updated",
        description: "LockedIn AI has issued new commands.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Command Failed",
        description: "Unable to reach AI control server.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-headline font-black tracking-tight">Daily Protocol</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Status: Operational</p>
        </div>
        <Button 
          onClick={handleGenerateTasks} 
          disabled={isGenerating}
          size="icon"
          className="h-12 w-12 rounded-2xl neumorphic-flat text-primary hover:text-primary/80 bg-transparent border-0"
        >
          <RefreshCw className={cn("w-5 h-5", isGenerating && "animate-spin")} />
        </Button>
      </div>

      {state.punishmentMode && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-xs font-bold text-red-400 uppercase tracking-tighter">
            Punishment protocol active. Tasks are significantly harsher.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {state.tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="p-6 rounded-full neumorphic-inset">
              <Sparkles className="w-12 h-12 text-primary opacity-20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Awaiting Orders</h3>
              <p className="text-sm text-muted-foreground">Request your daily tasks from the AI controller.</p>
            </div>
            <Button onClick={handleGenerateTasks} className="px-8 rounded-2xl h-12 bg-primary text-primary-foreground">
              Initialize Protocol
            </Button>
          </div>
        ) : (
          state.tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onComplete={() => completeTask(task.id)} 
              onFail={() => failTask(task.id)} 
            />
          ))
        )}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
