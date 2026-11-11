// StoryForge — shared domain types
// language: TypeScript (Next 16 App Router, client-heavy)
export type Duration = 30 | 60 | 90 | 120 | 180;
export type VisualStyle = "Stickman" | "Cinematic" | "Anime" | "Minimalist";
export type DeliveryStyleId = "komedi" | "sejarah" | "edukatif";
export type AspectRatio = "9:16" | "16:9";
export type Resolution = 720 | 1080;
export type VoiceoverMode = "ai" | "upload";
export type GenerationMode = "manual" | "auto";

/** One storyboard scene. durationSec = 10s per scene per PRD. */
export interface Scene {
  scene_number: number;
  text: string;
  image_prompt: string;
}

/** A clip the user uploaded manually, OR a NexaBot-generated clip. */
export interface SceneAsset {
  sceneNumber: number;
  file: File;
  url: string; // object URL for preview
  source: "upload" | "nexabot";
}

export interface AssemblyResult {
  blob: Blob;
  url: string;
  sizeBytes: number;
  durationSec: number | null;
}
