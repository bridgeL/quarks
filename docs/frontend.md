# Frontend 项目结构说明

## 概览

前端位于 `frontend/`，是一个基于 Vite + React + TypeScript 的单页应用（SPA）。当前主要实现三类页面能力：

- 认证流程：登录、注册、游客模式进入
- 个人信息页：查看用户名/昵称/账号类型/时间信息，并更新昵称与密码
- 登录后首页：当前用户自己的 Test 数据列表与增删改操作

整体风格依然轻量，以页面驱动为主，没有额外引入复杂组件库或状态管理框架。

技术栈包括：

- Vite：开发服务器与构建工具
- React：页面渲染
- TypeScript：类型系统
- React Router DOM：路由与页面守卫
- 原生 `fetch`：接口请求
- 全局 CSS：样式系统

## 目录结构

```text
frontend/
├─ index.html
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ vite.config.ts
└─ src/
   ├─ main.tsx
   ├─ vite-env.d.ts
   ├─ App.tsx
   ├─ styles.css
   ├─ types.ts
   ├─ api/
   │  ├─ base.ts
   │  ├─ authApi.ts
   │  └─ testApi.ts
   ├─ contexts/
   │  └─ AuthContext.tsx
   ├─ router/
   │  └─ index.tsx
   ├─ pages/
   │  ├─ LoginPage.tsx
   │  ├─ RegisterPage.tsx
   │  ├─ AutoRegisterPage.tsx
   │  ├─ HomePage.tsx
   │  └─ ProfilePage.tsx
   └─ components/
      └─ .gitkeep
```

其中：

- `vite-env.d.ts`：补充 `import.meta.env` 的 Vite 类型声明
- `ProfilePage.tsx`：当前新增的重要页面，承载资料展示与修改逻辑
- `components/` 仍然没有真正投入使用，页面逻辑主要集中在 `pages/`

## 启动入口

### 1. `frontend/index.html`

浏览器入口文件，负责：

- 提供 `#root` 挂载节点
- 开发环境下加载 `src/main.tsx`

### 2. `frontend/src/main.tsx`

React 启动入口，负责：

- 导入全局样式 `styles.css`
- 挂载 `<App />`

### 3. `frontend/src/App.tsx`

应用顶层组合入口，负责：

- 提供 `BrowserRouter`
- 提供 `AuthProvider`
- 渲染 `AppRoutes`

## 构建与开发脚本

来自 `package.json`：

- `npm run dev`：启动 Vite 开发服务器
- `npm run build`：先用 TypeScript 编译，再用 Vite 构建
- `npm run preview`：本地预览构建产物

### `vite.config.ts`

当前配置：

- 使用 React 插件
- dev server 端口固定为 `5173`
- `build.outDir = ../backend/dist`
- `build.emptyOutDir = true`

这意味着：

- 开发环境继续通过 5173 运行前端
- 生产/演示构建时，前端产物会直接输出到 `backend/dist/`
- 后端可以直接托管这些静态文件

## 路由结构

路由定义位于 `frontend/src/router/index.tsx`。

当前仍由两类守卫组成：

- `GuestRoute`：只允许未登录用户访问
- `ProtectedRoute`：只允许已登录用户访问

### GuestRoute 下的页面

- `/login` → 登录页
- `/register` → 注册页
- `/auto-register` → 游客模式页

如果已经有 token，访问这些页面会被重定向到 `/`。

### ProtectedRoute 下的页面

- `/` → 首页
- `/profile` → 个人信息页

如果没有 token，访问这些页面会被重定向到 `/login`。

## 模块分层说明

## 1. pages：页面层

位于 `frontend/src/pages/`。

职责：

- 承担主要 UI 渲染
- 管理页面内部状态
- 调用 API 层发起请求
- 处理跳转、提示和用户交互

### `LoginPage.tsx`

负责用户名 + 密码登录。

主要行为：

- 收集用户名和密码
- 调用 `authApi.login`
- 登录成功后写入认证上下文
- 跳转到首页 `/`
- 提供跳转到注册页和游客模式页的入口

### `RegisterPage.tsx`

负责普通用户注册。

当前行为：

- 用户输入的是：
  - 昵称
  - 密码
