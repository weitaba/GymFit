# GymFit AI — 智能健身助手

AI 驱动的健身应用，三大模块：

- **🧍 体态检测** — 脊柱侧弯、翼状肩胛、腿型、骨盆倾斜、圆肩、头前倾
- **🏋️ 动作检测** — 深蹲、卧推、硬拉、肩推、二头弯举、引体向上
- **🥗 减脂助手** — 饮食推荐、碳循环/生酮计划、卡路里记录

## 技术栈

| 层 | 选型 |
|---|---|
| 后端 | Python FastAPI |
| 前端 | React 19 + TypeScript + Vite |
| AI | Claude Vision / OpenAI GPT-4V（可插拔） |
| 配置 | YAML 文件（每种检测一个） |
| 数据 | 无数据库，内存缓存 + 前端 localStorage |

## 快速开始

### 1. 配置 API Key

```bash
cd backend
cp .env.example .env
# 编辑 .env，至少填一个 API Key：
#   ANTHROPIC_API_KEY=sk-ant-...       (Claude)
#   OPENAI_API_KEY=sk-...              (OpenAI)
#   DASHSCOPE_API_KEY=sk-...           (阿里云百炼)
```

### 2. 启动后端

**首次运行**需要创建虚拟环境并安装依赖：

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

**之后每次启动**只需激活环境并运行：

```bash
cd backend

uvicorn main:app --reload --port 8000
```

> **注意：** `uvicorn` 装在 venv 虚拟环境里，必须先 `source venv/bin/activate` 才能找到。
> 如果提示 `command not found: uvicorn`，说明没激活 venv。

### 3. 启动前端

```bash
cd frontend
npm install          # 首次运行
npm run dev          # 启动开发服务器
```

访问 http://localhost:5173

## 项目结构

```
gym-project/
├── backend/
│   ├── main.py                  # FastAPI 入口
│   ├── config/
│   │   ├── loader.py            # YAML 配置加载器
│   │   └── detection_types/     # 检测类型配置（YAML）
│   │       ├── posture/         # 体态检测 (6个)
│   │       ├── movement/        # 动作检测 (6个)
│   │       └── diet/            # 减脂方案 (3个)
│   ├── providers/               # AI 接口抽象
│   │   ├── base.py              # AIProvider ABC
│   │   ├── claude.py            # Claude 实现
│   │   ├── openai.py            # OpenAI 实现
│   │   └── bailian.py           # 阿里云百炼实现
│   ├── routers/                 # API 路由
│   ├── services/                # 业务逻辑
│   └── models/                  # Pydantic schemas
├── frontend/
│   └── src/
│       ├── pages/               # 页面组件
│       ├── components/          # 共享组件
│       ├── api/                 # API 调用
│       └── types/               # TS 类型定义
└── README.md
```

## 如何新增检测类型

1. 在 `backend/config/detection_types/{category}/` 下新建 YAML 文件
2. 填写 `id`, `name`, `category`, `system_prompt` 等字段
3. 重启后端，新类型自动出现在前端列表中

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/detection-types` | 列出检测类型 |
| GET | `/api/detection-types/{id}` | 类型详情 |
| POST | `/api/analyze` | 图片分析（multipart） |
| POST | `/api/diet/recommend` | 饮食分析（JSON） |
| GET | `/api/results/{id}` | 获取缓存结果 |

## 隐私说明

- 图片通过加密连接发送至 AI 服务商分析，完成后不存储在服务器
- 卡路里记录数据存储在浏览器本地，不上传至服务器
- 分析结果缓存 15 分钟后自动清除
source venv/bin/activate