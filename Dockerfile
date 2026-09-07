# Stage 1: Base image
FROM node:24-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Install necessary system dependencies
RUN apk add --no-cache openssl openssl-dev

# Copy package.json, package-lock.json, and .npmrc (the latter carries
# legacy-peer-deps=true, required for the React 19 peer-dep set to install).
# Workspace member manifests must be present before npm install, or npm
# resolves the workspace-shaped lockfile against missing directories.
COPY package*.json .npmrc ./
COPY packages/ui/package.json packages/ui/
COPY services/notis/package.json services/notis/

# Install dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE 3000

# Stage 2: Production image
FROM base

# Accept build argument to toggle database commands
ARG USE_LOCAL_DB=true
# Inlined into the client bundle at `next build` (entrypoint) for the AGPL
# source link in Footer. Also copied to SOURCE_COMMIT so generateBuildId
# puts the SHA in `/_next/static/<sha>/` on every page, including `/`.
ARG NEXT_PUBLIC_BUILD_COMMIT_SHA
# The `us` realm's canonical domain (REALMS.us in src/lib/realm.ts), inlined
# into the client bundle at `next build`. Staging deployments pass their own
# host so canonical/hreflang, the sitemap, notification links and the country
# switcher point somewhere that resolves.
#
# The default is load-bearing: an unset ARG bakes an empty string, and
# `process.env.NEXT_PUBLIC_REALM_DOMAIN ?? 'glasshouse.town'` does not catch
# `''` — the realm's base URL would become `https://` and isKnownRealmHost
# would stop recognising any host of ours (magic links, SEO redirects).
ARG NEXT_PUBLIC_REALM_DOMAIN=glasshouse.town

# Set environment variables
ENV USE_LOCAL_DB=${USE_LOCAL_DB}
ENV APP_ENV=production
ENV NEXT_PUBLIC_BUILD_COMMIT_SHA=${NEXT_PUBLIC_BUILD_COMMIT_SHA}
ENV SOURCE_COMMIT=${NEXT_PUBLIC_BUILD_COMMIT_SHA}
ENV NEXT_PUBLIC_REALM_DOMAIN=${NEXT_PUBLIC_REALM_DOMAIN}

# Copy the rest of the application code
COPY . .

# Prepare start script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Start the application
ENTRYPOINT ["docker-entrypoint.sh"]