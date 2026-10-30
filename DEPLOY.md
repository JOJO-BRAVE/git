# 公网部署

`5173` 与 `3001` 是开发容器内部端口，并不是用户可访问的网址。只有托管平台完成发布并返回 HTTPS 域名后，网站才算公网部署成功。

## Render（默认方案）

仓库根目录已经包含 `render.yaml`，部署前需将当前版本代码保存到自己的 GitHub 仓库，并在 Render 授权访问该仓库。当前聊天尚未连接 Render 账号，不能替用户完成账号授权。

1. 在 [Render 控制台](https://dashboard.render.com/) 登录自己的账号。
2. 选择 **New → Blueprint**，连接保存了此版本的 GitHub 仓库。
3. 使用仓库中的 `render.yaml` 创建 Web Service。它会安装依赖、构建前端并启动同源 API。
4. 等待发布完成，打开控制台实际返回的 `https://…onrender.com` 地址。不要把示例域名或本机端口当作已发布网址。

不使用 Blueprint 时，新建 **Web Service** 并填写：

| 设置 | 值 |
| --- | --- |
| Runtime | Node |
| Node version | 24 |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check | `/api/health` |
| Environment | `NODE_ENV=production` |

平台注入的 `PORT` 会自动生效，不需要公网暴露 Vite 开发服务。免费实例的休眠和资源限制以平台当前说明为准。

默认不配置共享模型密钥，页面和示例即能打开；真实分析时由用户在页面「模型设置」填写自己的 Key。若使用共享服务端 Key，公开运营前应先加入登录和额度控制。

## 自有服务器 / Docker

根目录附带多阶段 Dockerfile，运行镜像不含源码密钥或开发依赖。以下命令在部署服务器执行：

```bash
docker build -t zhiwu-product-strategy .
docker run -d --name zhiwu --restart unless-stopped \
  -p 127.0.0.1:3001:3001 zhiwu-product-strategy
```

用服务器已有的 HTTPS 反向代理将自己的域名转发至 `127.0.0.1:3001`，允许至少 48MB 请求体和超过 120 秒的上游响应时间。域名 DNS、HTTPS 证书与服务器入口需要部署账号权限。

当前验证范围：Node 生产构建、单端口页面/API 和浏览器功能。Dockerfile 已准备，但未将容器构建结果冒充为已经公网发布。

## 发布验收

拿到平台返回的真实域名后，必须验证：

- 首页 HTTP 200，前端 JS/CSS 正常加载；五模块示例可切换。
- `/api/health` 返回 `ok: true`，不要只看进程启动日志。
- 上传、导出、手机布局和真实模型分析按配置工作。
- 可用 `BASE_URL=https://你的真实域名 python tests/browser-smoke.py` 运行浏览器回归。该测试模拟模型调用，不验证真实 Key 或模型额度。
