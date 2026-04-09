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
