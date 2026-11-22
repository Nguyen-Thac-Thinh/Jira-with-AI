# Jira with AI (AgileFlow AI)

[![CI](https://github.com/Nguyen-Thac-Thinh/Jira-with-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/Nguyen-Thac-Thinh/Jira-with-AI/actions/workflows/ci.yml)

Ứng dụng web quản lý dự án Agile/Scrum lấy cảm hứng từ Jira, tích hợp **AI gợi ý Story Point** dựa trên **nội dung task**, **độ khó**, **thời gian dự kiến** và **lịch sử các task đã hoàn thành** bằng **Machine Learning (`scikit-learn`) + Mô phỏng Monte Carlo**.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Java 21, Spring Boot, Spring Security (JWT), Spring Data JPA, Flyway |
| **AI Service** | Python, FastAPI, `scikit-learn`, `numpy`, `scipy` (Monte Carlo Simulation) |
| **Database** | PostgreSQL 16 (Docker) |

## Project Structure

```text
Jira-with-AI/
├── backend/            # Java Spring Boot REST API & Business Logic
├── frontend/           # React + TypeScript Web Application
├── ai-service/         # Python ML (scikit-learn) & Monte Carlo Story Point Estimator
├── docs/               # Architecture & Database Design docs
├── docker-compose.yml  # Local PostgreSQL infrastructure
├── .env.example        # Environment variables template
├── .editorconfig       # Code formatting rules
└── .gitignore
```

## Core Features (MVP)

1. **Authentication & Team Management**: Đăng ký, đăng nhập (JWT), quản lý thành viên dự án và phân công Assignee.
2. **Project & Kanban Board**: Quản lý dự án, bảng Kanban kéo-thả (`To Do`, `In Progress`, `In Review`, `Done`), CRUD Issue & Comment.
3. **Sprint & Backlog Planning**: Tạo Sprint, kéo-thả task giữa Backlog và Sprint, Start/Complete Sprint.
4. **AI Story Point Estimator**:
   - Dự đoán điểm Fibonacci (`1, 2, 3, 5, 8, 13, 21`) bằng `scikit-learn` (`TfidfVectorizer` + `RandomForestRegressor`).
   - Mô phỏng **Monte Carlo (5.000 trials)** theo phân phối PERT để đưa ra **P50 (Khả năng cao nhất)**, **P85 (Mức an toàn để cam kết Sprint)** và **biểu đồ xác suất**.
   - Tìm **Top 3 task quá khứ tương tự nhất** trong dự án bằng Cosine Similarity.

## Getting Started (Database)

1. Tạo file `.env` từ mẫu:
   ```bash
   cp .env.example .env
   ```
2. Khởi chạy PostgreSQL bằng Docker:
   ```bash
   docker compose up -d
   ```

Xem thêm chi tiết kiến trúc và thiết kế cơ sở dữ liệu tại [docs/architecture.md](./docs/architecture.md).
