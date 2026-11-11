"use client";
// StoryForge — Zustand store. Holds API keys (localStorage-persisted), settings,
// script, generated scenes, and per-scene assets.
// language: TypeScript, runtime: browser (zustand v5)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AspectRatio,
  DeliveryStyleId,
  Duration,
  GenerationMode,
  Resolution,
  Scene,
  SceneAsset,
  VisualStyle,
  VoiceoverMode,
} from "@/lib/types";
import { MASTER_PROMPT } from "@/lib/reference-data";

interface StoryForgeState {
  // --- API keys (persisted to localStorage) ---
  geminiApiKey: string;
  nexabotApiKey: string;
  setGeminiApiKey: (k: string) => void;
  setNexabotApiKey: (k: string) => void;

  // --- form settings ---
  script: string;
  setScript: (s: string) => void;
  duration: Duration;
  setDuration: (d: Duration) => void;
  visualStyle: VisualStyle;
  setVisualStyle: (s: VisualStyle) => void;
  deliveryStyle: DeliveryStyleId;
  setDeliveryStyle: (d: DeliveryStyleId) => void;
  voice: string;
  setVoice: (v: string) => void;
  masterPrompt: string;
  setMasterPrompt: (m: string) => void;
  clipDirection: string;
  setClipDirection: (c: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (a: AspectRatio) => void;
  resolution: Resolution;
  setResolution: (r: Resolution) => void;
  voiceoverMode: VoiceoverMode;
  setVoiceoverMode: (v: VoiceoverMode) => void;
  generationMode: GenerationMode;
  setGenerationMode: (m: GenerationMode) => void;

  // --- storyboard results ---
  scenes: Scene[];
  setScenes: (s: Scene[]) => void;
  assets: Record<number, SceneAsset>; // key = scene_number
  setAsset: (sceneNumber: number, a: SceneAsset | null) => void;
  clearAssets: () => void;
  voiceover: SceneAsset | null;
  setVoiceover: (v: SceneAsset | null) => void;

  // --- generation status ---
  isGeneratingStoryboard: boolean;
  setIsGeneratingStoryboard: (b: boolean) => void;
  generationStatus: string | null;
  setGenerationStatus: (s: string | null) => void;
}

/** Derived: how many scenes fit the chosen duration (10s per scene). */
export const sceneCount = (duration: Duration): number => duration / 10;

export const useStoryForge = create<StoryForgeState>()(
  persist(
    (set) => ({
      geminiApiKey: "",
      nexabotApiKey: "",
      setGeminiApiKey: (k) => set({ geminiApiKey: k.trim() }),
      setNexabotApiKey: (k) => set({ nexabotApiKey: k.trim() }),

      script: "",
      setScript: (s) => set({ script: s }),
      duration: 30,
      setDuration: (d) => set({ duration: d }),
      visualStyle: "Stickman",
      setVisualStyle: (s) => set({ visualStyle: s }),
      deliveryStyle: "komedi",
      setDeliveryStyle: (d) => set({ deliveryStyle: d }),
      voice: "Achernar",
      setVoice: (v) => set({ voice: v }),
      masterPrompt: MASTER_PROMPT,
      setMasterPrompt: (m) => set({ masterPrompt: m }),
      clipDirection: "",
      setClipDirection: (c) => set({ clipDirection: c }),
      aspectRatio: "16:9",
      setAspectRatio: (a) => set({ aspectRatio: a }),
      resolution: 720,
      setResolution: (r) => set({ resolution: r }),
      voiceoverMode: "ai",
      setVoiceoverMode: (v) => set({ voiceoverMode: v }),
      generationMode: "auto",
      setGenerationMode: (m) => set({ generationMode: m }),

      scenes: [],
      setScenes: (s) => set({ scenes: s }),
      assets: {},
      setAsset: (sceneNumber, a) =>
        set((st) => {
          const next = { ...st.assets };
          if (a) next[sceneNumber] = a;
          else delete next[sceneNumber];
          return { assets: next };
        }),
      clearAssets: () => set({ assets: {} }),
      voiceover: null,
      setVoiceover: (v) => set({ voiceover: v }),

      isGeneratingStoryboard: false,
      setIsGeneratingStoryboard: (b) => set({ isGeneratingStoryboard: b }),
      generationStatus: null,
      setGenerationStatus: (s) => set({ generationStatus: s }),
    }),
    {
      name: "storyforge-store",
      // Persist only keys + settings (NOT File objects — not serializable).
      partialize: (s) => ({
        geminiApiKey: s.geminiApiKey,
        nexabotApiKey: s.nexabotApiKey,
        script: s.script,
        duration: s.duration,
        visualStyle: s.visualStyle,
        deliveryStyle: s.deliveryStyle,
        voice: s.voice,
        masterPrompt: s.masterPrompt,
        clipDirection: s.clipDirection,
        aspectRatio: s.aspectRatio,
        resolution: s.resolution,
        voiceoverMode: s.voiceoverMode,
        generationMode: s.generationMode,
      }),
    },
  ),
);
