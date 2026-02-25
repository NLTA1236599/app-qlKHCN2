
# Hướng Dẫn Kích Hoạt Dịch Vụ Firebase (Backend)

Sử dụng Firebase là giải pháp chuyên nghiệp, mạnh mẽ và ổn định nhất của Google (miễn phí ở mức cơ bản rất hào phóng), thay thế hoàn toàn được Supabase (hay bị pause) và Google Sheets (tốc độ chậm).

## Bước 1: Tạo Dự Án Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Nhấn nút **"Create a project"** (hoặc "Add project").
3. Đặt tên dự án (ví dụ: `QLKHCN-UMP`).
4. Tắt Google Analytics (không cần thiết lúc này) -> Nhấn **Create project**.
5. Chờ một chút rồi nhấn **Continue**.

## Bước 2: Tạo Web App
1. Tại trang tổng quan (Project Overview), nhấn vào biểu tượng **Web** (hình </> tròn màu trắng).
2. Đặt tên ứng dụng (ví dụ: `Web-App-QLKHCN`).
3. Nhấn **Register app**.
4. **QUAN TRỌNG:** Bạn sẽ thấy một đoạn mã `const firebaseConfig = { ... }`. Hãy **COPY** toàn bộ nội dung trong dấu ngoặc nhọn `{ ... }`.
   
   Nó trông giống thế này:
   ```javascript
   apiKey: "AIzaSyD...",
   authDomain: "qlkhcn-ump.firebaseapp.com",
   projectId: "qlkhcn-ump",
   storageBucket: "qlkhcn-ump.appspot.com",
   messagingSenderId: "...",
   appId: "..."
   ```
5. Nhấn **Continue to console**.

## Bước 3: Tạo Firestore Database (Cơ sở dữ liệu)
1. Ở menu bên trái, chọn **Build** -> **Firestore Database**.
2. Nhấn **Create database**.
3. Chọn Location (vị trí máy chủ): Nên chọn `asia-southeast1` (Singapore) hoặc `asia-east1` (Taiwan) cho nhanh. Nếu không quan trọng, để mặc định `nam5 (us-central)` cũng được.
4. Ở bước **Security Rules**, chọn **Start in test mode** (Bắt đầu ở chế độ thử nghiệm).
   *Lưu ý: Chế độ này cho phép đọc/ghi thoải mái trong 30 ngày đầu, rất tiện để phát triển. Sau này chúng ta sẽ cấu hình lại luật bảo mật.*
5. Nhấn **Enable**.

## Bước 4: Cấu hình vào Ứng Dụng
1. Mở file `.env.local` trong thư mục dự án của bạn trên máy tính.
2. Thêm (hoặc sửa) các dòng sau bằng thông tin bạn đã COPY ở Bước 2:

```env
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=qlkhcn-ump.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=qlkhcn-ump
VITE_FIREBASE_STORAGE_BUCKET=qlkhcn-ump.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Sau khi lưu file `.env.local`, hãy khởi động lại ứng dụng (`npm run dev`). Ứng dụng sẽ tự động kết nối tới Firebase!
