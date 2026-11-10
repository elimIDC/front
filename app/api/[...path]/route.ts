/**
 * 브라우저의 /api/* 요청을 back 서버로 넘기는 프록시.
 * BACKEND_URL, BACKEND_API_TOKEN은 서버에서만 읽으므로 브라우저에 노출되지 않는다.
 */
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
const TOKEN = process.env.BACKEND_API_TOKEN ?? '';

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = `${BACKEND_URL}/api/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const ct = req.headers.get('content-type');
  if (ct) headers['Content-Type'] = ct;
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: 'no-store',
    });
    return new Response(res.body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: '백엔드 서버에 연결하지 못했습니다.' }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
