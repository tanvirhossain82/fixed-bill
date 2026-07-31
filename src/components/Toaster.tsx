import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastState = { msg: string; kind: 'ok' | 'err' } | null;

let pushFn: ((msg: string, kind?: 'ok' | 'err') => void) | null = null;
export function toast(msg: string, kind: 'ok' | 'err' = 'ok') {
  pushFn?.(msg, kind);
}

export default function Toaster() {
  const [state, setState] = useState<ToastState>(null);

  useEffect(() => {
    pushFn = (msg: string, kind: 'ok' | 'err' = 'ok') => setState({ msg, kind });
    return () => { pushFn = null; };
  }, []);

  useEffect(() => {
    if (!state) return;
    const id = setTimeout(() => setState(null), 3200);
    return () => clearTimeout(id);
  }, [state]);

  if (!state) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-[slideIn_0.2s_ease-out]">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border max-w-sm ${
        state.kind === 'ok'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-red-50 border-red-200 text-red-900'
      }`}>
        {state.kind === 'ok'
          ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600" />
          : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />}
        <p className="text-sm font-medium leading-snug">{state.msg}</p>
        <button onClick={() => setState(null)} className="ml-1 -mr-1 p-0.5 rounded hover:bg-black/5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
