# 当前开发分支：Ellery Westcott CRM 桌面版

本分支是用户指定品牌的桌面 UI 与两角色改版。交付状态见 `DESKTOP-RELEASE.zh-CN.md`；以下为源仓库原有资料归属说明。

# PROJECT-CATALOG｜Brantone Veylor CRM

**唯一项目：Brantone Veylor CRM｜客户股票跟踪管理系统**（见 `PROJECT_NOTE.zh-CN.md`）。

## 本项目资料归属
- 界面、交互及样式：`index.html`、`app.js`、`styles.css`、相关 `*-ui*.css`、`assets/`。
- 服务、API及数据库：`server.js`、`api/`、`migrations/`、`*-setup.sql`、`customer-reservations.js`。
- 业务逻辑与统计：`allocation-projects.js`、`dashboard-data.js`、`ui-features.js`。
- 测试及开发校验：`tests/`、`scripts/`、各类 `*-qa.md`、`PROJECT_NOTE.zh-CN.md`。
- 部署配置：`vercel.json`、`package.json`、`pnpm-lock.yaml`。

## 严格隔离
- 本仓库是CRM项目，不得当作 ELLERY WESTCOTT 的65人身份、五Skill、剧本或记忆的正式来源。
- ELLERY WESTCOTT 人物统一在 [Westcott-Intelligence](https://github.com/dalulu05168/Westcott-Intelligence/blob/main/skills/p004-chat-suite/characters/final-identity-65.json)。
- 旧罗马尼亚财经工作台在 [`-Skill`](https://github.com/dalulu05168/-Skill)，不将旧人物索引或模拟交易持仓混入CRM。
- 后续CRM资料按前端、后端、数据、测试、部署分类，迁移路径时同步更改引用、构建与CI后再合并；不破坏运行入口。

这份文件只做已有资源的明确归属，不改变CRM部署。
