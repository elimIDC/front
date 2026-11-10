'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import RackColumn from './RackColumn';
import DeviceDialog from './DeviceDialog';
import RackDialog from './RackDialog';
import LogDialog from './LogDialog';
import { ApiError, api } from '@/lib/api';
import { matches, type Box, type Device, type Layout, type Rack } from '@/lib/rack';

type Open =
  | { kind: 'device'; rackId: string; device: Device | null; preset?: Box }
  | { kind: 'rack'; rackId: string }
  | { kind: 'log' }
  | null;

const LEGEND: [string, string][] = [
  ['', 'U 경계에 맞춰 들어간 장비'],
  ['o', 'U 경계에 걸쳐 들어간 장비'],
  ['h', '전체 임대, 내부 미기재'],
];

export default function RackBoard() {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [search, setSearch] = useState('');
  const query = search.trim();
  const [open, setOpen] = useState<Open>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const load = useCallback(() => {
    api.layout().then(
      (l) => {
        setLayout(l);
        setLoadErr('');
      },
      (e: Error) => setLoadErr(e.message),
    );
  }, []);

  // 처음 불러오고, 탭으로 돌아오면 다른 사람이 바꾼 내용을 다시 불러온다
  useEffect(() => {
    load();
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [load]);

  // '/' 키로 검색창 포커스
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // 검색 결과 첫 장비로 스크롤
  useEffect(() => {
    if (!query) return;
    document.querySelector('.dev.hit')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [query]);

  /** 수정 요청 공통 처리. 실패 시 dialog가 메시지를 보여주도록 예외를 다시 던진다 */
  const mutate = useCallback(
    async (fn: () => Promise<Layout>) => {
      try {
        const next = await fn();
        setLayout(next);
        setOpen(null);
        showToast('저장했습니다');
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setReadOnly(true);
          setOpen(null);
          showToast('보기 전용입니다. 변경 내용은 저장되지 않았습니다.');
          return;
        }
        if (e instanceof ApiError && e.status === 404) load();
        throw e;
      }
    },
    [load, showToast],
  );

  if (!layout) {
    return (
      <p className={`state${loadErr ? ' err' : ''}`}>
        {loadErr || '불러오는 중…'}{' '}
        {loadErr && (
          <button type="button" className="btn" onClick={load}>
            다시 시도
          </button>
        )}
      </p>
    );
  }

  const hitCount = query ? layout.racks.reduce((n, r) => n + r.devices.filter((d) => matches(d, query)).length, 0) : 0;
  const rackOf = (id: string) => layout.racks.find((r) => r.id === id);
  const openRack = open && open.kind !== 'log' ? rackOf(open.rackId) : undefined;

  return (
    <>
      <header className="top">
        <div className="title">
          <h1>{layout.title}</h1>
          <p className="sub">최종 수정 {layout.updated}</p>
        </div>
        <div className="tools">
          <input
            ref={searchRef}
            className="search"
            type="search"
            placeholder="장비명, IP 검색"
            aria-label="장비 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="count">{query ? (hitCount ? `${hitCount}대` : '없음') : ''}</span>
          <button type="button" className="btn ghost" onClick={() => setOpen({ kind: 'log' })}>
            변경 이력
          </button>
        </div>
      </header>
      {readOnly && <p className="ro">보기 전용입니다. 이 랙 배치도를 수정할 권한이 없습니다.</p>}

      <div className="legend">
        {LEGEND.map(([c, t]) => (
          <span key={t}>
            <i className={c || undefined} />
            {t}
          </span>
        ))}
        <span>
          <b>!</b>메모 있음 (마우스를 올리면 보임)
        </span>
      </div>

      <main className="floor">
        {layout.racks.map((r) => (
          <RackColumn
            key={r.id}
            rack={r}
            query={query}
            readOnly={readOnly}
            onRack={(rack) => setOpen({ kind: 'rack', rackId: rack.id })}
            onDevice={(rack, device, preset) => setOpen({ kind: 'device', rackId: rack.id, device, preset })}
          />
        ))}
      </main>
      <p className="hint">
        {readOnly
          ? ''
          : '빈 칸을 누르면 그 위치에 장비를 추가하고, 장비를 누르면 수정하거나 반출할 수 있습니다. 랙 이름을 누르면 랙 정보를 고칩니다.'}
      </p>

      {open?.kind === 'device' && openRack && (
        <DeviceDialog
          key={open.device?.id ?? `new-${open.rackId}-${open.preset?.top}`}
          racks={layout.racks}
          rack={openRack}
          device={open.device}
          preset={open.preset}
          readOnly={readOnly}
          onClose={() => setOpen(null)}
          onSave={(rackId, input) =>
            mutate(() =>
              open.device
                ? api.updateDevice(open.device.id, { ...input, rackId })
                : api.createDevice(rackId, input),
            )
          }
          onDelete={() => mutate(() => api.deleteDevice(open.device!.id))}
        />
      )}
      {open?.kind === 'rack' && openRack && (
        <RackDialog
          key={openRack.id}
          rack={openRack}
          readOnly={readOnly}
          onClose={() => setOpen(null)}
          onSave={(patch) => mutate(() => api.updateRack(openRack.id, patch))}
        />
      )}
      {open?.kind === 'log' && <LogDialog onClose={() => setOpen(null)} />}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
