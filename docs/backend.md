# Backend 项目结构说明

## 概览

后端位于 `backend/`，是一个基于 FastAPI 的本地服务。当前后端不再只是认证与 Test CRUD 接口集合，而是已经扩展为同时提供认证、Test 资源、房间系统、WebSocket 实时连接以及前端静态资源托管的统一服务。

当前主要职责包括：

- 认证与用户资料：登录、游客账号创建、当前用户资料查询、资料更新、token 校验、游客账号清理
- Test 资源管理：按当前登录用户隔离的列表、创建、更新、删除
- 房间系统：创建房间、列出房间、加入/离开房间、获取房间详情、开始/结束游戏
- WebSocket 实时通信：维护在线连接并向房间成员推送状态变化
- 前端静态资源托管：直接提供 `backend/dist/` 中的前端构建产物

访问后端端口 `52000` 时，既可以调用 API，也可以直接打开前端页面。

技术栈包括：

- FastAPI：HTTP 与 WebSocket 服务
- SQLAlchemy：ORM 与数据库访问
- SQLite：本地数据库存储
- Pydantic：请求/响应模型
- PyJWT：登录态鉴权
- python-dotenv：环境变量加载
- loguru：日志输出

整体结构仍采用清晰分层：

- `controllers`：HTTP / WebSocket 路由层
- `services`：业务逻辑与实时连接管理
- `entities`：数据库实体层与内存房间实体
- `schemas`：请求/响应模型层
- `db`：数据库初始化与会话管理
- `utils`：常量、依赖注入、ID 生成与日志初始化

## 目录结构

```text
backend/
├─ app.py
├─ quarks.db
├─ requirements.txt
├─ dist/
└─ app/
   ├─ main.py
   ├─ controllers/
   │  ├─ auth_controller.py
   │  ├─ room_controller.py
   │  ├─ static_controller.py
   │  ├─ test_controller.py
   │  └─ ws_controller.py
   ├─ db/
   │  └─ database.py
   ├─ entities/
   │  ├─ room_entity.py
   │  ├─ test_entity.py
   │  └─ user_entity.py
   ├─ schemas/
   │  ├─ room_schema.py
   │  ├─ test_schema.py
   │  └─ user_schema.py
   ├─ services/
   │  ├─ room_server.py
   │  ├─ test_service.py
   │  ├─ user_service.py
   │  └─ ws_service.py
   └─ utils/
      ├─ constant.py
      ├─ dependencies.py
      ├─ id_generator.py
      ├─ logging.py
      └─ snowflake.py
```

其中：

- `backend/app.py`：本地开发启动入口
- `backend/app/main.py`：FastAPI 应用装配入口
- `backend/app/controllers/static_controller.py`：静态资源与 SPA fallback
- `backend/app/services/room_server.py`：内存态房间核心逻辑
- `backend/app/services/ws_service.py`：WebSocket 连接管理器
- `backend/app/utils/id_generator.py`：短 ID 生成器，供房间号使用
- `backend/app/utils/snowflake.py`：字符串雪花 ID 生成器，供数据库主键使用

## 启动入口

### 1. `backend/app.py`

本地开发启动入口，负责：

- 初始化日志
- 从 `app.utils.constant` 读取 `PORT`
- 以 `app.main:app` 启动 Uvicorn
- 监听 `127.0.0.1`
- 开启 `reload=True`
- 将日志级别设置为 `warning`
- 关闭 access log

### 2. `backend/app/main.py`

这是 FastAPI 应用真正的装配入口，负责：

- 初始化日志
- 创建 `FastAPI(lifespan=...)`
- 在应用启动时执行自动建表
- 在应用启动时清理过期游客账号
- 配置 CORS
- 注册认证、Test、房间、WebSocket、静态资源相关路由
- 调用 `register_static(app)` 挂载 `dist/assets`

当前 CORS 允许的前端开发来源：

- `http://127.0.0.1:5173`
- `http://localhost:5173`

## 分层说明

## 1. controllers：路由与协议层

位于 `backend/app/controllers/`。

职责：

- 定义 HTTP / WebSocket 路径
- 声明请求与响应模型
- 注入数据库和鉴权依赖
- 调用 service 层处理业务
- 将失败情况转换为 HTTP 状态码或 WS 关闭行为

### `auth_controller.py`

负责 `/auth` 下的认证与用户资料接口：

- `POST /auth/login`
- `POST /auth/auto-register`
- `GET /auth/ping`
- `GET /auth/me`
- `GET /auth/clean-guest`
- `POST /auth/update`

当前行为：

