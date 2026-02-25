---
description: Hướng dẫn chuyển đổi web thành app mobile & desktop sử dụng Capacitor
---

# Chuyển đổi Web thành App Mobile & Desktop

Để tạo app thực thụ (Android .apk, iOS .webapp, hoặc Windows .exe), chúng ta sẽ sử dụng **Capacitor** - framework hiện đại nhất để biến web thành app native.

## 1. Cài đặt các thư viện cần thiết
Mở terminal và chạy lệnh:
```bash
npm install @capacitor/core @capacitor/cli
```

## 2. Khởi tạo Capacitor
Chạy lệnh bên dưới để thiết lập thông tin app:
```bash
npx cap init "Quản lý Nghiên cứu KHCN" "com.ump.qlkhcn" --web-dir dist
```

## 3. Tạo app cho từng nền tảng

### Đối với Mobile (Android & iOS)
1. Thêm nền tảng:
   ```bash
   npm install @capacitor/android @capacitor/ios
   npx cap add android
   npx cap add ios
   ```
2. Build app và đồng bộ mã nguồn:
   ```bash
   npm run build
   npx cap copy
   ```
3. Mở trong môi trường phát triển native (Android Studio hoặc Xcode):
   ```bash
   npx cap open android
   npx cap open ios
   ```

### Đối với Desktop (Windows/macOS)
Có 2 cách chính:
- **Cách 1: Triển khai dạng PWA (Khuyên dùng)**: Người dùng mở web trên Chrome/Safari và chọn "Cài đặt ứng dụng". App sẽ xuất hiện trên màn hình desktop/điện thoại như app thật mà không cần cài đặt phức tạp.
- **Cách 2: Sử dụng Tauri hoặc Electron**: Phức tạp hơn, giúp tạo file `.exe` hoặc `.dmg`.

## 4. Quy trình cập nhật app khi có thay đổi code
Mỗi khi bạn sửa code và muốn app cập nhật:
1. Chạy `npm run build`
2. Chạy `npx cap copy`
3. (Nếu là Android/iOS) Mở Android Studio/Xcode và bấm nút Play để build lại bản cài đặt.

---
**Lưu ý:** Để build Android/iOS, máy tính của bạn cần cài đặt sẵn **Android Studio** (cho Android) hoặc **macOS + Xcode** (cho iOS).
