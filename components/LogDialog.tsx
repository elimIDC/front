'use client';

import { useEffect, useState } from 'react';
import Dialog from './Dialog';
import { api } from '@/lib/api';
import type { LogEntry } from '@/lib/rack';

export default function LogDialog({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.logs().then(setLogs, (e: Error) => setErr(e.message));
  }, []);

  return (
    <Dialog onClose={onClose}>
      <div className="form">
        <h2>변경 이력</h2>
        {err && <p className="err">{err}</p>}
        {!err && !logs && <p className="help">불러오는 중…</p>}
        {logs && !logs.length && <p className="help">아직 기록이 없습니다. 장비를 반입하거나 반출하면 여기에 남습니다.</p>}
        {logs && logs.length > 0 && (
          <ul className="log">
            {logs.map((x) => (
              <li key={x.id}>
                <time>{x.at}</time>
                <span>{x.text}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="bar">
          <span className="sp" />
          <button type="button" className="btn ghost" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </Dialog>
  );
}
