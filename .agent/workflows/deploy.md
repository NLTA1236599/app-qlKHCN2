---
description: Hướng dẫn đóng gói và triển khai ứng dụng quản lý dự án KHCN
---

# Hướng dẫn Xuất App thành Website (Deploy)

Để chuyển ứng dụng từ mã nguồn thành một website có thể truy cập được, bạn cần thực hiện các bước sau:

## 1. Chuẩn bị môi trường
Hãy đảm bảo bạn đã cài đặt các thư viện cần thiết. Chạy lệnh sau trong terminal:
```bash
npm install
```

## 2. Cấu hình Cơ sở dữ liệu (Supabase)
Để dữ liệu được lưu vĩnh viễn và đồng bộ giữa các máy, bạn cần:
1. Tạo tài khoản tại [Supabase.com](https://supabase.com/).
2. Tạo 1 Project mới.
3. Vào mục **SQL Editor**, copy nội dung file `supabase_schema.sql` vào và chạy (Run).
4. Vào mục **Project Settings -> API**, lấy `Project URL` và `anon key`.
5. Cập nhật vào file `.env.local` hoặc cấu hình Environment Variables trên Vercel:
   - `VITE_SUPABASE_URL=đường_dẫn_của_bạn`
   - `VITE_SUPABASE_ANON_KEY=key_của_bạn`

## 3. Cấu hình AI (Gemini)
Đảm bảo bạn đã có API Key của Gemini:
```env
VITE_GEMINI_API_KEY=your_key_here
```

## 3. Đóng gói ứng dụng (Build)
// turbo
Chạy lệnh sau để tạo ra phiên bản website tối ưu:
```bash
npm run build
```
Sau khi chạy lệnh này, một thư mục tên là `dist` sẽ được tạo ra. Đây chính là "website" của bạn.

## 4. Kiểm tra bản build (Preview)
Để xem trước bản build trên máy local:
```bash
npm run preview
```

## 5. Triển khai lên mạng (Hosting)
Bạn có thể chọn một trong các cách sau để đưa website lên internet:

### Cách A: Triển khai lên Vercel (Khuyên dùng)
1. Cài đặt Vercel CLI: `npm i -g vercel`
2. Chạy lệnh: `vercel`
3. Làm theo hướng dẫn trên màn hình.

### Cách B: Triển khai lên GitHub Pages
1. Đẩy mã nguồn lên một repository trên GitHub.
2. Cấu hình GitHub Actions để tự động build và deploy từ thư mục `dist`.

### Cách C: Sử dụng thư mục `dist`
Bạn có thể copy toàn bộ nội dung trong thư mục `dist` lên bất kỳ hosting nào hỗ trợ file tĩnh (cPanel, Nginx, Apache, Firebase Hosting, Netlify).

---
**Lưu ý:** Trước khi xuất bản, hãy kiểm tra kỹ các file `App.tsx` và `index.html` để đảm bảo các đường link và thông tin bản quyền đã chính xác.