- 登录使用用户名 + 密码
- 游客账号创建支持可选 `nickname`
- `/auth/ping` 用于校验当前 token 是否有效
- `/auth/me` 返回当前用户资料
- `/auth/update` 用于更新昵称与密码
- `/auth/clean-guest` 手动触发过期游客账号清理
- 登录失败返回 `401`
- 更新失败返回 `400`

当前后端没有提供普通注册接口。

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
- 所有 Test 数据都按当前用户 `id` 隔离
- 更新或删除不存在的数据时返回 `404`

### `room_controller.py`

负责 `/room` 下的房间接口：

- `POST /room/create`
- `GET /room/list`
- `GET /room/{room_id}`
- `POST /room/{room_id}/join`
- `POST /room/{room_id}/leave`
- `POST /room/{room_id}/start`
- `POST /room/{room_id}/end`

当前行为：

- 创建房间时生成 6 位房间号
- 房间名为空时会自动生成中文随机房间名
- 房间列表只返回当前有在线用户的房间
- 加入房间前会校验房间是否存在
- 游戏中房间禁止新用户加入
- 开始游戏要求人数在 2 到 5 之间
- 开始/结束游戏成功后会向房间广播 WS 事件

说明：

- 当前开始/结束游戏接口没有限制必须由创建者操作
- `leave` 实际是按当前用户所在房间离开，而不是强校验 path 参数对应房间

### `ws_controller.py`

负责 WebSocket 连接入口：

- `WS /ws/connect?token=...`

当前行为：

- 从 query string 读取 `token`
- 使用 JWT 解码并校验用户是否存在
- 校验失败会以 `4001` 关闭连接
- 连接成功后将用户注册到 `ws_manager`
- 服务端支持接收文本消息
- 当前仅处理 `ping` 并返回 `pong`
- 断开连接后会清理连接记录

### `static_controller.py`

负责前端静态资源托管和 SPA fallback。

当前行为：

- `GET /` 返回 `backend/dist/index.html`
- `register_static(app)` 会在 `assets` 目录存在时挂载 `/assets`
- `GET /{full_path:path}` 会把非 API/WS 路径回退到 `index.html`
- 以下前缀不会走 SPA fallback：
  - `auth/`
  - `test/`
  - `assets/`
  - `ws/`
  - `room/`

## 2. services：业务逻辑层

位于 `backend/app/services/`。

职责：

- 实现业务逻辑
- 管理数据库或内存状态
- 保持 controller 层轻量

### `user_service.py`

负责用户相关核心逻辑：

- 登录校验
- 游客账号创建
- 当前用户资料更新
- JWT 生成
- 过期游客账号清理

当前实现细节：

- 密码采用 `sha256(password + salt)` 哈希
- 每个用户有独立随机 `salt`
- 游客用户名使用 6 位 `A-Za-z0-9` 随机字符串
- 游客账号创建时会生成随机密码
- 游客账号初始 `is_auto_registered = True`
- 当游客账号首次设置密码时，会被转为普通账号，即 `is_auto_registered = False`
- JWT 的 `sub` 保存用户 ID
- Token 带 `exp` 过期时间
- 用户时间字段使用毫秒时间戳
- 启动时或手动调用清理接口时，会删除创建超过 24 小时的游客账号

### `test_service.py`

负责 Test 资源 CRUD：

- 查询当前用户 Test 列表
- 为当前用户创建 Test
- 更新当前用户自己的 Test
- 删除当前用户自己的 Test

当前实现细节：

- `test` 表带 `user_id`
- 查询、更新、删除都同时使用 `id` 和 `user_id`
- `id` 使用 Snowflake 生成字符串主键

### `room_server.py`

这是房间系统的核心服务。

当前状态管理方式：

- 房间数据保存在进程内存 `_rooms`
- 用户所在房间映射保存在 `_user_rooms`
- 服务重启后房间状态不会保留

主要能力：

- 创建房间
- 获取房间
- 列出房间
- 用户加入房间
- 用户离开房间
- 查询用户所在房间
- 查询房间用户列表
- 向房间成员广播消息
- 开始/结束游戏

当前实现细节：

- 仅返回 `users` 非空的房间给大厅列表
- 用户离开后若房间为空，会自动删除房间
- 房间状态只有两种：
  - `preparing`
  - `playing`
- 自动房间名由中文形容词 + 名词随机拼接生成
- 房间广播通过 `ws_manager.send_personal()` 逐个发送

### `ws_service.py`

负责 WebSocket 在线连接管理。

当前实现：

- 使用 `active_connections: dict[user_id, WebSocket]` 维护在线连接
- 每个用户仅保留一个当前连接引用
- 支持：
  - `connect()`
  - `disconnect()`
  - `get_ws()`
  - `send_personal()`
  - `broadcast()`
  - `broadcast_except()`

