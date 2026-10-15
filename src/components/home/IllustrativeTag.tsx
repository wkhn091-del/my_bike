/** Required on every image from src/content/illustrative.ts: they are not photos of a real event. */
export function IllustrativeTag({ className = "" }: { className?: string }) {
  return (
    <span className={`absolute bottom-2 start-2 rounded-full bg-charcoal/60 px-2.5 py-0.5 text-[0.75rem] text-cream backdrop-blur-sm ${className}`}>
      תמונה להמחשה
    </span>
  );
}
