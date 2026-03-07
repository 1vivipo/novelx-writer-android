# 部署指南 - 获得固定公网地址

## 为什么需要自己部署？

我是在临时开发环境中运行的，没有自己的服务器。要获得固定的公网地址，您需要将项目部署到云平台。

---

## 方案一：Vercel 部署（推荐，完全免费）

### 步骤1：准备 GitHub 账号
1. 访问 https://github.com 注册账号
2. 创建新仓库，上传项目代码

### 步骤2：部署到 Vercel
1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择您的仓库
5. 点击 "Deploy"

### 步骤3：获得固定地址
部署完成后，您会获得：
- `https://your-project.vercel.app`（固定地址）
- 可以绑定自定义域名

### 注意事项
Vercel 是无服务器平台，SQLite 数据库无法持久化。需要：
1. 使用 Vercel Postgres（免费）
2. 或使用 PlanetScale/Supabase（免费）

---

## 方案二：Railway 部署（有免费额度）

### 步骤
1. 访问 https://railway.app
2. 使用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择项目
5. 添加环境变量
6. 部署完成获得固定地址

Railway 支持持久化存储，SQLite 可以正常使用。

---

## 方案三：Fly.io 部署（免费额度）

```bash
# 1. 安装 flyctl
curl -L https://fly.io/install.sh | sh

# 2. 登录
fly auth signup

# 3. 部署
fly launch

# 4. 获得固定地址
# https://your-app.fly.dev
```

---

## 方案四：使用 Cloudflare Tunnel（需要域名）

如果您有自己的域名：

```bash
# 1. 登录 Cloudflare
cloudflared tunnel login

# 2. 创建隧道
cloudflared tunnel create my-novel-app

# 3. 配置路由
cloudflared tunnel route dns my-novel-app novel.yourdomain.com

# 4. 运行隧道
cloudflared tunnel run my-novel-app
```

这样您就有固定的 `novel.yourdomain.com` 地址。

---

## 推荐方案

| 方案 | 难度 | 费用 | 持久化 |
|------|------|------|--------|
| Vercel | ⭐ 简单 | 免费 | 需配置外部数据库 |
| Railway | ⭐⭐ 中等 | 免费额度 | ✅ 支持 |
| Fly.io | ⭐⭐ 中等 | 免费额度 | ✅ 支持 |
| Cloudflare Tunnel | ⭐⭐⭐ 需要域名 | 免费 | ✅ 支持 |

**最简单：Vercel + Supabase（数据库）**

---

## 需要我帮您准备什么？

如果您决定部署，我可以：
1. 帮您修改项目配置以适配部署平台
2. 帮您配置外部数据库
3. 提供详细的部署步骤
