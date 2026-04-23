# Backend 项目结构说明

## 概览

后端位于 `backend/`，是一个基于 FastAPI 的本地服务，当前同时承担三类职责：

- 认证与用户资料：登录、游客账号、查看/更新个人信息、游客账号清理
- Test 资源管理：按当前登录用户隔离的列表、创建、更新、删除
- 前端静态资源托管：直接提供 `backend/dist/` 中的前端构建产物

访问后端端口 `52000` 时，既可以调用 API，也可以直接打开前端页面。

技术栈包括：

- FastAPI：HTTP 服务与路由
- SQLAlchemy：ORM 与数据库访问
- SQLite：本地数据库存储
- Pydantic：请求/响应模型
- JWT：登录态鉴权
- python-dotenv：环境变量加载

整体结构仍采用清晰分层：

- `controllers`：HTTP 路由层
- `services`：业务逻辑层
- `entities`：数据库实体层
- `schemas`：请求/响应模型层
- `db`：数据库初始化与会话管理
- `utils`：常量、依赖注入与通用工具

## 目录结构

```text
backend/
├─ app.py
├─ quarks.db
├─ dist/
├─ requirements.txt
└─ app/
   ├─ main.py
   ├─ controllers/
   │  ├─ auth_controller.py
   │  └─ test_controller.py
   ├─ services/
   │  ├─ user_service.py
   │  └─ test_service.py
   ├─ entities/
   │  ├─ user_entity.py
   │  └─ test_entity.py
   ├─ schemas/
   │  ├─ user_schema.py
   │  └─ test_schema.py
   ├─ db/
   │  └─ database.py
   └─ utils/
      ├─ constant.py
      ├─ dependencies.py
      └─ snowflake.py
```

其中：

- `backend/app.py`：本地开发启动入口
- `backend/app/main.py`：FastAPI 应用组装入口，同时负责静态文件托管与 SPA fallback
- `backend/dist/`：前端构建产物输出目录
- `backend/app/utils/snowflake.py`：字符串雪花 ID 生成器

## 启动入口

### 1. `backend/app.py`

本地开发启动入口，负责：

- 从 `app.utils.constant` 读取 `PORT`
- 以 `app.main:app` 启动 Uvicorn
- 监听 `127.0.0.1`
- 开启 `reload=True`

### 2. `backend/app/main.py`

这是 FastAPI 应用真正的组装入口，负责：

- 创建 `FastAPI()` 实例
- 配置 CORS（用于前端开发模式）
- 在应用启动时执行：
  - `Base.metadata.create_all(bind=engine)` 自动建表
  - 游客账号清理
- 注册认证与 Test 资源路由
- 挂载 `backend/dist/assets` 静态资源
- 提供 `/` 与 SPA fallback 到 `backend/dist/index.html`

当前 CORS 允许的前端开发来源：

- `http://127.0.0.1:5173`
- `http://localhost:5173`

这说明当前既支持：

1. 前后端分离开发模式（前端跑 5173）
2. 后端直接托管前端构建产物的单服务模式（访问 52000）

## 分层说明

## 1. controllers：路由与 HTTP 层

位于 `backend/app/controllers/`。

职责：

- 定义接口路径
- 声明请求/响应模型
- 注入数据库与鉴权依赖
- 调用 service 层完成业务逻辑
- 将业务失败转换为 HTTP 状态码

### `auth_controller.py`

负责 `/auth` 下的认证与用户相关接口：

- `POST /auth/login`
- `POST /auth/auto-register`
- `GET /auth/me`
- `GET /auth/clean-guest`
- `POST /auth/update`

当前行为：

- 登录使用用户名 + 密码
- 自动注册（游客账号）支持可选 `nickname`
- `/auth/me` 返回当前用户资料
- `/auth/update` 用于更新昵称和密码
- `/auth/clean-guest` 可手动触发过期游客账号清理
- 登录失败返回 `401`

当前后端已不再提供普通注册接口。

### `test_controller.py`

负责 `/test` 下的资源接口：

- `GET /test/health`
- `GET /test/list`
- `POST /test/create`
- `POST /test/update`
- `POST /test/delete`

当前行为：

