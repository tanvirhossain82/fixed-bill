import { useState, useRef, useEffect, useMemo } from 'react';

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  onEnter?: () => void;
};

export default function Autocomplete({
  id,
  value,
  onChange,
  suggestions,
  placeholder,
  className = '',
  onEnter,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 12);
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 12);
  }, [value, suggestions]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pick(s: string) {
    onChange(s);
    setOpen(false);
    setHi(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && filtered.length) {
      e.preventDefault();
      setOpen(true);
      setHi((p) => (p + 1) % filtered.length);
    } else if (e.key === 'ArrowUp' && filtered.length) {
      e.preventDefault();
      setHi((p) => (p <= 0 ? filtered.length - 1 : p - 1));
    } else if (e.key === 'Enter') {
      if (open && hi >= 0 && filtered[hi]) {
        e.preventDefault();
        pick(filtered[hi]);
      } else if (onEnter) {
        onEnter();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHi(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto">
          {filtered.map((s, i) => (
            <li key={s + i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                onMouseEnter={() => setHi(i)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  i === hi ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
