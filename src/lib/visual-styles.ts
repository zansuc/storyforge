// StoryForge — visual style library (20 gaya, 5 kategori).
// language: TypeScript (data module)

export type StyleCategory = "2d" | "3d" | "realistis" | "motion";

export interface VisualStyleDef {
  id: string;
  label: string;
  cat: StyleCategory;
  prompt: string | null;
  isDefault?: boolean;
}

export const VISUAL_STYLES: VisualStyleDef[] = [
  { id: "stickman_putih", label: "Stickman putih komikal", cat: "2d", prompt: null, isDefault: true },
  { id: "stickman", label: "Stickman berwarna", cat: "2d", prompt: "2D flat vector illustration frame for a YouTube storytelling video. Colorful, detailed flat background (never plain white). ALL characters are simple STICKMAN figures: thin black line bodies, arms and legs, plain round white heads with minimal cartoon faces (dot eyes, small eyebrows, simple mouth), no realistic anatomy. Each stickman wears only small costume pieces that match their role (hat, crown, sash, headcloth, props) while the stick body stays visible. Clean bold outlines, flat colors with light soft shading, every character in the same consistent stickman style, cinematic composition with depth. No text, no letters, no captions, no watermark, no logo." },
  { id: "flat", label: "Kartun flat", cat: "2d", prompt: "Flat vector explainer illustration, bold geometric shapes, a limited harmonious color palette, clean lines, friendly cartoon characters with simple features, soft subtle grain texture, clear readable composition. No text, no letters, no captions, no watermark, no logo." },
  { id: "whiteboard", label: "Whiteboard doodle", cat: "2d", prompt: "Hand-drawn whiteboard doodle, black marker line art on a clean white board, one accent color used sparingly (red or blue), simple sketchy characters, arrows and small icons, like a whiteboard animation explainer. No text, no letters, no captions, no watermark, no logo." },
  { id: "collage", label: "Kolase kertas", cat: "2d", prompt: "Paper cut-out collage, layered textured paper, vintage photo cutouts, halftone print textures, torn edges, soft shadows between paper layers, editorial documentary style. No text, no letters, no captions, no watermark, no logo." },
  { id: "watercolor", label: "Buku cerita cat air", cat: "2d", prompt: "Children's storybook watercolor illustration, soft washes on textured paper, warm pastel palette, cute expressive characters, whimsical and cozy mood. No text, no letters, no captions, no watermark, no logo." },
  { id: "anime", label: "Anime", cat: "2d", prompt: "High-quality anime film still, clean cel shading, expressive characters, detailed painted background, cinematic lighting and color. No text, no letters, no captions, no watermark, no logo." },
  { id: "noir", label: "Komik noir", cat: "2d", prompt: "Dark graphic-novel comic panel, heavy black ink shadows, high contrast, muted palette with a single accent color, dramatic angles, halftone texture, suspenseful mood. No text, no letters, no captions, no watermark, no logo." },
  { id: "pixel", label: "Pixel art", cat: "2d", prompt: "Detailed 16-bit pixel art scene, crisp pixels, limited retro palette, video game aesthetic, no blur. No text, no letters, no captions, no watermark, no logo." },
  { id: "animation3d", label: "Animasi 3D", cat: "3d", prompt: "3D animated feature film render, stylized characters with big expressive faces, soft global illumination, subsurface scattering, vibrant colors, cinematic depth of field. No text, no letters, no captions, no watermark, no logo." },
  { id: "clay", label: "Claymation", cat: "3d", prompt: "Claymation stop-motion scene, handcrafted plasticine characters and miniature sets, visible fingerprints and clay texture, soft studio lighting. No text, no letters, no captions, no watermark, no logo." },
  { id: "lowpoly", label: "Low-poly 3D", cat: "3d", prompt: "Low-poly 3D render, faceted geometric shapes, flat-shaded polygons, clean pastel colors, soft ambient lighting. No text, no letters, no captions, no watermark, no logo." },
  { id: "diorama", label: "Diorama miniatur", cat: "3d", prompt: "Tilt-shift miniature diorama, tiny detailed 3D figures and buildings, shallow depth of field, soft daylight, toy-like scale. No text, no letters, no captions, no watermark, no logo." },
  { id: "cinematic", label: "Sinematik realistis", cat: "realistis", prompt: "Photorealistic cinematic film still, dramatic natural lighting, shallow depth of field, anamorphic lens look, rich color grading, subtle 35mm film grain. No text, no letters, no captions, no watermark, no logo." },
  { id: "documentary", label: "Foto dokumenter", cat: "realistis", prompt: "Realistic documentary photograph, natural light, authentic details, candid composition, high detail, true-to-life colors. No text, no letters, no captions, no watermark, no logo." },
  { id: "archival", label: "Arsip sejarah", cat: "realistis", prompt: "Vintage archival photograph, faded sepia or black and white, film grain, light scratches and dust, historical documentary look. No text, no letters, no captions, no watermark, no logo." },
  { id: "epic", label: "Fantasi epik", cat: "realistis", prompt: "Epic realistic fantasy concept art, highly detailed, volumetric light, grand scale, painterly realism, cinematic composition. No text, no letters, no captions, no watermark, no logo." },
  { id: "motiongfx", label: "Motion graphics flat", cat: "motion", prompt: "2D flat motion graphics explainer animation frame. Clean flat vector design built from simple geometric shapes, solid saturated colors from a limited palette of four to five colors plus one accent color, no gradients and no textures, bold simple icons, geometric characters with minimal faces (circle heads, dot eyes), uncluttered composition with generous negative space. Movement uses springy confident easing: shapes slide, scale and morph smoothly, icons pop in with a slight overshoot, and scenes change through smooth wipes and shape morphs. Smooth, modern, professional explainer look. No text, no letters, no captions, no watermark, no logo." },
  { id: "infografis", label: "Infografis bergerak", cat: "motion", prompt: "Animated infographic motion graphics frame for data storytelling. Clean structured grid layout on a solid soft background, animated bar charts, line graphs, pie segments, progress rings, counters, arrows and flat icons that draw in and grow with smooth easing, key data points highlighted in a single accent color, consistent limited palette, flat vector shapes, tidy composition with clear visual hierarchy. Simple geometric characters or a pointing hand may guide attention to the data. No text, no letters, no numbers, no captions, no watermark, no logo." },
  { id: "isometrik", label: "Isometrik 2.5D", cat: "motion", prompt: "Minimalist isometric 2.5D motion graphics frame. Isometric flat vector scene built from layered simple geometric blocks, platforms and buildings at a consistent isometric angle, soft long flat shadows, a harmonious limited color palette with one accent color, clean lines, small simple geometric characters. Elements assemble, stack and slide into place layer by layer with smooth easing and subtle parallax depth. Clean, modern, premium explainer look. No text, no letters, no captions, no watermark, no logo." },
];

export const STYLE_CATEGORIES: { id: "all" | StyleCategory; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "2d", label: "2D" },
  { id: "3d", label: "3D" },
  { id: "realistis", label: "Realistis" },
  { id: "motion", label: "Motion" },
];
