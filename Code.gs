/**
 * ============================================================
 * QUAN TRỌNG:
 * Deploy > Manage deployments > Edit:
 *   - Execute as: Me
 *   - Who has access: Anyone  (KHÔNG chọn "Anyone within [tổ chức]")
 * ============================================================
 *
 * SỬA TÊN PHONG TRÀO / TUẦN / BẬT-TẮT THƯ MỤC LỚP:
 * Mở Google Sheet > tab "Config":
 *   - B2: Tên trường
 *   - B3: Tiêu đề phong trào
 *   - B4: Ghi chú nhỏ
 *   - A7 trở xuống: danh sách Tuần hoạt động (mỗi dòng 1 tuần)
 *   - D1: TRUE/FALSE - có tạo thêm thư mục con theo Lớp trong mỗi Tuần hay không
 * Sửa xong không cần deploy lại, web app tự đọc giá trị mới.
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Thu Hình Ảnh Hoạt Động Đoàn')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Chạy tay 1 lần trong Apps Script editor (nút Run) để tạo sẵn tab Config nếu muốn
function taoConfigMacDinh() {
  getOrCreateConfigSheet_();
}

var SPREADSHEET_ID = '1eCVOLyUm06fPPuAzO5xu4opc6CUukAF-Z2rvSc5v2Og'; // ID Sheet cá nhân của bạn
var MAIN_FOLDER_ID = '1TpSApDlrESK6ZmaCIKi_k4r0i0N3SGjh'; // ID Drive cá nhân của bạn

function getOrCreateConfigSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
    configSheet.getRange('A1:B1').setValues([['Key', 'Value']]);
    configSheet.getRange('A1:B1').setFontWeight('bold');
    configSheet.getRange('A2:B4').setValues([
      ['TenTruong', 'Trường THPT Phan Việt Thống'],
      ['TieuDe', 'Web Thu Hình Ảnh\nHoạt Động Đoàn'],
      ['GhiChu', 'KHKT 2026-2027']
    ]);
    configSheet.getRange('A6').setValue('Danh sách Tuần (mỗi dòng 1 lựa chọn, bắt đầu từ A7):');
    configSheet.getRange('A6').setFontWeight('bold');
    configSheet.getRange('A7:A10').setValues([['Tuần 1'], ['Tuần 2'], ['Tuần 3'], ['Tuần 4']]);
    configSheet.autoResizeColumns(1, 2);
  }
  // Đảm bảo có ô cấu hình "Tạo thư mục theo Lớp" (tự thêm cho cả sheet cũ nếu chưa có)
  var subfolderLabel = configSheet.getRange('C1').getValue();
  if (!subfolderLabel) {
    configSheet.getRange('C1').setValue('Tạo thư mục theo Lớp? (TRUE/FALSE)');
    configSheet.getRange('C1').setFontWeight('bold');
    configSheet.getRange('D1').setValue(false);
    configSheet.autoResizeColumns(3, 2);
  }

  return configSheet;
}

function getSubfolderByClassSetting_(configSheet) {
  var val = configSheet.getRange('D1').getValue();
  return val === true || val === 'TRUE' || val === 'true';
}

function sanitizeForFileName_(str) {
  return (str || '').toString()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

// Trang trí 1 tab Tuần: header tô màu, đóng băng dòng đầu, kẻ sọc xen kẽ, canh cột
function formatWeekSheet_(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, 4);
  headerRange.setBackground('#1C2541');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setVerticalAlignment('middle');
  headerRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 150); // Thời gian
  sheet.setColumnWidth(2, 190); // Họ và tên
  sheet.setColumnWidth(3, 90);  // Lớp
  sheet.setColumnWidth(4, 130); // Link ảnh

  var wholeRange = sheet.getRange(1, 1, 2000, 4);
  wholeRange.setBorder(true, true, true, true, true, true, '#E5E1D6', SpreadsheetApp.BorderStyle.SOLID);

  var dataRange = sheet.getRange(2, 1, 1999, 4);
  dataRange.setVerticalAlignment('middle');
  sheet.getRange(2, 3, 1999, 1).setHorizontalAlignment('center'); // cột Lớp căn giữa
  sheet.getRange(2, 4, 1999, 1).setHorizontalAlignment('center'); // cột Link ảnh căn giữa

  var rules = sheet.getConditionalFormatRules().filter(function (r) {
    return r.getRanges().length === 0 ||
      r.getRanges()[0].getA1Notation().indexOf('A2') !== 0;
  });
  var stripeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=ISEVEN(ROW())')
    .setBackground('#F5F2EC')
    .setRanges([dataRange])
    .build();
  rules.push(stripeRule);
  sheet.setConditionalFormatRules(rules);
}

// Chạy tay trong Apps Script editor (nút Run) để trang trí lại TẤT CẢ các tab Tuần đã có sẵn
function trangTriTatCaCacTuan() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  sheets.forEach(function (sheet) {
    if (sheet.getName() === 'Config') return;
    formatWeekSheet_(sheet);
  });
}

function readWeeks_(configSheet) {
  var weeks = [];
  var row = 7;
  while (true) {
    var val = configSheet.getRange('A' + row).getValue();
    if (!val) break;
    weeks.push(val.toString());
    row++;
  }
  return weeks;
}

// Dùng cho trang form học sinh (Index.html) - KHÔNG trả mật khẩu
function getFormConfig() {
  var configSheet = getOrCreateConfigSheet_();
  var tenTruong = configSheet.getRange('B2').getValue();
  var tieuDe = configSheet.getRange('B3').getValue();
  var ghiChu = configSheet.getRange('B4').getValue();
  var weeks = readWeeks_(configSheet);

  return {
    tenTruong: tenTruong || 'Trường THPT Phan Việt Thống',
    tieuDe: tieuDe || 'Web Thu Hình Ảnh\nHoạt Động Đoàn',
    ghiChu: ghiChu || '',
    weeks: weeks.length ? weeks : ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4']
  };
}

function uploadFile(base64Data, fileName, fullName, className, week) {
  if (!base64Data || !fileName || !fullName || !className || !week) {
    return "LỖI: Thiếu dữ liệu (họ tên / lớp / tuần / file).";
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return "LỖI: Hệ thống đang xử lý người khác, vui lòng thử gửi lại sau vài giây.";
  }

  try {
    var mainFolder;
    try {
      mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
    } catch (e) {
      return "LỖI (Bước mở Drive): " + e.toString();
    }

    var weekFolder;
    try {
      var folders = mainFolder.getFoldersByName(week);
      weekFolder = folders.hasNext() ? folders.next() : mainFolder.createFolder(week);
    } catch (e) {
      return "LỖI (Bước tạo thư mục tuần): " + e.toString();
    }

    var targetFolder = weekFolder;
    try {
      var configSheet = getOrCreateConfigSheet_();
      if (getSubfolderByClassSetting_(configSheet)) {
        var classFolders = weekFolder.getFoldersByName(className);
        targetFolder = classFolders.hasNext() ? classFolders.next() : weekFolder.createFolder(className);
      }
    } catch (e) {
      return "LỖI (Bước tạo thư mục lớp): " + e.toString();
    }

    var mainFile, mainFileUrl;
    try {
      var splitBase = base64Data.split(',');
      if (splitBase.length < 2) {
        return "LỖI: Dữ liệu file gửi lên không hợp lệ.";
      }
      var type = splitBase[0].split(';')[0].replace('data:', '');
      var byteCharacters = Utilities.base64Decode(splitBase[1]);

      // Tạo tên file mới: Lớp_HọTên_Tuần_ThờiGian.đuôifile (giữ nguyên đuôi file gốc)
      var dotIndex = fileName.lastIndexOf('.');
      var ext = dotIndex !== -1 ? fileName.substring(dotIndex + 1) : '';
      var timestampForName = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
      var newFileName = sanitizeForFileName_(className) + '_' +
                         sanitizeForFileName_(fullName) + '_' +
                         sanitizeForFileName_(week) + '_' +
                         timestampForName + (ext ? ('.' + ext) : '');

      var blob = Utilities.newBlob(byteCharacters, type, newFileName);

      mainFile = targetFolder.createFile(blob);
      mainFileUrl = mainFile.getUrl();
    } catch (e) {
      return "LỖI (Bước tạo file): " + e.toString();
    }

    try {
      var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

      var sheet = ss.getSheetByName(week);
      if (!sheet) {
        sheet = ss.insertSheet(week);
        sheet.appendRow(["Thời gian", "Họ và tên", "Lớp", "Link ảnh"]);
        formatWeekSheet_(sheet);
      }
      sheet.appendRow([timestamp, fullName, className, mainFileUrl]);
      var lastRow = sheet.getLastRow();
      var linkValue = SpreadsheetApp.newRichTextValue()
        .setText("Xem ảnh")
        .setLinkUrl(mainFileUrl)
        .build();
      sheet.getRange(lastRow, 4).setRichTextValue(linkValue);
    } catch (e) {
      return "LỖI (Bước ghi Sheet, nhưng file đã lưu tại " + mainFileUrl + "): " + e.toString();
    }

    return mainFileUrl;

  } catch (error) {
    return "LỖI (không xác định): " + error.toString() + " | Stack: " + error.stack;
  } finally {
    lock.releaseLock();
  }
}
