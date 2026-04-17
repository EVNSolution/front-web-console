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
- Docker image는 `npm run dev`를 띄우지 않고, `npm run build` 결과물을 정적으로 서빙한다.
- 통합 확인용 `http://localhost:8080`은 gateway 뒤의 built frontend 기준으로 본다.

## Local Run / Verification

- 빠른 UI loop: `npm run dev`
- safer remote target 확인: `npm run dev:local-test`
- static bundle 검증: `npm run build`

## Subdomain Shell Contract

- main domain remains the system-admin surface
- company manager sessions are rejected from the main-domain shell
- system-admin sessions are rejected from the subdomain shell
- subdomain `/` opens the dashboard first
- subdomain login shows the company header
- subdomain accordion order is `대시보드 / 정산`
- settlement internal menu order is `홈 / 배차 데이터 / 배송원 관리 / 운영 현황 / 정산 처리 / 팀 관리`
- rule-shell behavior is structural only: no persisted editor, no save action, no submit action, and no write API

## Image Build / Deploy Contract

- GitHub Actions workflow 이름은 `Build front-web-console image`다.
- workflow는 immutable `front-web-console:<sha>` 이미지를 ECR로 publish 한다.
- `workflow_dispatch`에서는 optional `vite_api_base_url` input으로 baked API base URL을 줄 수 있다.
- shared ECS deploy, ALB, ACM, Route53 관리는 `../infra-ev-dashboard-platform/` 이 소유한다.

## Environment Files And Safety Notes

- `VITE_DEV_PROXY_TARGET`을 사용하면 `5174`의 `/api`를 remote gateway로 프록시할 수 있다.
- `.env.local`은 실데이터 remote target에 붙을 때만 사용한다.
- `.env.local-test`는 dev/staging 같은 더 안전한 remote target에 우선 사용한다.
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
- subdomain settlement menu order matches spec
- subdomain login shows company header

## Root Docs / Runbooks

- `../../docs/contracts/`
- `../../docs/boundaries/`
- `../../docs/decisions/specs/2026-04-06-single-web-console-cutover-design.md`
- `../../docs/runbooks/ev-dashboard-preprod-release-gate.md`
