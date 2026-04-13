Source: https://lessons.md

# front-web-console Lessons.md

## Build Here, Route Elsewhere

This repo owns the web app and its image build. It does not own the shared `ev-dashboard.com` ALB, ACM, Route53, or ECS deploy workflow. Keep the runtime entrypoint in the dedicated infra repo.

## Keep The Front Door Narrow

`ev-dashboard.com` should stay the web console host. API ingress, Swagger, and Django admin stay on the API side so the front app does not inherit backend control-surface paths.

## Tag Images By Commit

The deploy contract for this repo is `front-web-console:<sha>`. Avoid `latest` and avoid repo-local deploy logic that hides which image revision is actually running.
