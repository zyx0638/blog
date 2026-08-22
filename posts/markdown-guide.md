---
title: "如何添加一篇新文章"
date: "2026-08-20"
excerpt: "只需要在 posts/ 目录下新建一个 markdown 文件，无需改动任何代码。"
---

添加新文章非常简单，三步搞定：

1. 在 `posts/` 目录下新建一个 `.md` 文件，比如 `my-first-post.md`
2. 在文件顶部填写 frontmatter：

```yaml
---
title: "文章标题"
date: "2026-08-21"
excerpt: "一句话摘要，显示在首页列表中。"
---
```

3. 用 Markdown 写正文

保存后刷新页面，首页列表和文章详情页都会自动更新。

文件名（去掉 `.md`）就是文章链接里的 slug，例如 `my-first-post.md` 对应 `/posts/my-first-post`。
