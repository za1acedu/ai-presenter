"use client";

interface Slide {
  type: string;
  title: string;
  content?: string;
  bullets?: string[];
  image_prompt?: string;
  speaker_notes?: string;
}

interface Presentation {
  title: string;
  theme?: string;
  slides: Slide[];
}

interface PresentationViewProps {
  presentation: Presentation;
}

const TYPE_COLORS: Record<string, string> = {
  title: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  content: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  section: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  summary: "bg-green-500/20 text-green-300 border-green-500/30",
  closing: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

function getBullets(slide: Slide): string[] {
  if (slide.bullets && slide.bullets.length > 0) return slide.bullets;
  if (slide.content) return slide.content.split("|").map((s) => s.trim()).filter(Boolean);
  return [];
}

export default function PresentationView({ presentation }: PresentationViewProps) {
  return (
    <div className="space-y-6">
      {/* Title card */}
      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center">
        <h2 className="text-3xl font-bold text-white">{presentation.title}</h2>
        {presentation.theme && (
          <p className="mt-2 text-sm text-slate-400">Theme: {presentation.theme}</p>
        )}
        <p className="mt-1 text-sm text-slate-500">{presentation.slides.length} slides</p>
      </div>

      {/* Slide cards */}
      <div className="grid gap-4">
        {presentation.slides.map((slide, index) => {
          const colors = TYPE_COLORS[slide.type] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
          const bullets = getBullets(slide);

          return (
            <div
              key={index}
              className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6 transition-colors hover:border-slate-600"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                  {index + 1}
                </span>
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors}`}>
                  {slide.type}
                </span>
              </div>

              <h3 className="mb-3 text-lg font-semibold text-white">{slide.title}</h3>

              {bullets.length > 0 && (
                <ul className="mb-4 space-y-1.5 pl-1">
                  {bullets.map((bullet, bi) => (
                    <li key={bi} className="flex gap-2 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}

              {slide.image_prompt && (
                <p className="text-sm italic text-slate-500">
                  Image: {slide.image_prompt}
                </p>
              )}

              {slide.speaker_notes && (
                <div className="mt-3 rounded-lg bg-slate-900/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Speaker Notes</p>
                  <p className="mt-1 text-sm text-slate-400">{slide.speaker_notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
