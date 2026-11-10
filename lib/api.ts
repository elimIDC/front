import type { Box, Layout, LogEntry, Rack } from './rack';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error ?? '요청을 처리하지 못했습니다.');
  return body as T;
}

export type DeviceInput = Box & { name: string; ip: string; note: string };
export type RackPatch = Partial<Omit<Rack, 'id' | 'name' | 'devices'>>;

export const api = {
  layout: () => call<Layout>('/layout'),
  logs: () => call<LogEntry[]>('/logs'),
  updateRack: (id: string, patch: RackPatch) =>
    call<Layout>(`/racks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  createDevice: (rackId: string, input: DeviceInput) =>
    call<Layout>(`/racks/${encodeURIComponent(rackId)}/devices`, { method: 'POST', body: JSON.stringify(input) }),
  updateDevice: (id: string, input: DeviceInput & { rackId: string }) =>
    call<Layout>(`/devices/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteDevice: (id: string) => call<Layout>(`/devices/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
