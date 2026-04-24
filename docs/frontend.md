# Frontend 项目结构说明

## 概览

前端位于 `frontend/`，是一个基于 Vite + React + TypeScript 的单页应用（SPA）。当前前端主要包含认证、主页、房间大厅、房间页、个人信息页以及 WebSocket 实时同步能力。

当前主要页面能力包括：

- 认证流程：账号密码登录、游客账号创建
- 主页：作为登录后的默认入口，当前暂时留空，后续用于承载新的业务模块
- 房间大厅：创建房间、输入房间号加入房间、查看在线房间列表
- 房间页：加入/离开房间、查看房间在线成员、开始/结束游戏
- 个人信息页：查看账号信息、修改昵称、设置或修改密码
- WebSocket 实时能力：房间成员加入/离开、游戏开始/结束状态同步

技术栈包括：

- Vite：开发服务器与构建工具
- React 19：页面渲染
- TypeScript：类型系统
- React Router DOM 7：路由与页面守卫
- 原生 `fetch`：HTTP 请求
- 原生 WebSocket：实时连接
- 全局 CSS：样式系统

整体结构仍然比较直接，以页面和轻量服务为主，没有引入额外的状态管理库或 UI 组件库。

## 目录结构

```text
frontend/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ vite.config.ts
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ styles.css
   ├─ types.ts
   ├─ api/
   │  ├─ base.ts
   │  ├─ authApi.ts
   │  └─ roomApi.ts
   ├─ contexts/
   │  └─ AuthContext.tsx
   ├─ pages/
   │  ├─ AutoRegisterPage.tsx
   │  ├─ HomePage.tsx
   │  ├─ LobbyPage.tsx
   │  ├─ LoginPage.tsx
   │  ├─ ProfilePage.tsx
   │  └─ RoomPage.tsx
   ├─ router/
   │  └─ index.tsx
   ├─ services/
   │  └─ wsService.ts
   └─ components/
      └─ .gitkeep
```

其中：

- `src/App.tsx`：注入路由和认证上下文
- `src/router/index.tsx`：集中定义登录态守卫与页面路径
- `src/contexts/AuthContext.tsx`：维护 token / username / nickname，并负责连接/断开 WebSocket
- `src/services/wsService.ts`：统一封装 WebSocket 心跳、重连和消息派发
- `src/api/roomApi.ts`：房间相关 HTTP API
- `src/pages/HomePage.tsx`：登录后默认首页，当前保留为空白占位页
- `src/pages/LobbyPage.tsx`：房间大厅页面
- `src/pages/RoomPage.tsx`：房间实时页

## 启动入口

### 1. `frontend/index.html`

浏览器入口文件，提供 `#root` 挂载点并加载 `src/main.tsx`。

### 2. `frontend/src/main.tsx`

React 启动入口，负责：

- 导入全局样式 `styles.css`
- 挂载 `<App />`
- 使用 `React.StrictMode`

### 3. `frontend/src/App.tsx`

应用顶层组合入口，负责：

- 提供 `BrowserRouter`
- 提供 `AuthProvider`
- 渲染 `AppRoutes`

## 构建与开发脚本

来自 `frontend/package.json`：

- `npm run dev`：启动 Vite 开发服务器
- `npm run build`：先运行 `tsc -b` 再执行 `vite build`
- `npm run preview`：预览构建产物

### `vite.config.ts`

当前配置：

- 使用 `@vitejs/plugin-react`
- dev server 端口固定为 `5173`
- `build.outDir = ../backend/dist`
- `build.emptyOutDir = true`

这意味着：

- 开发环境使用 `5173` 端口运行前端
- 构建产物直接输出到 `backend/dist`
- 后端可以直接托管前端静态资源

## 路由结构

路由定义位于 `frontend/src/router/index.tsx`。

当前仍由两类守卫组成：

- `GuestRoute`：仅未登录用户可访问
- `ProtectedRoute`：仅已登录用户可访问

### GuestRoute 下的页面

- `/login` → 登录页
- `/auto-register` → 游客账号创建页

如果已有 token，会自动跳转到 `/`。

### ProtectedRoute 下的页面

- `/` → 首页
- `/lobby` → 房间大厅
- `/room/:room_id` → 房间页
- `/profile` → 个人信息页

