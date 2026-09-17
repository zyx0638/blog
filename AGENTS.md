# Blog 项目说明

## 技术栈

- **Next.js 14 App Router**（React 18 + TypeScript），无独立后端，API 在 `app/api/**/route.ts`
- **Tailwind CSS 3.4**（配置见 `tailwind.config.ts`，颜色映射到 `app/globals.css` 的 CSS 变量）
- **SQLite**：`better-sqlite3` + `drizzle-orm`，数据库文件 `data/blog.db`
- Markdown 渲染 `react-markdown`，认证 `jose`(JWT) + `bcryptjs`

## 目录结构

- `app/` — 页面与 API 路由
  - 前台：`page.tsx`（首页）、`posts/[slug]/`、`moments/`、`gallery/`、`about/`、`projects/`、`hobbies/`、`music/`（音乐播放器）
  - 管理端：`admin/login/`、`admin/(panel)/posts|moments|gallery|anime/`
  - API：`api/admin/login|logout|posts|moments|gallery|anime|upload/`、`api/music/playlist|song/`（音乐模块公开接口）
  - `uploads/[filename]/route.ts` — 照片墙上传图片的公开读取路由
- `components/` — `navbar.tsx`、`background.tsx`（前台背景图容器，按路径排除 /admin）、`admin/`（管理端组件）、`music/`（音乐播放器组件）
- `lib/` — `db.ts`、`auth.ts`、`posts.ts`、`moments.ts`、`gallery.ts`、`uploads.ts`、`site.ts`、`about.ts`、`anime.ts`（番剧 CRUD）、`bangumi.ts`（Bangumi API 封装：搜索/详情/封面下载，支持 `BANGUMI_PROXY` 代理）、`qqmusic.ts`（QQ 音乐接口封装：歌单/播放链接/歌词，支持 `MUSIC_PROXY` 代理）、`music.ts`（音乐模块纯函数：Song 类型/LRC 解析/渐变生成）
- `scripts/seed.mjs` — 种子数据脚本

## 图片存放约定（重要）

- **静态资源放 `public/`**，浏览器直接以 URL 根路径访问（如 `public/images/100665843_p0.png` → `/images/100665843_p0.png`）。前台背景图 `.site-bg` 类在 `app/globals.css` 中引用该 URL
- **上传类图片存 `data/uploads/`**（`UPLOAD_DIR` 环境变量可覆盖），经 `/uploads/[filename]` 提供；文件名必须匹配 `lib/uploads.ts` 的 `UPLOAD_NAME_PATTERN`（UUID 格式），手工放置的文件需按该格式命名
- 上传统一走 `/api/admin/upload`（通用接口，照片墙接口 `/api/admin/gallery/upload` 与其共用 `lib/uploads.ts` 的 `handleUploadRequest`）；只收 JPEG/PNG/WebP/GIF，上限 10MB
- 文章/碎碎念封面：posts/moments 表的 `cover` 列存图片路径（空串表示无封面）；PUT 换图/移除封面和 DELETE 时会用 `deleteUploadedFile` 清理旧文件

## 管理端

- 入口 `/admin`，账号 `admin`（密码见项目记忆）
- 会话认证：`lib/auth.ts` 的 `SESSION_COOKIE`，`admin/(panel)/layout.tsx` 是 `force-dynamic`，未登录重定向 `/admin/login`
- 背景图通过 `components/background.tsx` 用 `usePathname()` 判断 `/admin` 路径排除，管理端保持纯深色

## 常用命令

```bash
npm run dev      # 开发（http://localhost:3000）
npm run build    # 构建
npm start        # 生产运行
npm run db:push  # 同步 drizzle schema 到 SQLite（drizzle-kit push --force）
npm run db:seed  # 写入种子数据
```

## 部署要点（Docker + 阿里云）

- `Dockerfile` 多阶段构建，运行 `next start`，端口 3000；`docker-compose.yml` 只监听 `127.0.0.1:3000`，对外由 nginx 反代提供 HTTPS
- 环境变量：`ADMIN_PASSWORD`、`SESSION_SECRET`（部署前必须设置）；`BANGUMI_PROXY`（可选，大陆服务器直连 api.bgm.tv 会 DNS 污染，需设代理如 `http://127.0.0.1:7897`）；`MUSIC_PROXY`（可选，QQ 音乐接口代理，服务器直连可用）
- 音乐模块：歌单 ID 配置在 `lib/site.ts` 的 `musicPlaylistId`（改后需重新构建）；QQ 音乐接口无 CORS 且必须带 Referer，全部经服务端 `/api/music/*` 代理，播放链接/歌词带进程内缓存
- **QQ 音乐限流**：歌单接口（DissInfoServer）对匿名高频查询按 IP 限流（code 10004/10006，触发后数分钟到数小时恢复）。`lib/qqmusic.ts` 已做缓解：歌单缓存 30min、失败 5s 重试一次、自动回落 `uniform_get_Dissinfo` 备用接口。联调时不要频繁刷新/压测歌单接口，否则本机 IP 会被封一段时间
- `data/` 是挂载卷（`./data:/app/data`），SQLite 和上传图片持久化，重建容器不丢
- **`public/` 打包进镜像，改动静态资源（如背景图）后必须重新构建镜像才生效**
- 样式基调：深色低调风格（`--background: #0a0a0a`），统一使用 `.glass` 毛玻璃面板类；文章列表为双列网格（`md:grid-cols-2`，容器 `max-w-6xl`），卡片顶部通栏显示封面
