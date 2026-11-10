/**
 * 랙 좌표 규칙 (back/src/rack.ts와 동일)
 * 40U, 1U = 3칸 → top 0~119, h = 칸 수 / 가로 3등분 → col 0~2, w 1~3
 */
export const RH = 7; // 화면에서 1칸(1/3U)의 높이(px)
export const UNITS = 40;
export const SLOTS = UNITS * 3;
const SUB = ['위', '가운데', '아래'];

export type RackStatus = 'used' | 'empty' | 'leased';

export interface Device {
  id: string;
  name: string;
  ip: string;
  top: number;
  h: number;
  col: number;
  w: number;
  note: string;
}

export interface Rack {
  id: string;
  name: string;
  tenant: string;
  tenantNote: string;
  status: RackStatus;
  door: boolean;
  noKey: boolean;
  checked: string;
  note: string;
  devices: Device[];
}

export interface Layout {
  title: string;
  updated: string;
  racks: Rack[];
}

export interface LogEntry {
  id: number;
  at: string;
  text: string;
}

export type Box = Pick<Device, 'top' | 'h' | 'col' | 'w'>;

export const posText = (top: number) => `U${Math.floor(top / 3) + 1} ${SUB[top % 3]}칸`;
export const rangeText = (top: number, h: number) =>
  h <= 1 ? posText(top) : `${posText(top)} ~ ${posText(top + h - 1)}`;
export const sizeText = (h: number) => {
  const u = Math.floor(h / 3);
  const r = h % 3;
  if (!u) return `${r}칸`;
  return `${u}U${r ? ` ${r}칸` : ''}`;
};
export const colText = (col: number, w: number) => {
  if (w === 3) return '';
  const n = ['왼쪽', '가운데', '오른쪽'];
  if (w === 1) return `${n[col]} 1/3 폭`;
  return `${col === 0 ? '왼쪽' : '오른쪽'} 2/3 폭`;
};
export const overlaps = (a: Box, b: Box) =>
  a.top < b.top + b.h && b.top < a.top + a.h && a.col < b.col + b.w && b.col < a.col + a.w;

export const matches = (d: Device, query: string) => {
  if (!query) return true;
  return `${d.name} ${d.ip} ${d.note || ''}`.toLowerCase().includes(query.toLowerCase());
};
