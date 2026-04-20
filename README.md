# front-web-console

## Purpose / Boundary

이 repo는 현재 플랫폼의 단일 웹 콘솔 runtime을 소유한다.

현재 역할:
- 권한 기반 웹 shell과 공통 라우팅
- 관리자 CRUD 화면
- lower manager read/self-service 화면
- 단일 웹 API client와 page test

포함:
- React/Vite app
- single-web route와 API client
- page/component test
- host dev server와 containerized static runtime

포함하지 않음:
- gateway 설정
- backend 도메인 로직
- 모바일 앱 UI

주의:
- repo 경로 이름은 `front-web-console`이다.
- 사용자-facing current truth는 `통합 웹 콘솔`이다.
- 별도 `front-operator-console`는 active runtime이 아니라 legacy reference다.

## Runtime Contract / Local Role

- `npm run dev`는 host 개발용 `http://localhost:5174`를 소유한다.
- `npm run dev:local-test`는 더 안전한 원격 dev/staging target 확인용이다.
- `npm run dev:local-sandbox`는 `ev-dashboard.com` / `cheonha.ev-dashboard.com` host 문맥을 로컬에서 눌러보는 수동 테스트용이다.
- Docker image는 `npm run dev`를 띄우지 않고, `npm run build` 결과물을 정적으로 서빙한다.
- 통합 확인용 `http://localhost:8080`은 gateway 뒤의 built frontend 기준으로 본다.

## Local Run / Verification

- 빠른 UI loop: `npm run dev`
- safer remote target 확인: `npm run dev:local-test`
- host 기반 수동 검증과 `/__dev__/session` 확인: `npm run dev:local-sandbox`
- static bundle 검증: `npm run build`

## Subdomain Shell Contract

- main domain remains the system-admin surface
- company manager sessions are rejected from the main-domain shell
- system-admin sessions are rejected from the subdomain shell
- subdomain `/` opens the dashboard first
- subdomain login shows the company header
- subdomain launcher order is `대시보드 / 차량 / 정산`
- vehicle workspace is detached like settlement
- vehicle sidebar order is `홈 / 배송원 / 차량 / 차량 배정`
- company cockpit deep links still obey the shared navigation policy redirect rules
- main domain `/vehicles/home` redirects safely to `/vehicles`
- settlement internal menu order is `홈 / 배차 데이터 / 배송원 관리 / 운영 현황 / 정산 처리 / 팀 관리`
- rule-shell behavior is structural only: no persisted editor, no save action, no submit action, and no write API

## Local Sandbox Contract

`npm run dev:local-sandbox`는 아래 계약만 허용한다.

- host entries:
  - `127.0.0.1 ev-dashboard.com`
  - `127.0.0.1 cheonha.ev-dashboard.com`
  - 이 매핑이 없으면 브라우저는 public DNS로 해석하고, local-sandbox shell은 열리지 않는다.
- allowed presets:
  - `ev-dashboard.com` -> `system_admin`
  - `cheonha.ev-dashboard.com` -> `cheonha_manager`
- safety rule:
  - local-sandbox는 절대 real `/api`로 fall through 하지 않는다.
  - 이 모드의 `/api` 요청은 브라우저 내부 mock layer가 전부 처리한다.
- browser notes:
  - local-sandbox는 `http://...:5174` plain HTTP 기준이다.
  - 브라우저가 `ev-dashboard.com` 계열을 HSTS로 기억하고 있으면 HTTPS로 강제 승격되어 local-sandbox가 열리지 않을 수 있다.
  - 이런 경우 fresh browser profile을 쓰거나, 해당 도메인의 HSTS state를 지운다.
- storage notes:
  - Safari나 stricter site-data policy 환경에서는 `localStorage` 쓰기가 막힐 수 있다.
  - local-sandbox session injection은 이 경우 메모리 fallback으로 계속 진행된다.
  - 이 fallback은 새로고침 전까지의 local test continuity만 보장한다.
- reset expectations:
  - `세션 초기화`는 저장된 session payload를 지운다.
  - `세션 초기화`는 dev preset bookkeeping을 지운다.
  - `세션 초기화`는 mock API memory state를 지운다.
  - 초기화 후에는 로그인되지 않은 깨끗한 local-sandbox 상태로 돌아간다.