- `health` 是公开接口
- 其余接口都依赖 `get_current_user`
- 所有 Test 资源按当前用户 `current_user.id` 隔离
- 更新或删除不属于当前用户或不存在的数据时返回 `404`

## 2. services：业务逻辑层

位于 `backend/app/services/`。

职责：

- 实现业务逻辑
- 访问数据库实体
- 生成 Token
- 尽量保持 controller 轻量

### `user_service.py`

负责用户相关核心逻辑：

- 登录验证
- 游客账号创建
- 当前用户资料更新
- JWT 生成
- 过期游客账号清理

当前实现细节：

- 密码采用 `sha256(password + salt)` 哈希
- 每个用户有独立 `salt`
- 游客账号用户名使用 6 位 `A-Za-z0-9` 随机字符串生成
- 游客账号会生成随机密码
- 游客账号：`is_auto_registered = True`
- JWT 的 `sub` 存储用户 ID 字符串
- Token 含过期时间 `exp`
- 用户有两个毫秒时间戳字段：
  - `created_at`
  - `last_login_at`
- 登录成功时会更新 `last_login_at`
- 启动或手动调用清理接口时会删除注册时间超过 24h 的游客账号

### `test_service.py`

负责 Test 资源的 CRUD：

- 查询当前用户的列表
- 为当前用户创建记录
- 更新当前用户自己的记录
- 删除当前用户自己的记录

当前实现细节：

- `test` 数据表带 `user_id`
- 所有查询条件都同时使用 `test.id` 和 `user_id`
- 因此即使知道别人的 `id`，也无法越权更新或删除
- `id` 依旧由 Snowflake 生成器生成字符串主键

## 3. entities：数据库实体层

位于 `backend/app/entities/`。

职责：

- 使用 SQLAlchemy 定义表结构
- 与数据库表映射

### `user_entity.py`

对应 `users` 表，核心字段包括：

- `id: str`
- `username`
- `nickname`
- `password_hash`
- `salt`
- `is_auto_registered`
- `created_at`
- `last_login_at`

说明：

- `id` 为字符串主键
- `username` 唯一且建有索引
- `nickname` 为必填
- `is_auto_registered` 用于标记游客账号
- 时间字段全部使用毫秒时间戳

### `test_entity.py`

对应 `test` 表，当前字段包括：

- `id: str`
- `name`
- `user_id: str`

说明：

- `user_id` 用于标记数据所属用户
- 列表和增删改查都会基于该字段做用户隔离

## 4. schemas：请求与响应模型

位于 `backend/app/schemas/`。

职责：

- 定义接口输入输出格式
- 作为前后端通信契约

### `user_schema.py`

主要模型包括：

- `LoginRequest`
- `AutoRegisterRequest`
- `UpdateCurrentUserRequest`
- `TokenResponse`
- `AutoRegisterResponse`
- `CurrentUserResponse`

说明：

- `AutoRegisterRequest` 支持可选 `nickname`
- 登录响应包含：
  - `access_token`
  - `username`
  - `nickname`
- 游客账号创建响应也包含：
  - `access_token`
  - `username`
  - `nickname`
- `CurrentUserResponse` 包含：
  - `id`
  - `username`
  - `nickname`
  - `is_auto_registered`
  - `created_at`
  - `last_login_at`

### `test_schema.py`

主要模型包括：

- `NameResponse`
- `CreateTestRequest`
- `UpdateTestRequest`
- `DeleteTestRequest`

说明：

- `id` 在接口层使用字符串
- `user_id` 不暴露给前端，由后端根据当前登录用户推导

## 5. db：数据库基础设施

位于 `backend/app/db/database.py`。

职责：

- 创建数据库引擎
- 创建 SQLAlchemy Session
- 暴露 Declarative Base

当前配置：

- SQLite：`sqlite:///./quarks.db`
- `check_same_thread=False`
- 暴露 `engine`、`SessionLocal`、`Base`

由于数据库 URL 是相对路径，通常仍建议在 `backend/` 目录下运行。

## 6. utils：常量与依赖注入

位于 `backend/app/utils/`。

### `constant.py`

职责：

- 加载 `.env`
- 暴露配置常量

关键常量：