## 3. entities：实体层

位于 `backend/app/entities/`。

### `user_entity.py`

对应 `users` 表，字段包括：

- `id: str`
- `username`
- `nickname`
- `password_hash`
- `salt`
- `is_auto_registered`
- `created_at`
- `last_login_at`

说明：

- `username` 唯一且带索引
- 时间字段都使用毫秒时间戳

### `test_entity.py`

对应 `test` 表，字段包括：

- `id: str`
- `name`
- `user_id: str`

说明：

- `user_id` 用于标记数据所属用户
- 访问时通过该字段做用户隔离

### `room_entity.py`

这是房间的内存实体，不对应数据库表，而是一个 dataclass。

字段包括：

- `room_id`
- `name`
- `created_by`
- `created_at`
- `status`
- `users`

说明：

- `users` 是当前房间内在线用户 ID 列表
- `status` 默认是 `preparing`

## 4. schemas：请求与响应模型层

位于 `backend/app/schemas/`。

### `user_schema.py`

主要模型包括：

- `LoginRequest`
- `AutoRegisterRequest`
- `UpdateCurrentUserRequest`
- `TokenResponse`
- `AutoRegisterResponse`
- `CurrentUserResponse`

说明：

- token 响应统一带 `token_type = "bearer"`
- `CurrentUserResponse` 返回：
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

- 对前端暴露的 Test 数据仅包含 `id` 和 `name`

### `room_schema.py`

主要模型包括：

- `CreateRoomRequest`
- `RoomUserInfo`
- `RoomResponse`
- `RoomListItem`
- `CreateRoomResponse`
- `JoinLeaveResponse`

说明：

- `RoomResponse` 返回房间详情与在线用户列表
- `RoomListItem` 返回大厅列表所需字段
- `JoinLeaveResponse` 返回 `{ ok, room_id }`

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

由于数据库 URL 是相对路径，通常建议在 `backend/` 目录下运行服务。

## 6. utils：常量、依赖与通用工具

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
- 从 `sub` 读取用户 ID
- 查询数据库中的当前用户
- token 无效、过期或用户不存在时返回 `401`

### `id_generator.py`

职责：

- 生成短字符串 ID

当前在项目中主要用于生成 6 位房间号。

### `snowflake.py`

职责：

- 生成字符串雪花 ID

当前主要用于：

- `users.id`
- `test.id`

### `logging.py`

职责：

- 初始化 loguru 日志配置

项目入口和应用装配阶段都会先调用它。

## 核心运行流程

后端当前主要运行链路如下：

1. 执行 `python app.py`
2. `app.py` 初始化日志并启动 uvicorn
3. `app.main` 创建 FastAPI 应用
4. `lifespan` 中自动建表并清理过期游客账号
5. 注册 HTTP、WS 与静态资源路由
6. 请求进入 controller 层
7. controller 根据需要注入 `db` 和 `current_user`
8. service 层处理数据库逻辑、房间逻辑或 WS 推送
9. schema 将数据序列化为接口响应
10. 如果访问的是前端路由，则由静态控制器返回 `index.html`

## 接口能力概览

### 认证与用户相关

- 用户登录
- 游客账号创建
- token 有效性校验
- 查看当前用户资料
- 更新昵称与密码
- 清理过期游客账号

### Test 资源相关

- 健康检查
- 获取当前用户自己的列表
- 创建当前用户自己的记录
- 更新当前用户自己的记录
- 删除当前用户自己的记录

### 房间相关

- 创建房间
- 获取在线房间列表
- 获取房间详情
- 加入房间
- 离开房间
- 开始游戏
- 结束游戏

### WebSocket 相关

- 建立带 token 的实时连接
- 心跳 ping/pong
- 房间成员加入事件推送
- 房间成员离开事件推送
- 游戏开始事件推送
- 游戏结束事件推送

## 与前端的耦合点

当前前后端的主要耦合点包括：

- 前端开发模式固定请求 `127.0.0.1:52000`
- 生产模式下前端依赖后端同源托管
- 前端使用 `BrowserRouter`，后端必须提供 SPA fallback
- 房间页依赖以下 WS 消息类型：
  - `user_joined`
  - `user_left`
  - `game_started`
  - `game_ended`
- 前端通过 `/auth/ping` 判断 token 是否仍有效，以辅助 WS 重连

## 运行方式

### 后端开发模式

```bash
cd backend
pip install -r requirements.txt
python app.py
```

默认监听 `127.0.0.1:${PORT}`，项目当前通常配置为 `52000`。

### 前后端一体运行模式

1. 在前端执行构建，将产物输出到 `backend/dist`
2. 启动后端服务
3. 直接访问后端地址即可同时使用 API 与前端页面