## Image Build / Deploy Contract

- GitHub Actions workflow 이름은 `Build front-web-console image`다.
- workflow는 immutable `front-web-console:<sha>` 이미지를 ECR로 publish 한다.
- `workflow_dispatch`에서는 optional `vite_api_base_url` input으로 baked API base URL을 줄 수 있다.
- shared ECS deploy, ALB, ACM, Route53 관리는 `../infra-ev-dashboard-platform/` 이 소유한다.

## Environment Files And Safety Notes

- `VITE_DEV_PROXY_TARGET`을 사용하면 `5174`의 `/api`를 remote gateway로 프록시할 수 있다.
- `.env.local`은 실데이터 remote target에 붙을 때만 사용한다.
- `.env.local-test`는 dev/staging 같은 더 안전한 remote target에 우선 사용한다.
- `.env.local-test`와 `npm run dev:local-test`는 remote proxy rehearsal용이고, `npm run dev:local-sandbox`와 같은 mock-only mode가 아니다.
- `npm run dev:local-test`는 `local-test` mode로 실행되어 `.env.local-test`를 읽는다.
- 현재 dev/local-test remote target 기본값은 `https://clever-hub-dev-public-alb-709320164.ap-northeast-2.elb.amazonaws.com` 이다.
- 현재 실데이터 remote target 기본값은 `https://ev-dashboard.com`이다.
- 기본 테스트/시연은 `.env.local-test` 기준으로 하고, `ev-dashboard.com`은 실데이터 확인과 배포 검증에서만 사용한다.
- `hub.evnlogistics.com`은 legacy bridge/historical reference일 뿐, current operator 기본 target이 아니다.
- 경고: 현재 로컬 프론트 테스트의 CRUD는 실제 DB에 영향을 줍니다. 변경을 원하면, PROXY TARGET을 변경하십시오.

## Key Tests Or Verification Commands

- unit/component: `npm run test`
- browser smoke: `npm run test:e2e`

## Manual Verification Matrix

Use this checklist for the subdomain shell regression pass:

- main domain still shows system-admin surface
- company manager session is rejected from main-domain shell
- system-admin session is rejected from subdomain shell
- subdomain `/` opens dashboard
- subdomain brand card shows `CLEVER / EV&Solution / 천하운수`
- subdomain top-level launcher opens to the right of the card
- subdomain brand card width matches the detached settlement and vehicle sidebar width
- subdomain global header shows `알림 / 계정` actions on every page
- restricted company-manager deep links under `/drivers`, `/vehicles`, `/vehicle-assignments` redirect to the first allowed cockpit route
- main domain `/vehicles/home` does not open vehicle detail as `vehicleRef='home'`
- vehicle sidebar marks only `홈` active on `/vehicles/home`
- subdomain settlement menu order matches spec
- `/settlement/dispatch` keeps `업로드 범위 | 업로드 파일` 2열 on wide viewports
- `/settlement/dispatch` switches only the upload scope into a horizontal launcher/expander on narrow viewports
- subdomain login shows company header
- `dev:local-test` still routes through the safer remote target and does not enable `/__dev__/session`
- `dev:local-sandbox` uses host-based presets and never calls real `/api`

## Root Docs / Runbooks

- `../../docs/contracts/`
- `../../docs/boundaries/`
- `../../docs/decisions/specs/2026-04-06-single-web-console-cutover-design.md`
- `../../docs/runbooks/ev-dashboard-preprod-release-gate.md`

## Root Development Whitelist

- 이 repo는 `clever-msa-platform` root `development/` whitelist에 포함된다.
- root visible set은 `front-web-console`, `edge-api-gateway`, `runtime-prod-release`, `runtime-prod-platform`, active `service-*` repo만 유지한다.
- local stack support repo, legacy infra repo, bridge lane repo는 root `development/` whitelist 바깥에서 관리한다.
- 이 README와 repo-local AGENTS는 운영 안내 문서이며 정본이 아니다. 경계, 계약, 런타임 truth는 root `docs/`를 따른다.