- `PORT`
- `JWT_SECRET`
- `JWT_ALGORITHM = "HS256"`
- `JWT_EXPIRE_HOURS = 24`

### `dependencies.py`

职责：

- 提供数据库会话依赖 `get_db()`
- 提供当前登录用户依赖 `get_current_user()`

鉴权流程：

- 通过 `HTTPBearer` 读取 Bearer Token
- 使用 JWT secret 和算法解码 token
- 从 `sub` 读取用户 ID 字符串
- 去数据库查找当前用户
- token 无效、过期或查不到用户时统一返回 `401`

### `snowflake.py`

职责：

- 生成字符串雪花 ID

特点：

- 线程安全
- 基于时间戳、机器位和序列位组合
- 项目中通过共享单例 `snowflake` 使用
- 当前 `users` 和 `test` 表都依赖它生成字符串主键

## 核心运行流程

后端当前主要运行链路如下：

1. 执行 `python app.py`
2. `app.py` 启动 uvicorn，加载 `app.main:app`
3. `main.py` 创建 FastAPI 应用
4. 启动时自动建表并清理过期游客账号
5. 注册 API 路由与前端静态资源托管
6. 请求进入 controller 层
7. controller 根据需要注入 `db` 和 `current_user`
8. controller 调用 service 完成业务逻辑
9. service 操作 entity 并通过 SQLAlchemy 持久化
10. schema 将结果序列化为接口响应

## 接口能力概览

### 认证与用户相关

- 用户登录
- 创建游客账号
- 查看当前用户资料
- 更新昵称与密码
- 手动清理过期游客账号
- 返回 JWT、用户名、昵称等信息

### Test 资源相关

- 健康检查
- 获取当前用户自己的列表
- 创建当前用户自己的记录
- 更新当前用户自己的记录
- 删除当前用户自己的记录

## 与前端的耦合点

当前后端与前端仍存在直接耦合：

- 后端在开发时允许 5173 来源跨域
- 后端约定静态产物位于 `backend/dist/`
- 前端生产构建会输出到该目录
- 前端 API 在开发环境走 `http://127.0.0.1:52000`，生产环境走同源路径

因此当前项目兼顾：

- 本地前后端分离开发
- 后端单服务托管前端的部署模式

## 运行方式

### 后端开发模式

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 前端开发模式

```bash
cd frontend
npm install
npm run dev
```

### 后端单服务模式

```bash
cd frontend
npm run build

cd ../backend
python app.py
```

此时前端构建产物会输出到 `backend/dist/`，直接访问：

- `http://127.0.0.1:52000`

即可打开网页。

## 当前架构特点与注意点

### 优点

- 结构简单，便于理解
- controller / service 分层清晰
- 认证、资料、游客账号、用户隔离 Test 数据已经形成完整闭环
- 支持开发模式与后端单服务托管模式

### 当前特点

- 没有 Alembic 等迁移系统
- 数据表仍在应用启动时自动创建
- service 直接操作 ORM，没有 repository 层
- 密码哈希仍使用自定义 SHA-256 + salt，而非 bcrypt/argon2
- 使用 SQLite 作为本地持久化存储

### 维护时值得关注的点

- 若继续演进数据库结构，开发阶段通常需要手动重建旧库
- 如果未来上线生产，密码哈希方案建议替换为更成熟方案
- 如果后续需要更复杂的前端部署，可进一步精简或移除开发用 CORS
- `/auth/clean-guest` 目前是公开 GET 接口，如后续用于生产应重新评估权限控制

## 建议优先阅读的文件

如果要快速理解当前后端，建议按下面顺序阅读：

1. `backend/app.py`
2. `backend/app/main.py`
3. `backend/app/controllers/auth_controller.py`
4. `backend/app/controllers/test_controller.py`
5. `backend/app/services/user_service.py`
6. `backend/app/services/test_service.py`
7. `backend/app/utils/dependencies.py`
8. `backend/app/utils/snowflake.py`
9. `backend/app/db/database.py`
10. `backend/app/entities/*.py`
11. `backend/app/schemas/*.py`

这样可以先建立整体运行链路，再深入到用户、游客账号、用户隔离的数据模型和具体实现。