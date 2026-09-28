export const appConfig = {
  // 密碼驗證設定
  passwordEnabled: true,
  defaultPasscode: "split-2026",
  defaultPasscodeHash: "35dd4d448fc803afdfd6fa19370d26e833657128f76721675be8f0986874b010",

  // 課程基本資訊
  courseId: "split-interactive",
  courseVersion: "1.0",

  // LocalStorage 金鑰名稱字串
  storageKey: "split-workbook:v1",
  
  // 開發模式（若設為 true，可在開發時自動略過密碼頁）
  devBypassPassword: false
};
