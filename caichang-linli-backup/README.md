# 菜场-邻里 (caichang-linli)

买菜小程序矩阵的备份仓库。四个端共用同一个 uniCloud-aliyun 服务空间。

## 目录结构

| 子目录 | 原项目 | 技术栈 | 说明 |
|---|---|---|---|
| `user-app/` | 买菜-用户端 | uni-app + WeChat 小程序 | C 端用户（买菜的顾客） |
| `merchant-app/` | 买菜-商家APP | uni-app + WeChat 小程序 | 商家手机端（核单/审单） |
| `rider-app/` | 买菜-骑手端 | uni-app + WeChat 小程序 | 骑手配送端（接单/送达） |
| `merchant-web/` | 买菜-商家web端 | Vue 3 + Vite + Element Plus | 商家 PC 后台（商品/订单/营销管理） |

## 共享服务

- **uniCloud-aliyun 服务空间**：`mp-ae9bd108-da40-4ae6-923b-c3007dedec12`
- **云对象**：`merchant-api`（部署在 `merchant-app/uniCloud-aliyun/cloudfunctions/merchant-api`）
- **四端调用同一个云对象**：`https://fc-mp-ae9bd108-...next.bspapp.com/merchant-api`

## 本仓库的备份范围

- ✅ 源代码（含未提交改动）
- ❌ `node_modules/`、`unpackage/`、`dist/`、`.git/`（构建产物，已排除）
- ❌ uniCloud 凭据（不在仓库里）

## 恢复使用

每个子目录都是独立可运行的 uni-app / Vue 项目，用 HBuilderX / VSCode 打开对应目录即可：

- uni-app 项目（`user-app` / `merchant-app` / `rider-app`）→ HBuilderX
- Vue Web 项目（`merchant-web`）→ VSCode，先 `npm install` 再 `npm run dev`

## 备份时间

2026-06-07  22:46
