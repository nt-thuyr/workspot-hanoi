# Workspot‑Hanoi Monorepo

Dự án khởi tạo Full-stack dựa trên **Turborepo** bao gồm Client (React + Vite), Server (Express + TypeScript), và các gói dùng chung.

---

## 📁 Cấu trúc thư mục (Workspace Layout)

```
workspot-hanoi/
├─ apps/
│  ├─ client/   ← Vite + React (Frontend)
│  └─ server/   ← Express + TypeScript (Backend)
├─ packages/
│  ├─ shared/               ← Kiểu dữ liệu (Types), Zod schemas, constants dùng chung
│  ├─ eslint-config/        ← Cấu hình ESLint dùng chung
│  └─ typescript-config/    ← Cấu hình TypeScript dùng chung
├─ turbo.json                ← Định nghĩa pipeline của Turborepo
└─ package.json              ← Scripts gốc & khai báo các workspace
```

---

## 🚀 Hướng dẫn bắt đầu nhanh

### Yêu cầu hệ thống (Prerequisites)

- **Node.js** ≥ 18
- **npm** ≥ 11 (được cài đặt sẵn đi kèm với Node)
- **Git** (để quản lý mã nguồn)

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy dev

```bash
npm run dev
```

Mặc định:

- Client: `http://localhost:5173`
- Server: `VITE_API_URL` fallback to `http://localhost:3000`

Chạy riêng từng app:

```bash
cd apps/client
npm run dev

cd apps/server
npm run dev
```

---

## 📦 Scripts chính

| Nơi chạy      | Script                | Ý nghĩa                                   |
| ------------- | --------------------- | ----------------------------------------- |
| root          | `npm run dev`         | Chạy toàn bộ workspace ở chế độ dev       |
| root          | `npm run build`       | Build toàn bộ workspace                   |
| root          | `npm run lint`        | Chạy lint toàn bộ workspace               |
| root          | `npm run check-types` | Kiểm tra type toàn bộ workspace           |
| `apps/client` | `npm run dev`         | Chạy Vite dev server                      |
| `apps/client` | `npm run build`       | Build client                              |
| `apps/server` | `npm run dev`         | Watch TypeScript và chạy server song song |
| `apps/server` | `npm run build`       | Build server TypeScript                   |

---

## 🧩 Workspace

`packages/shared` là nơi để đặt code/type dùng chung khi cần. `packages/eslint-config` và `packages/typescript-config` là các workspace cấu hình để các app con kế thừa.

---

## 🎉 Tóm tắt ngắn gọn (TL;DR)

1. **`npm install`** – Cài đặt một lần duy nhất để thiết lập môi trường.
2. **`npm run dev`** – Chạy đồng thời cả Frontend và Backend, hỗ trợ tự động cập nhật code tức thì.
3. **`npm run build`** – Đóng gói toàn bộ dự án sẵn sàng cho môi trường production.

Chúc ae dev vui! 🚀
