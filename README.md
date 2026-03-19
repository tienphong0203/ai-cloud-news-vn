# VN Tech Pulse 🇻🇳

Tổng hợp tin tức **AI & Cloud Việt Nam** trong 24h qua, tự động cập nhật mỗi giờ.

## Tech Stack

- **Next.js 14** (App Router)
- **Vercel KV** (Redis cache)
- **Google News RSS** (nguồn tin — miễn phí, không cần API key)
- **Vercel Cron Jobs** (trigger refresh mỗi giờ)

---

## Deploy lên Vercel (5 bước)

### Bước 1 — Clone và push lên GitHub

```bash
git init
git add .
git commit -m "init: vn tech pulse"
gh repo create vn-tech-news --public --push --source=.
```

### Bước 2 — Import vào Vercel

1. Vào [vercel.com/new](https://vercel.com/new)
2. Chọn repo `vn-tech-news`
3. Framework: **Next.js** (auto-detect)
4. Nhấn **Deploy**

### Bước 3 — Tạo Vercel KV

1. Vào Vercel Dashboard > **Storage** tab
2. Nhấn **Create Database** > chọn **KV**
3. Đặt tên: `news-cache`
4. **Connect to project** của bạn
5. Vercel tự inject `KV_REST_API_URL` và `KV_REST_API_TOKEN` vào env

### Bước 4 — Set environment variables

Trong Vercel Dashboard > Settings > Environment Variables:

```
CRON_SECRET = (random string, ví dụ: openssl rand -hex 20)
```

`KV_REST_API_URL` và `KV_REST_API_TOKEN` đã được Vercel tự inject ở bước 3.

### Bước 5 — Seed data lần đầu

Sau khi deploy xong, trigger refresh thủ công:

```bash
curl -X GET https://your-site.vercel.app/api/refresh \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Hoặc mở thẳng URL đó trong browser (không cần auth khi `CRON_SECRET` chưa set).

---

## Cron Job

File `vercel.json` đã cấu hình sẵn cron chạy **mỗi giờ**:

```json
{
  "crons": [{ "path": "/api/refresh", "schedule": "0 * * * *" }]
}
```

Vercel gọi `/api/refresh` tự động — Vercel sẽ tự inject header xác thực.

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Điền KV credentials từ Vercel dashboard vào .env.local
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

Nếu chưa có KV local, `/api/news` sẽ fetch RSS trực tiếp (cold start fallback).

---

## Nguồn tin RSS

| Query | Category |
|-------|----------|
| AI + trí tuệ nhân tạo + Việt Nam | AI |
| Cloud + điện toán đám mây + Việt Nam | Cloud |
| Startup + công nghệ + Việt Nam | Startup |
| FPT + Viettel + VNPT + technology | General |

---

## Upgrade tiếp theo

- [ ] Thêm Tavily API để summary chất lượng hơn
- [ ] Thêm full-text search với Algolia
- [ ] Thêm newsletter digest hàng ngày
- [ ] Upgrade storage lên Supabase để có lịch sử dài hơn