如果没有 token，会自动跳转到 `/login`。

## 模块分层说明

## 1. pages：页面层

位于 `frontend/src/pages/`。

职责：

- 承担主要 UI 渲染
- 管理页面内部状态
- 调用 API 层发起请求
- 处理跳转、错误提示和用户交互

### `LoginPage.tsx`

负责用户名 + 密码登录。

主要行为：

- 收集用户名和密码
- 调用 `authApi.login`
- 登录成功后写入认证上下文
- 跳转到首页 `/`
- 提供游客模式入口

### `AutoRegisterPage.tsx`

负责游客账号创建。

当前行为：

- 输入可选昵称
- 提交后调用 `authApi.autoRegister`
- 后端返回 token、username、nickname
- 前端写入认证上下文后跳转到首页
- 底部提供返回登录页入口

### `HomePage.tsx`

这是当前登录后的默认首页。

当前能力：

- 显示当前用户昵称
- 提供进入个人信息页按钮
- 提供进入房间大厅按钮
- 提供退出登录按钮
- 页面主体区域暂时留空，作为后续业务功能占位

此外：

- 如果当前账号是游客账号，退出前会先请求 `/auth/me`，并弹出不可找回提示

### `LobbyPage.tsx`

负责房间大厅。

当前能力：

- 创建房间
- 输入房间号直接进入房间
- 拉取在线房间列表
- 手动刷新房间列表
- 每 20 秒自动刷新一次房间列表

房间列表项会展示：

- 房间名
- 房间号
- 创建者昵称
- 在线人数
- 房间状态（准备中 / 游戏中）
- 创建时间

### `RoomPage.tsx`

负责房间详情和房间内实时体验。

当前能力：

- 根据路由参数 `room_id` 进入房间
- 进入页面时先调用 `joinRoom`，再调用 `getRoom`
- 展示房间名、房间号、房间状态
- 展示在线用户列表
- 支持离开房间
- 支持开始游戏
- 支持结束游戏

当前房间页与 WS 的交互行为：

- 注册 `wsService.setMessageHandler`
- 接收 `user_joined` 时补充用户
- 接收 `user_left` 时移除用户
- 接收 `game_started` 时把房间状态切为 `playing`
- 接收 `game_ended` 时把房间状态切回 `preparing`

开始游戏按钮当前限制：

- 房间人数少于 2 人时禁用
- 房间人数大于 5 人时禁用

### `ProfilePage.tsx`

负责个人信息展示与修改。

当前能力：

- 调用 `/auth/me` 拉取当前用户资料
- 展示用户名、昵称、账号类型、创建时间、最近登录时间
- 支持修改昵称
- 支持设置或修改密码
- 前端先校验两次新密码是否一致
- 更新成功后同步刷新 `AuthContext`

当前密码更新规则在 UI 上的体现：

- 游客账号首次设置密码时，旧密码输入框只读
- 普通用户修改密码时，需要填写旧密码

## 2. contexts：认证上下文层

位于 `frontend/src/contexts/AuthContext.tsx`。

当前维护的共享状态包括：

- `token`
- `username`
- `nickname`

提供的方法包括：

- `login(token, username, nickname)`
- `updateProfile(username, nickname)`
- `logout()`

除了本地登录态管理外，它还承担 WebSocket 生命周期管理：

- 初始化时调用 `wsService.init()` 启动心跳和重连机制
- 如果已有 token，会在页面加载时直接建立 WS 连接
- 登录成功时会调用 `wsService.connect(newToken)`
- 退出登录时会调用 `wsService.disconnect()`

本地持久化使用的键包括：

- `auth_token`
- `auth_username`
- `auth_nickname`

## 3. router：路由层

位于 `frontend/src/router/index.tsx`。

职责：

- 管理页面路径
- 基于 `AuthContext.token` 判断是否放行当前页面
- 在访客页和受保护页之间自动跳转

## 4. api：HTTP 接口访问层

位于 `frontend/src/api/`。

职责：

- 封装前后端 HTTP 通信
- 统一处理 Bearer Token
- 统一处理错误响应
- 按开发/生产环境切换 API 根路径

### `base.ts`

这是整个 API 层的基础封装。

主要行为：