- 用户不能自己输入用户名
- 后端会自动生成用户名
- 注册成功后会弹窗提示系统分配的用户名
- 然后自动登录并跳转到首页 `/`

这意味着：
- 注册和游客账号现在使用同一套用户名生成逻辑
- 用户后续登录仍然需要使用系统生成的用户名，因此前端会显式提示一次

### `AutoRegisterPage.tsx`

负责进入游客模式。

当前行为：

- 页面不再自动触发接口
- 用户可以输入可选昵称
- 点击“创建并进入”后调用 `authApi.autoRegister`
- 后端创建游客账号并直接返回登录态
- 前端写入认证上下文后跳转到首页

### `HomePage.tsx`

这是登录后的主页面，也是当前最核心的业务页面。

主要能力：

- 拉取当前用户自己的 Test 列表
- 创建新 Test
- 修改当前用户自己的 Test
- 删除当前用户自己的 Test
- 手动刷新列表
- 显示当前登录用户昵称
- 提供进入个人信息页按钮
- 提供退出登录按钮

从前端结构上看，首页仍然是当前最主要的业务容器。

### `ProfilePage.tsx`

负责个人信息展示与修改。

当前能力：

- 拉取 `/auth/me` 获取当前用户资料
- 展示：
  - 用户名
  - 当前昵称
  - 账号类型（游客账号 / 普通用户）
  - 创建时间
  - 最近登录时间
- 所有时间戳都会在前端转换为本地时区文本显示
- 支持更新：
  - 昵称
  - 密码
- 普通用户修改密码时需要输入旧密码
- 游客账号首次设置密码时旧密码框会显示为锁定状态
- 提供“重复新密码”输入框，前端会先校验两次输入一致
- 更新结果提示框显示在“更新资料”区域内

此外：
- 用户名输入框是只读状态，并带一个低调的锁图标
- 用户名也会持续在该页面展示，方便用户后续登录使用

## 2. contexts：全局状态层

位于 `frontend/src/contexts/AuthContext.tsx`。

当前唯一的共享状态依旧是认证信息。

### `AuthContext`

维护的数据包括：

- `token`
- `username`
- `nickname`

提供的方法包括：

- `login(token, username, nickname)`
- `updateProfile(username, nickname)`
- `logout()`

实现方式：

- 初始化时从 `localStorage` 读取登录态
- 登录时写入 `localStorage`
- 资料更新后同步刷新 `username` / `nickname`
- 退出时清空本地登录态
- 页面与路由守卫通过 `useAuth()` 获取当前状态

## 3. router：路由层

位于 `frontend/src/router/index.tsx`。

职责：

- 管理页面路径
- 根据 token 判断是否放行当前页面
- 在登录/未登录页面之间做跳转

当前设计仍然很直接，完全围绕 `AuthContext.token` 展开。

## 4. api：接口访问层

位于 `frontend/src/api/`。

职责：

- 封装与后端通信的请求
- 统一请求头处理
- 统一错误结果结构
- 根据环境决定 API 根路径

### `base.ts`

这是整个 API 层的基础封装。

主要行为：

- 从 `localStorage` 读取 token
- 若有 token，则自动附加 `Authorization: Bearer ...`
- 默认使用 JSON 请求头
- 基于 `fetch` 发起请求
- 将结果包装成统一结构 `{ data, error }`

### `authApi.ts`

负责认证与资料接口调用。

当前能力包括：

- 登录
- 注册
- 游客账号创建
- 获取当前用户资料 `getMe()`
- 更新当前用户资料 `updateProfile()`

当前 API 根路径策略：

- 开发环境：`http://127.0.0.1:52000/auth`
- 生产环境：`/auth`

这意味着：
- 开发时仍然直接请求本地后端 52000
- 后端托管前端 build 后，浏览器走同源请求

### `testApi.ts`

负责 Test 资源接口调用。

当前能力包括：

- 获取列表
- 创建
- 更新
- 删除

当前 API 根路径策略：

- 开发环境：`http://127.0.0.1:52000/test`
- 生产环境：`/test`

这与后端静态托管方案保持一致。

## 5. types：类型定义层

位于 `frontend/src/types.ts`。

职责：

- 定义前端使用的数据类型
- 为页面与 API 层提供基础类型约束

