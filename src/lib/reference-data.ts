// StoryForge — data reference (voice Gemini TTS, gaya penyampaian, gaya visual, master prompt).
// Diekstrak 1:1 dari Tokogame Video Generator reference.
// language: TypeScript

export interface Voice {
  name: string;
  label: string;
  gender: "P" | "L";
  desc: string;
}

export interface DeliveryStyle {
  id: string;
  emoji: string;
  name: string;
  desc: string;
}

// 30 voice Gemini TTS — label + gender + deskripsi
export const VOICES: Voice[] = [
  { name: "Achernar", label: "Lembut", gender: "P", desc: "Suara lembut dan tenang" },
  { name: "Achird", label: "Ramah", gender: "L", desc: "Ramah dan akrab" },
  { name: "Algenib", label: "Serak berat", gender: "L", desc: "Berat dan sedikit serak" },
  { name: "Algieba", label: "Halus", gender: "L", desc: "Halus dan mengalir" },
  { name: "Alnilam", label: "Tegas", gender: "L", desc: "Tegas dan mantap" },
  { name: "Aoede", label: "Ringan", gender: "P", desc: "Ringan dan santai" },
  { name: "Autonoe", label: "Cerah", gender: "P", desc: "Cerah dan bersemangat" },
  { name: "Callirrhoe", label: "Santai", gender: "P", desc: "Santai dan luwes" },
  { name: "Charon", label: "Informatif", gender: "L", desc: "Jelas dan informatif" },
  { name: "Despina", label: "Halus", gender: "P", desc: "Halus dan lembut mengalir" },
  { name: "Enceladus", label: "Berbisik", gender: "L", desc: "Napasnya terdengar" },
  { name: "Erinome", label: "Jernih", gender: "P", desc: "Jernih dan artikulatif" },
  { name: "Fenrir", label: "Antusias", gender: "L", desc: "Antusias dan menggebu" },
  { name: "Gacrux", label: "Dewasa", gender: "P", desc: "Matang dan berwibawa" },
  { name: "Iapetus", label: "Jernih", gender: "L", desc: "Jernih dan lugas" },
  { name: "Kore", label: "Tegas", gender: "P", desc: "Tegas dan percaya diri" },
  { name: "Laomedeia", label: "Ceria", gender: "P", desc: "Ceria dan energik" },
  { name: "Leda", label: "Muda", gender: "P", desc: "Muda dan segar" },
  { name: "Orus", label: "Tegas", gender: "L", desc: "Tegas dan stabil" },
  { name: "Puck", label: "Ceria", gender: "L", desc: "Ceria dan lincah" },
  { name: "Pulcherrima", label: "Lugas", gender: "P", desc: "Bicara langsung dan percaya diri" },
  { name: "Rasalgethi", label: "Informatif", gender: "L", desc: "Gaya pembawa materi" },
  { name: "Sadachbia", label: "Hidup", gender: "L", desc: "Hidup dan dinamis" },
  { name: "Sadaltager", label: "Berpengetahuan", gender: "L", desc: "Terdengar paham materi dan kredibel" },
  { name: "Schedar", label: "Netral", gender: "L", desc: "Rata dan stabil" },
  { name: "Sulafat", label: "Hangat", gender: "P", desc: "Hangat dan menenangkan" },
  { name: "Umbriel", label: "Santai", gender: "L", desc: "Santai dan bersahabat" },
  { name: "Vindemiatrix", label: "Lembut", gender: "P", desc: "Lembut dan halus" },
  { name: "Zephyr", label: "Cerah", gender: "P", desc: "Cerah dan ringan" },
  { name: "Zubenelgenubi", label: "Kasual", gender: "L", desc: "Kasual" },
];

// Gaya penyampaian (delivery) — dipakai untuk gaya storytelling
export const DELIVERY_STYLES: DeliveryStyle[] = [
  { id: "komedi", emoji: "😄", name: "Santai & Komedi (mirip Sam O\'Nella / Kok Bisa)", desc: "Bahasa gaul, analogi kocak, ekspresi lebay" },
  { id: "sejarah", emoji: "🏛️", name: "Storytelling Sejarah (mirip Oversimplified)", desc: "Dramatis, humor sarkas, alur kronologis" },
  { id: "edukatif", emoji: "💡", name: "Edukatif & To-The-Point", desc: "Penjelasan fakta yang jernih, cepat, mudah dipahami" },
];

// Master prompt default — gaya visual stickman explainer
export const MASTER_PROMPT = "2D minimalist explainer animation style, a simple stickman-like cartoon character with a large round head and expressive comical facial features, thick black outlines, solid flat colors, clean vector art, hand-drawn background, humorous educational YouTube style, no speech bubbles, silent visual animation";

