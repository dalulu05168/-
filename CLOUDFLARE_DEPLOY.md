# Cloudflare 部署清单

## 1. D1 数据库与 Secret

```bash
npx wrangler login
npx wrangler d1 create wmsystem-db
```

将返回的 `database_id` 写入 `wrangler.toml` 的 D1 binding，并配置会话 Secret：

```bash
npx wrangler pages secret put SESSION_SECRET --project-name=wmsystem
npx wrangler pages secret put BOOTSTRAP_TOKEN --project-name=wmsystem
```

`SESSION_SECRET` 必须是随机长字符串，不能写入前端或提交到 Git。

## 2. 应用迁移

先检查远程迁移状态：

```bash
npx wrangler d1 migrations list wmsystem-db --remote
```

确认未重复执行后应用标准迁移：

```bash
npx wrangler d1 migrations apply wmsystem-db --remote
```

迁移会创建用户、仓库、商品、库存、单据、流水、审计、库位和库存一致性保护结构。已有数据库不要盲目重复执行含 `ALTER TABLE` 的迁移；先备份并核对表结构。

## 3. 本地验证

```bash
pnpm install
pnpm run build:pages
node --check worker.js
npx wrangler pages dev client/dist --d1=DB=wmsystem-db
```

新库首次登录前，使用 `POST /api/auth/bootstrap` 携带 `X-Bootstrap-Token` 创建管理员；成功后删除或轮换 `BOOTSTRAP_TOKEN`。登录后依次检查：工作台实时数据、创建入库单、提交出库单、审核库存变化、库存流水、月度报表和管理员删除权限。

## 4. 发布

```bash
npx wrangler pages project create wmsystem
pnpm run build:pages
npx wrangler pages deploy client/dist --project-name=wmsystem
```

随后在 Cloudflare Dashboard → Workers & Pages → `wmsystem` → Custom domains 中绑定 `sasakic.cc`。

## 5. 数据安全规则

- D1 是唯一业务数据源；不要用 localStorage 或前端常量填充库存、单据、报表。
- 已审核单据和库存流水不可删除；管理员删除仅适用于未审核/已驳回单据，并记录审计日志。
- 发布前必须完成迁移、确认 Secret、确认管理员登录和 D1 远程读写正常。
- 不要把 Cloudflare API Token、管理员密码或 `SESSION_SECRET` 写入源码、压缩包或聊天消息。
