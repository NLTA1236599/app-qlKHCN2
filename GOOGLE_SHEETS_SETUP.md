
# Hướng dẫn Thiết lập Google Sheets làm Cơ sở dữ liệu

Vì Supabase hay bị tạm dừng (pause), chúng ta sẽ sử dụng Google Sheets để lưu dữ liệu. Giải pháp này:
- **Miễn phí trọn đời**.
- **Không bao giờ bị xóa/dừng**.
- **Dữ liệu đồng bộ** giữa điện thoại và máy tính.
- Bạn có thể vào Google Sheets để xem/sửa dữ liệu trực tiếp.

## Bước 1: Tạo Google Sheet
1. Truy cập [Google Sheets](https://sheets.new) để tạo một trang tính mới.
2. Đặt tên file là **"DB_QLKHCN"** (hoặc tùy ý).
3. Đổi tên **Sheet1** (ở dưới cùng) thành **Projects**.
4. Tạo thêm một sheet mới và đặt tên là **Users**.

## Bước 2: Tạo Script
1. Tại file Google Sheet vừa tạo, trên menu chọn **Extensions (Tiện ích mở rộng)** > **Apps Script**.
2. Một tab mới mở ra. Xóa hết code cũ trong file `Code.gs`.
3. Copy toàn bộ đoạn code dưới đây và dán vào:

```javascript
const SHEETS = {
  PROJECTS: 'Projects',
  USERS: 'Users'
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const params = e.parameter.action ? e.parameter : (e.postData ? JSON.parse(e.postData.contents) : {});
    const action = params.action;
    
    if (action === 'getProjects') {
      return responseJSON(getData(SHEETS.PROJECTS));
    }
    if (action === 'getUsers') {
      return responseJSON(getData(SHEETS.USERS));
    }
    if (action === 'saveProject') {
      const data = JSON.parse(params.data);
      saveRow(SHEETS.PROJECTS, data, 'id');
      return responseJSON({ success: true });
    }
    if (action === 'deleteProject') {
      deleteRow(SHEETS.PROJECTS, params.id);
      return responseJSON({ success: true });
    }
    if (action === 'saveUser') {
      const data = JSON.parse(params.data);
      saveRow(SHEETS.USERS, data, 'username');
      return responseJSON({ success: true });
    }

    return responseJSON({ error: 'Invalid action' });
  } catch (err) {
    return responseJSON({ error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Auto-parse JSON for complex fields if they look like JSON
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[h] = val;
    });
    return obj;
  });
}

function saveRow(sheetName, data, keyField) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  
  // Update headers if new fields appear
  const keys = Object.keys(data);
  let headerChanged = false;
  keys.forEach(k => {
    if (!headers.includes(k) && k !== 'history') { // headers
       headers.push(k);
       headerChanged = true;
    }
  });
  
  if (headerChanged || headers.length === 1 && headers[0] === '') {
     if(headers[0] === '') headers = keys;
     sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Reload headers
  headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Find existing row
  const allData = sheet.getDataRange().getValues();
  let rowIndex = -1;
  const keyIndex = headers.indexOf(keyField);
  
  if (keyIndex !== -1 && allData.length > 1) {
    for (let i = 1; i < allData.length; i++) {
        if (String(allData[i][keyIndex]) === String(data[keyField])) {
            rowIndex = i + 1;
            break;
        }
    }
  }

  const rowData = headers.map(h => {
    const val = data[h];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val === undefined ? '' : val;
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function deleteRow(sheetName, id) {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
   const data = sheet.getDataRange().getValues();
   // Assume ID is in column 'id' (Project)
   const headers = data[0];
   const idIndex = headers.indexOf('id');
   if (idIndex === -1) return;

   for (let i = 1; i < data.length; i++) {
     if (String(data[i][idIndex]) === String(id)) {
       sheet.deleteRow(i + 1);
       return;
     }
   }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Bước 3: Triển khai (Deploy)
1. Nhấn nút **Deploy** (màu xanh dương) > **New deployment**.
2. Bấm vào biểu tượng bánh răng cạnh "Select type" > chọn **Web app**.
3. Điền thông tin:
   - **Description**: API
   - **Execute as**: `Me (account@gmail.com)`
   - **Who has access**: `Anyone` (Bắt buộc chọn **Anyone** để App có thể truy cập).
4. Nhấn **Deploy**.
5. Cấp quyền truy cập (Review permissions > Choose Account > Advanced > Go to... (unsafe) > Allow).
6. **Copy Web App URL** (có dạng `https://script.google.com/macros/s/.../exec`).

## Bước 4: Dán URL vào App
Gửi lại URL đó cho tôi, hoặc dán vào file `.env.local` vào biến `VITE_GOOGLE_SHEETS_URL`.
