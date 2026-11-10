# 엘림넷 가산 IDC 랙 배치도 — 웹 (Next.js)

기존 단일 HTML 랙 배치도를 Next.js(App Router, TypeScript)로 옮긴 화면입니다.
데이터는 `back` 레포의 API 서버에 저장됩니다.

- 랙 13개, 40U(1U = 3칸) 단위 배치도, 1/3·2/3 폭 장비 표시
- 장비명·IP·메모 검색 (`/` 키로 검색창 이동)
- 빈 칸 클릭 → 장비 반입, 장비 클릭 → 수정·랙 이동·반출, 랙 이름 클릭 → 랙 정보 수정
- 겹침·범위 검사(화면과 서버 양쪽), 변경 이력

## 구조

```
app/page.tsx                 화면 진입점
app/api/[...path]/route.ts   /api/* 요청을 back 서버로 넘기는 프록시 (토큰은 서버에서만 붙음)
components/                  RackBoard(전체), RackColumn(랙 1개), 다이얼로그들
lib/rack.ts                  타입, 좌표 계산 (back/src/rack.ts와 같은 규칙)
lib/api.ts                   API 호출
```

브라우저는 항상 같은 출처의 `/api/*`만 호출하므로 back 서버를 외부에 열 필요가 없고 CORS 설정도 필요 없습니다.

## 실행

먼저 `back` 서버를 띄운 뒤:

```bash
npm install
cp .env.example .env.local   # BACKEND_URL, BACKEND_API_TOKEN 설정
npm run dev                  # http://localhost:3000
```

운영:

```bash
npm run build
BACKEND_URL=http://127.0.0.1:4000 BACKEND_API_TOKEN=change-me npm start
```

Docker (`output: 'standalone'`):

```bash
docker build -t idc-rack-front .
docker run -d -p 3000:3000 -e BACKEND_URL=http://<back 주소>:4000 -e BACKEND_API_TOKEN=change-me idc-rack-front
```

## 환경 변수

| 이름 | 설명 |
|---|---|
| `BACKEND_URL` | back 서버 주소 (기본 `http://localhost:4000`) |
| `BACKEND_API_TOKEN` | back의 `API_TOKEN`과 같은 값. back에서 토큰을 안 쓰면 비워 둠 |

> 이 화면 자체에는 로그인이 없습니다. 사내망에서만 열거나, 앞단(nginx 등)에 접근 제한을 두세요.
