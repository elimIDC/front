'use client';

import { useEffect, useRef, useState } from 'react';
import Dialog from './Dialog';
import { SLOTS, UNITS, overlaps, rangeText, sizeText, type Box, type Device, type Rack } from '@/lib/rack';
import type { DeviceInput } from '@/lib/api';

interface Props {
  racks: Rack[];
  rack: Rack;
  device: Device | null;
  preset?: Box;
  readOnly: boolean;
  onClose: () => void;
  onSave: (rackId: string, input: DeviceInput) => Promise<void>;
  onDelete: () => Promise<void>;
}

const WIDTHS: [string, string][] = [
  ['0-3', '전체 폭'],
  ['0-1', '왼쪽 1/3'],
  ['1-1', '가운데 1/3'],
  ['2-1', '오른쪽 1/3'],
  ['0-2', '왼쪽 2/3'],
  ['1-2', '오른쪽 2/3'],
];

export default function DeviceDialog({ racks, rack, device, preset, readOnly, onClose, onSave, onDelete }: Props) {
  const isNew = !device;
  const init = device ?? { name: '', ip: '', note: '', top: 0, h: 3, col: 0, w: 3, ...preset };

  const [name, setName] = useState(init.name);
  const [ip, setIp] = useState(init.ip);
  const [note, setNote] = useState(init.note);
  const [rackId, setRackId] = useState(rack.id);
  const [u, setU] = useState(String(Math.floor(init.top / 3) + 1));
  const [sub, setSub] = useState(String(init.top % 3));
  const [h, setH] = useState(String(init.h));
  const [width, setWidth] = useState(`${init.col}-${init.w}`);
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sure, setSure] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!readOnly) nameRef.current?.focus();
  }, [readOnly]);

  const [wc, ww] = width.split('-').map(Number);
  const cand: Box = { top: (parseInt(u, 10) - 1) * 3 + parseInt(sub, 10), h: parseInt(h, 10), col: wc, w: ww };
  const valid = cand.h >= 1 && !isNaN(cand.top) && cand.top >= 0;

  let localErr = '';
  if (!valid) localErr = '위치와 높이를 숫자로 입력해 주세요.';
  else if (cand.top + cand.h > SLOTS) localErr = '랙 아래로 넘칩니다. 40U 아래 칸까지만 쓸 수 있습니다.';
  else {
    const target = racks.find((r) => r.id === rackId);
    const hit = target?.devices.find((o) => o.id !== device?.id && overlaps(cand, o));
    if (hit) localErr = `"${hit.name}"(${rangeText(hit.top, hit.h)})와 겹칩니다.`;
  }
  const help = valid
    ? `${rangeText(cand.top, cand.h)}, 높이 ${sizeText(cand.h)}${cand.h % 3 || cand.top % 3 ? ' (U 경계에 걸쳐 있음)' : ''}`
    : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || busy || localErr) return;
    if (!name.trim()) {
      setServerErr('장비명을 입력해 주세요.');
      nameRef.current?.focus();
      return;
    }
    setBusy(true);
    setServerErr('');
    try {
      await onSave(rackId, { name: name.trim(), ip: ip.trim(), note: note.trim(), ...cand });
    } catch (err) {
      setServerErr((err as Error).message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!sure) return setSure(true);
    setBusy(true);
    try {
      await onDelete();
    } catch (err) {
      setServerErr((err as Error).message);
      setBusy(false);
    }
  };

  const clearServerErr = () => setServerErr('');

  return (
    <Dialog onClose={onClose}>
      <form className="form" onSubmit={submit} onChange={clearServerErr}>
        <h2>{isNew ? '장비 반입' : device.name || '장비'}</h2>
        <fieldset disabled={readOnly} style={{ border: 0, padding: 0, margin: 0, display: 'contents' }}>
          <div className="grid2">
            <label className="f">
              <span className="fl">장비명</span>
              <input ref={nameRef} type="text" required placeholder="예: DELL R740 웹서버" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="f">
              <span className="fl">IP</span>
              <input type="text" inputMode="decimal" placeholder="예: 211.240.48.14" value={ip} onChange={(e) => setIp(e.target.value)} />
            </label>
          </div>
          <label className="f">
            <span className="fl">랙</span>
            <select value={rackId} onChange={(e) => setRackId(e.target.value)}>
              {racks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name + (r.tenant ? ' ' + r.tenant : '')}
                </option>
              ))}
            </select>
          </label>
          <div className="grid3">
            <label className="f">
              <span className="fl">시작 U</span>
              <input type="number" min={1} max={UNITS} step={1} value={u} onChange={(e) => setU(e.target.value)} />
            </label>
            <label className="f">
              <span className="fl">시작 칸</span>
              <select value={sub} onChange={(e) => setSub(e.target.value)}>
                <option value="0">위 칸</option>
                <option value="1">가운데 칸</option>
                <option value="2">아래 칸</option>
              </select>
            </label>
            <label className="f">
              <span className="fl">높이 (칸, 1U = 3칸)</span>
              <input type="number" min={1} max={SLOTS} step={1} value={h} onChange={(e) => setH(e.target.value)} />
            </label>
          </div>
          <label className="f">
            <span className="fl">가로 위치</span>
            <select value={width} onChange={(e) => setWidth(e.target.value)}>
              {WIDTHS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <p className="help">{help}</p>
          <label className="f">
            <span className="fl">메모</span>
            <input type="text" placeholder="예: 라벨과 실제 IP 다름" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </fieldset>
        <p className="err">{localErr || serverErr}</p>

        <div className="bar">
          {!isNew && !readOnly && (
            <button type="button" className="btn danger" onClick={remove} disabled={busy}>
              {sure ? '한 번 더 누르면 반출합니다' : '반출 (삭제)'}
            </button>
          )}
          <span className="sp" />
          <button type="button" className="btn ghost" onClick={onClose}>
            {readOnly ? '닫기' : '취소'}
          </button>
          {!readOnly && (
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? '저장 중…' : isNew ? '반입' : '저장'}
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
