'use client';

import { useEffect, useRef } from 'react';

/** 열린 채로 마운트되는 네이티브 <dialog>. Esc, 바깥 클릭으로 닫힘 */
export default function Dialog({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    // 언마운트되면 DOM에서 빠지면서 함께 닫히므로 cleanup에서 close()를 부르지 않는다
    // (StrictMode 이중 실행 때 close 이벤트로 바로 닫히는 것을 막음)
  }, []);

  return (
    <dialog
      ref={ref}
      className="dlg"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
