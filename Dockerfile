# 基于 Debian（glibc），在依赖阶段提供 better-sqlite3 所需的编译工具。
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 国内服务器可取消下一行注释，加速安装
# RUN npm config set registry https://registry.npmmirror.com

FROM base AS deps
# 原生依赖编译工具仅用于构建，不进入最终运行镜像。
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
# 使用镜像自带的 Node 头文件，避免 node-gyp 再从 nodejs.org 下载。
RUN npm_config_nodedir=/usr/local npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# seed.mjs 会读取这两个目录；即使仓库暂时没有 Markdown 文件，也要让 runner 阶段可以复制它们。
RUN mkdir -p posts moments
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
# 数据库文件目录（docker-compose 挂卷到这里）
ENV DB_PATH=/app/data/blog.db

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/public ./public
# seed 需要读取的 markdown 源文件与建表所需配置
COPY --from=build /app/db ./db
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/posts ./posts
COPY --from=build /app/moments ./moments

EXPOSE 3000
# 幂等入口：建表 → 导入 md/创建管理员（已存在则跳过）→ 启动
CMD ["sh", "-c", "npx drizzle-kit push --force && node scripts/seed.mjs && exec npm start"]
