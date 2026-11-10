'use client';

import { useRef, useState } from 'react';
import { RH, SLOTS, UNITS, colText, matches, rangeText, sizeText, type Box, type Device, type Rack } from '@/lib/rack';

interface Props {
  rack: Rack;
  query: string;
  readOnly: boolean;
  onRack: (rack: Rack) => void;
  onDevice: (rack: Rack, device: Device | null, preset?: Box) => void;
}

const SCALE = Array.from({ length: UNITS }, (_, i) => i + 1);

export default function RackColumn({ rack: r, query, readOnly, onRack, onDevice }: Props) {
  const body = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<number | null>(null);

  const slotAt = (clientY: number) => {
    const y = clientY - body.current!.getBoundingClientRect().top;
    return Math.max(0, Math.min(SLOTS - 1, Math.floor(y / RH)));
  };
  const isOnDevice = (t: EventTarget) => t instanceof Element && !!t.closest('.dev');

  return (
    <section className={`rack ${r.status}`}>
      <button type="button" className="rhead" title={r.note || undefined} onClick={() => onRack(r)}>
        <span className="rid">{r.name}</span>
        <span className="rten">{r.tenant ? r.tenant + (r.tenantNote ? ` (${r.tenantNote})` : '') : '미사용'}</span>
        <span className="tags">
          {r.door && <span className="tag">문 설치</span>}
          {r.noKey && <span className="tag warn">열쇠 없음</span>}
          {r.checked && <span className="tag plain">확인 {r.checked.slice(2).replace(/-/g, '.')}</span>}
        </span>
        {r.note && <span className="rnote">{r.note}</span>}
      </button>

      <div className="frame">
        <div className="scale">
          {SCALE.map((u) => (
            <span key={u}>{u}</span>
          ))}
        </div>
        <div
          ref={body}
          className="body"
          style={{ height: SLOTS * RH, cursor: readOnly ? 'default' : undefined }}
          onMouseMove={
            readOnly
              ? undefined
              : (e) => setGhost(isOnDevice(e.target) ? null : slotAt(e.clientY))
          }
          onMouseLeave={() => setGhost(null)}
          onClick={
            readOnly
              ? undefined
              : (e) => {
                  if (isOnDevice(e.target)) return;
                  const s = slotAt(e.clientY);
                  onDevice(r, null, { top: s, h: Math.min(3, SLOTS - s), col: 0, w: 3 });
                }
          }
        >
          {r.status === 'leased' && !r.devices.length && (
            <div className="zone">
              <span>전체 임대</span>
              <span>내부 장비 미기재</span>
            </div>
          )}
          {r.status === 'empty' && !r.devices.length && <div className="zone faint">미사용</div>}

          {r.devices.map((d) => {
            const hit = !!query && matches(d, query);
            const cls = [
              'dev',
              d.h % 3 !== 0 || d.top % 3 !== 0 ? 'offgrid' : '',
              d.w < 3 ? 'narrow' : '',
              d.h <= 3 ? 'short' : '',
              query ? (hit ? 'hit' : 'dim') : '',
            ]
              .filter(Boolean)
              .join(' ');
            const ct = colText(d.col, d.w);
            const title =
              d.name +
              (d.ip ? `\n${d.ip}` : '') +
              `\n${rangeText(d.top, d.h)} (${sizeText(d.h)})` +
              (ct ? `\n${ct}` : '') +
              (d.note ? `\n메모: ${d.note}` : '');
            return (
              <button
                key={d.id}
                type="button"
                className={cls}
                data-id={d.id}
                title={title}
                style={{ top: d.top * RH, height: d.h * RH, left: `${(d.col / 3) * 100}%`, width: `${(d.w / 3) * 100}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDevice(r, d);
                }}
              >
                <span className="dn">{d.name || '(이름 없음)'}</span>
                {d.ip && <span className="dip">{d.ip}</span>}
                {d.note && <span className="dmark">!</span>}
              </button>
            );
          })}

          {ghost !== null && (
            <div className="addghost" style={{ display: 'flex', top: ghost * RH, height: Math.min(3, SLOTS - ghost) * RH }}>
              <span>+ 추가</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