当前最核心的数据结构仍然是 `TestItem`：

- `id: string`
- `name: string`

这与后端字符串主键保持一致。

## 6. styles：样式层

位于 `frontend/src/styles.css`。

当前样式仍然集中在一个全局 CSS 文件中：

- 没有 CSS Modules
- 没有 Tailwind
- 没有第三方 UI 组件库

当前样式除了基础页面样式外，还包含：

- 登录/注册/游客模式表单样式
- 首页列表与操作按钮样式
- 个人信息页的详情卡片样式
- 只读输入框与锁图标样式
- 输入框 autofill 样式覆盖
- `success` / `error` 提示样式

## 模块关系与数据流

前端整体运行链路如下：

1. 浏览器加载 `index.html`
2. `main.tsx` 挂载 React 应用
3. `App.tsx` 注入路由与认证上下文
4. `router/index.tsx` 根据 token 决定渲染访客页还是受保护页面
5. 页面组件调用 `api/*` 发起请求
6. `api/base.ts` 统一加 token 和处理响应
7. 后端返回数据后，页面更新本地状态并重新渲染

### 认证数据流

- 登录页发起用户名 + 密码登录
- 注册页发起昵称 + 密码注册，后端生成用户名
- 游客模式页发起游客账号创建，可选昵称
- 成功后都调用 `AuthContext.login`
- `AuthContext` 将 token、username、nickname 写入 `localStorage`
- 个人信息页修改昵称成功后会调用 `updateProfile()` 同步上下文

### Test 数据流

- 首页加载时调用 `testApi.listTests()`
- 创建、更新、删除后再次调用列表接口刷新 UI
- 所有请求自动携带 JWT Bearer Token
- 后端基于当前 token 对 Test 数据做用户隔离

## 与后端的耦合点

当前前后端的耦合主要体现在：

- 开发环境下前端默认请求 `127.0.0.1:52000`
- 生产环境下前端默认走同源 `/auth`、`/test`
- 前端 build 输出到 `backend/dist`
- 前端使用 `BrowserRouter`，依赖后端提供 SPA fallback
- 认证和资料展示依赖后端返回：
  - `username`
  - `nickname`
  - `is_auto_registered`
  - `created_at`
  - `last_login_at`

## 运行方式

### 前端开发模式

```bash
cd frontend
npm install
npm run dev
```

默认访问：

- `http://127.0.0.1:5173`

### 构建给后端托管

```bash
cd frontend
npm run build
```

构建结果会直接输出到：

- `backend/dist/`

随后只启动后端即可访问整站。

## 当前架构特点

### 优点

- 项目体量小，容易上手
- 认证、资料页、首页职责划分比较清晰
- 接口层已经兼容开发环境与后端单服务模式
- 用户资料展示和登录态同步逻辑比较完整

### 当前特点

- 页面逻辑仍比较集中，尤其首页与资料页状态较多
- 没有抽出组件复用层
- 没有引入 Redux、Zustand 等状态管理方案
- 主要依赖原生 `fetch`
- 注册成功提示用户名目前使用浏览器原生 `alert`

### 维护时值得关注的点

- 若页面继续增长，可以逐步抽出表单组件或资料展示组件
- 浏览器密码管理对“游客账号首次设密码”的识别仍可能不稳定
- 资料页交互较多，后续如继续扩展可考虑拆分区域或组件
- 当前样式集中在一个文件中，长期增长后可考虑按模块拆分

## 建议优先阅读的文件

如果要快速理解前端，建议按下面顺序阅读：

1. `frontend/src/App.tsx`
2. `frontend/src/router/index.tsx`
3. `frontend/src/contexts/AuthContext.tsx`
4. `frontend/src/api/base.ts`
5. `frontend/src/api/authApi.ts`
6. `frontend/src/api/testApi.ts`
7. `frontend/src/pages/LoginPage.tsx`
8. `frontend/src/pages/RegisterPage.tsx`
9. `frontend/src/pages/AutoRegisterPage.tsx`
10. `frontend/src/pages/HomePage.tsx`
11. `frontend/src/pages/ProfilePage.tsx`
12. `frontend/src/styles.css`

这样可以先理解应用骨架，再进入认证、资料与用户隔离的业务实现。