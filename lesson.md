Source: https://lessons.md

# front-web-console Lessons.md

## Build Here, Route Elsewhere

This repo owns the web app and its image build. It does not own the shared `ev-dashboard.com` ALB, ACM, Route53, or ECS deploy workflow. Keep the runtime entrypoint in the dedicated infra repo.

## Keep The Front Door Narrow

`ev-dashboard.com` should stay the web console host. API ingress, Swagger, and Django admin stay on the API side so the front app does not inherit backend control-surface paths.

## Tag Images By Commit

The deploy contract for this repo is `front-web-console:<sha>`. Avoid `latest` and avoid repo-local deploy logic that hides which image revision is actually running.

## Remote API Rehearsal Needs A Full Base URL

The default production contract is still same-host `/api`. For front-only ECS rehearsals, the image build must accept an explicit `VITE_API_BASE_URL`, and that value needs the full external prefix such as `https://.../api`. Passing only the host will break the bundle because the app concatenates endpoint paths directly onto the configured base URL.

## Remote API Rehearsal Also Needs CORS

Once the bundle is served from a new domain, browser policy matters. `next.ev-dashboard.com` worked against `https://hub.evnlogistics.com/api` because that API already returned `Access-Control-Allow-Origin: https://next.ev-dashboard.com` with credentials enabled. Do not treat a remote API base as valid for browser traffic until that header is verified from the real target.

## Blank Build-Time API Base Values Must Collapse Back To `/api`

The production login regression came from a subtle build contract mismatch. The image pipeline could leave `VITE_API_BASE_URL` present but blank, and the bundle treated that as a real value instead of falling back to same-host `/api`. The public symptom was immediate:

- login POST went to `/auth/identity-login/`
- the edge returned `405`
- anonymous shell smoke still looked fine

Keep the front default strict:

- missing `VITE_API_BASE_URL` -> `/api`
- blank `VITE_API_BASE_URL` -> `/api`
- explicit non-blank override -> keep it as-is

Lock that behavior with a small unit test before rebuilding the image.