- 从 `localStorage` 读取 `auth_token`
- 自动附加 `Authorization: Bearer ...`
- 默认使用 `Content-Type: application/json`
- 统一返回 `{ data, error }`
- 后端响应非 2xx 时优先读取 `detail` 字段作为错误信息

### `authApi.ts`

负责认证与资料接口。

当前能力包括：

- `login()`
- `register()`
- `autoRegister()`
- `getMe()`
- `pingAuth()`
- `updateProfile()`

说明：

- 实际页面当前未使用 `register()`
- 登录和游客账号创建成功后会调用 `setToken()`
- 开发环境走 `http://127.0.0.1:52000/auth`
- 生产环境走同源 `/auth`

### `roomApi.ts`

负责房间相关接口。

当前能力包括：

- `createRoom()`
- `listRooms()`
- `getRoom()`
- `joinRoom()`
- `leaveRoom()`
- `startGame()`
- `endGame()`

开发环境走 `http://127.0.0.1:52000/room`，生产环境走同源 `/room`。

## 5. services：客户端服务层

位于 `frontend/src/services/`。

### `wsService.ts`

这是当前实时能力的核心封装。

主要职责：

- 建立 WebSocket 连接到 `/ws/connect`
- 发送心跳包
- 自动重连
- 在重连前通过 `/auth/ping` 校验 token 是否仍有效
- 暴露消息回调和连接生命周期回调

当前实现细节：

- 开发环境 WS 地址为 `ws://127.0.0.1:52000/ws/connect`
- 生产环境为同源 `/ws/connect`
- 心跳间隔 `20s`
- 重连检查间隔 `3s`
- 收到服务端 `ping` 时自动回复 `pong`
- 当前房间页通过 `setMessageHandler()` 使用它

## 6. styles：样式层

位于 `frontend/src/styles.css`。

当前仍然使用单个全局 CSS 文件，未使用：

- CSS Modules
- Tailwind
- 第三方 UI 组件库

样式已经覆盖的核心场景包括：

- 认证页
- 首页占位区
- 房间大厅卡片列表
- 房间在线用户卡片
- 个人信息页
- 只读输入框与锁图标
- 成功/失败提示

整体视觉风格是深色、卡片式、轻玻璃拟态。

## 模块关系与数据流

前端整体运行链路如下：

1. 浏览器加载 `index.html`
2. `main.tsx` 挂载 React 应用
3. `App.tsx` 注入路由和认证上下文
4. `AuthContext` 初始化本地登录态并启动 WS 基础能力
5. `router/index.tsx` 根据 token 判断渲染访客页还是受保护页
6. 页面组件调用 `api/*` 发起 HTTP 请求
7. 房间页通过 `wsService` 接收实时事件
8. 页面更新本地状态并重新渲染

### 认证数据流

- 登录页调用 `/auth/login`
- 游客页调用 `/auth/auto-register`
- 成功后调用 `AuthContext.login`
- `AuthContext` 将 token、username、nickname 写入 `localStorage`
- 同时建立 WebSocket 连接
- 资料页修改昵称成功后调用 `updateProfile()` 同步上下文
- 退出时清空本地登录态并断开 WS

### 房间数据流

- 大厅页调用 `/room/list` 拉取在线房间
- 创建房间后跳转到 `/room/:room_id`
- 房间页进入时先 `joinRoom` 再 `getRoom`
- 后端通过 WS 推送 `user_joined`、`user_left`、`game_started`、`game_ended`
- 前端据此更新房间内本地状态

## 与后端的耦合点

当前前后端的主要耦合点包括：

- 开发环境前端默认请求 `127.0.0.1:52000`
- 生产环境默认同源请求 `/auth`、`/room`
- WebSocket 连接地址为 `/ws/connect`
- 前端构建产物输出到 `backend/dist`
- 前端使用 `BrowserRouter`，依赖后端提供 SPA fallback
- 房间实时交互依赖后端约定的消息类型：
  - `user_joined`
  - `user_left`
  - `game_started`
  - `game_ended`

## 运行方式

### 前端开发模式

```bash
cd frontend
npm install
npm run dev
```

然后确保后端运行在 `127.0.0.1:52000`。

### 联合构建模式

```bash
cd frontend
npm run build
```

构建产物会进入 `backend/dist`，随后可以由后端统一托管。
