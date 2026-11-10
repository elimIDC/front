'use client';

import { useState } from 'react';
import Dialog from './Dialog';
import type { Rack, RackStatus } from '@/lib/rack';
import type { RackPatch } from '@/lib/api';

interface Props {
  rack: Rack;
  readOnly: boolean;
  onClose: () => void;
  onSave: (patch: RackPatch) => Promise<void>;
}

export default function RackDialog({ rack: r, readOnly, onClose, onSave }: Props) {
  const [tenant, setTenant] = useState(r.tenant);
  const [tenantNote, setTenantNote] = useState(r.tenantNote);
  const [status, setStatus] = useState<RackStatus>(r.status);
  const [checked, setChecked] = useState(r.checked);
  const [door, setDoor] = useState(r.door);
  const [noKey, setNoKey] = useState(r.noKey);
  const [note, setNote] = useState(r.note);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || busy) return;
    setBusy(true);
    setErr('');
    try {
      await onSave({ tenant: tenant.trim(), tenantNote: tenantNote.trim(), status, checked, door, noKey, note: note.trim() });
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <h2>{r.name} 랙 정보</h2>
        <fieldset disabled={readOnly} style={{ border: 0, padding: 0, margin: 0, display: 'contents' }}>
          <div className="grid2">
            <label className="f">
              <span className="fl">고객사</span>
              <input type="text" placeholder="예: 엘림넷" value={tenant} onChange={(e) => setTenant(e.target.value)} />
            </label>
            <label className="f">
              <span className="fl">범위</span>
              <input type="text" placeholder="예: 상단, 전체" value={tenantNote} onChange={(e) => setTenantNote(e.target.value)} />
            </label>
          </div>
          <div className="grid2">
            <label className="f">
              <span className="fl">상태</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as RackStatus)}>
                <option value="used">사용</option>
                <option value="empty">미사용</option>
                <option value="leased">전체 임대 (내부 미기재)</option>
              </select>
            </label>
            <label className="f">
              <span className="fl">확인일</span>
              <input type="date" value={checked} onChange={(e) => setChecked(e.target.value)} />
            </label>
          </div>
          <div className="checks">
            <label className="cb">
              <input type="checkbox" checked={door} onChange={(e) => setDoor(e.target.checked)} />
              <span>랙 문 설치</span>
            </label>
            <label className="cb">
              <input type="checkbox" checked={noKey} onChange={(e) => setNoKey(e.target.checked)} />
              <span>랙 열쇠 없음</span>
            </label>
          </div>
          <label className="f">
            <span className="fl">메모</span>
            <input type="text" placeholder="계약, 반입 내역 등" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </fieldset>
        <p className="err">{err}</p>
        <div className="bar">
          <span className="sp" />
          <button type="button" className="btn ghost" onClick={onClose}>
            {readOnly ? '닫기' : '취소'}
          </button>
          {!readOnly && (
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? '저장 중…' : '저장'}
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
