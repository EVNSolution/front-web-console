# front-web-console

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

아키텍처 정본:
- `../../docs/contracts/`
- `../../docs/boundaries/`
- `../../docs/decisions/specs/2026-04-06-single-web-console-cutover-design.md`

런타임 규칙:
- `npm run dev`는 host 개발용 `http://localhost:5174`를 소유한다.
- Docker image는 `npm run dev`를 띄우지 않고, `npm run build` 결과물을 정적으로 서빙한다.
- 통합 확인용 `http://localhost:8080`은 gateway 뒤의 built frontend 기준으로 본다.

원격 API 개발 모드:
- `VITE_DEV_PROXY_TARGET`을 사용하면 `5174`의 `/api`를 remote gateway로 프록시할 수 있다.
- `.env.local`은 실데이터 remote target에 붙을 때만 사용한다.
- `.env.local-test`는 dev/staging 같은 더 안전한 remote target에 우선 사용한다.
- `npm run dev:local-test`는 `local-test` mode로 실행되어 `.env.local-test`를 읽는다.
- 현재 dev/local-test remote target 기본값은 `https://clever-hub-dev-public-alb-709320164.ap-northeast-2.elb.amazonaws.com` 이다.
- 현재 실데이터 remote target 기본값은 `https://ev-dashboard.com`이다.
- 기본 테스트/시연은 `.env.local-test` 기준으로 하고, `ev-dashboard.com`은 실데이터 확인과 배포 검증에서만 사용한다.
- `hub.evnlogistics.com`은 legacy bridge/historical reference일 뿐, current operator 기본 target이 아니다.
- 경고: 현재 로컬 프론트 테스트의 CRUD는 실제 DB에 영향을 줍니다. 변경을 원하면, PROXY TARGET을 변경하십시오.
