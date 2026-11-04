// 発行された WOFF ID
const MY_WOFF_ID = "YJb8yPlDwNF0T8JCf-olFw";

// 画面上にエラーメッセージを表示する補助関数
function showDebugError(message) {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.style.color = "red";
    statusEl.style.fontWeight = "bold";
    statusEl.innerText = "【エラー発生】\n" + message;
  }
}

// 予期せぬ JavaScript エラーのキャッチ
window.onerror = function(msg, url, line) {
  showDebugError(`${msg}\n(Line: ${line})`);
  return false;
};

// メイン処理（公式ドキュメントのライフサイクルに準拠）
async function initWoffApp() {
  const statusEl = document.getElementById("status");
  const profileEl = document.getElementById("profile");
  const displayNameEl = document.getElementById("display-name");
  const userIdEl = document.getElementById("user-id");

  try {
    // ==========================================
    // 1. WOFF アプリの初期化
    // ==========================================
    statusEl.innerText = "WOFF SDK 初期化中...";
    await woff.init({ woffId: MY_WOFF_ID });

    // ==========================================
    // 2. WOFF アプリの実行環境の確認
    // ==========================================
    if (!woff.isLoggedIn()) {
      showDebugError("非ログイン状態です。\nLINE WORKS アプリ内のトーク画面から開いてください。");
      return;
    }

    // ==========================================
    // 3. WOFF アプリ内での処理を実施
    //    (例: プロフィール情報の取得と表示)
    // ==========================================
    statusEl.innerText = "プロフィールを取得中...";
    const profile = await woff.getProfile();

    if (profile) {
      statusEl.style.display = "none";
      profileEl.style.display = "block";

      displayNameEl.innerText = profile.displayName || "ゲスト";
      userIdEl.innerText = profile.userId || "不明";
    }

    // ==========================================
    // 4. WOFF アプリを閉じる
    //    (フォーム送信完了時などに woff.closeWindow() を呼び出す)
    // ==========================================
    // ※現在はプロフィール表示画面のため閉じる処理は呼び出していません

  } catch (err) {
    const errDetail = typeof err === "object" ? JSON.stringify(err) : err;
    showDebugError(`WOFF 処理エラー: ${errDetail}`);
  }
}

// DOM読み込み完了後に実行
document.addEventListener("DOMContentLoaded", initWoffApp);