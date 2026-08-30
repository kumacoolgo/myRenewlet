# MyRenewlet

基于 Renewlet 思路重构的家庭固定支出、合同、保险与保修生命周期管理器。

> Upstream inspiration: https://github.com/zhiyingzzhou/renewlet
>
> This project is a substantial rewrite for household lifecycle management rather than a simple subscription tracker.

## 核心用途

- 📱 通讯：手机、家庭光纤、SIM、宽带等周期费用
- 🛡️ 保险：汽车保险、火灾保险、医疗/财产保险等有效期与续保提醒
- 🔧 保修：iPad、家电、电脑等保修到期提醒
- 💳 软件/服务：Microsoft 365、ChatGPT Plus、VPS、域名、Cloudflare 等

## 数据模型

每个项目统一为 Household Item：

- 名称 / 类型 / 家庭成员
- 金额 / 币种 / 计费周期（月、年、一次性、无费用）
- 开始日期 / 结束日期 / 下次续费日期
- 提前提醒天数
- 自动续费开关
- 服务商 / 网址 / 账号备注
- 合同号 / 保单号 / 序列号
- 标签 / 备注
- 状态：启用、暂停、已结束

## 首页 Dashboard

- 本月固定费用
- 年度折算费用
- 30 天内到期
- 保修即将到期
- 按类型筛选
- 即将到期列表

## 示例

| 类型 | 项目 | 费用/状态 |
|---|---|---|
| 📱 通讯 | 我的手机 | ¥4,980/月 |
| 📱 通讯 | 媳妇手机 | ¥3,980/月 |
| 📱 通讯 | 家庭光纤 | ¥5,200/月 |
| 🛡️ 保险 | 汽车保险 | 2027/03/31 到期 |
| 🛡️ 保险 | 火灾保险 | 2028/06/30 到期 |
| 🔧 保修 | iPad | 按结束日期计算剩余天数 |
| 🔧 保修 | 洗衣机 | 到期前显示警告 |
| 💳 软件/服务 | Microsoft 365 | 周期费用/续费管理 |
| 💳 软件/服务 | ChatGPT Plus | 周期费用/续费管理 |
| 💳 软件/服务 | VPS / 域名 / Cloudflare | 周期费用/续费管理 |

## 技术栈

- Cloudflare Workers
- Cloudflare D1
- TypeScript
- 原生响应式 Web UI（后续可继续替换为 React）
- PWA-ready 架构

## 本地开发

```bash
npm install
npm run db:local
npm run dev
```

## Cloudflare 部署

1. 创建 D1：

```bash
npx wrangler d1 create myrenewlet
```

2. 把输出的 database_id 填入 `wrangler.jsonc`。

3. 执行迁移：

```bash
npm run db:remote
```

4. 部署：

```bash
npm run deploy
```

`wrangler.jsonc` 已配置目标自定义域：

```text
renewlet.xiler.vip
```

首次部署前需确保该域名位于同一个 Cloudflare 账户中。

## GitHub Actions

仓库包含 `.github/workflows/deploy.yml`。设置以下 GitHub Secrets 后可自动部署：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `D1_DATABASE_ID`

push 到 `main` 时自动构建、执行远程 D1 migration 并部署 Worker。

## Roadmap

- 登录 / 家庭成员权限
- Telegram / Bark / 邮件提醒
- Cron 每日到期扫描
- R2 上传保险单、发票、保修卡
- 日历视图
- 月/年支出趋势图
- 数据导入导出
- PWA 安装

## License

MIT。保留 Renewlet 上游 MIT 版权声明，详见 `LICENSE`。
