"use client";

import { useState, useEffect, useCallback } from "react";
import { GenerateTasksOutput } from "@/ai/flows/ai-generated-tasks";

export type Tier = "Newbie" | "Slave" | "Hardcore" | "Extreme" | "Destruction";
export type Task = GenerateTasksOutput[0];

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AppState {
  tier: Tier;
  timerEnd: number;
  willpower: number;
  streak: number;
  punishmentMode: boolean;
  tasks: Task[];
  chatMessages: Message[];
  releaseDate: string;
  lastTaskGeneration: number;
}

const STORAGE_KEY = "lockedin_ai_state_v1";

const DEFAULT_STATE: AppState = {
  tier: "Hardcore",
  timerEnd: Date.now() + 4 * 24 * 60 * 60 * 1000,
  willpower: 73,
  streak: 4,
  punishmentMode: false,
  tasks: [],
  chatMessages: [
    {
      role: "assistant",
      content: "Subject, you are now under my control. Obey or suffer the consequences.",
      timestamp: Date.now(),
    },
  ],
  releaseDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  lastTaskGeneration: 0,
};

export function useLockedInStore() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...DEFAULT_STATE, ...parsed });
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(updater);
  }, []);

  const completeTask = (taskId: string) => {
    updateState((prev) => {
      const taskIndex = prev.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;
      const newTasks = [...prev.tasks];
      newTasks[taskIndex] = { ...newTasks[taskIndex], status: "Completed" as any };
      return {
        ...prev,
        tasks: newTasks,
        willpower: Math.min(100, prev.willpower + 5),
      };
    });
  };

  const failTask = (taskId: string) => {
    updateState((prev) => {
      const taskIndex = prev.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;
      const newTasks = [...prev.tasks];
      newTasks[taskIndex] = { ...newTasks[taskIndex], status: "Failed" as any };
      // Penalize: Extend timer by 4 hours
      const extension = 4 * 60 * 60 * 1000;
      return {
        ...prev,
        tasks: newTasks,
        timerEnd: prev.timerEnd + extension,
        willpower: Math.max(0, prev.willpower - 10),
        punishmentMode: true,
      };
    });
  };

  const addChatMessage = (msg: Message) => {
    updateState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, msg],
    }));
  };

  return {
    state,
    isLoaded,
    updateState,
    completeTask,
    failTask,
    addChatMessage,
  };
}
