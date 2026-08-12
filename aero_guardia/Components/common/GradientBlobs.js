export default function GradientBlobs({ className = "" }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky/40 blur-3xl [animation:float-slow_14s_ease-in-out_infinite]" />
      <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-gold/30 blur-3xl [animation:float-slower_18s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-royal/40 blur-3xl [animation:float-slow_16s_ease-in-out_infinite]" />
    </div>
  );
}
