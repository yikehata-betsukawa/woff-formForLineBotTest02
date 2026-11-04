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
  const formEl = document.getElementById("woff-form"); // フォーム要素

  try {
    // ==========================================
    // 1. WOFF アプリの初期化
    // ==========================================
    statusEl.innerText = "WOFF SDK 初期化中...";
    await woff.init({ woffId: MY_WOFF_ID,
      scope: "openid user.read", //LINE WORKS 側で設定されたスコープと照合するためアプリの権限を明示的に指定
      redirectUri: window.location.origin + window.location.pathname  // ログイン後の戻り先URL
    });

    // ==========================================
    // 2. WOFF アプリの実行環境の確認//ログイン状態の確認（未ログイン時はログイン画面へ）
    // ==========================================
    if (!woff.isLoggedIn()) {

      statusEl.innerText = "LINE WORKS ログイン画面へ移動中...";
      // 外部ブラウザの場合は LINE WORKS のログイン画面へリダイレクト
      woff.login({
        redirectUri: window.location.origin + window.location.pathname
      });
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
    // この位置（初期表示処理）でアプリを閉じるを呼ぶ場合は下記ケース
    // 画面を伴わない自動処理（バックグラウンド連携）
    // トーク画面への自動テキスト送信（woff.sendCustomMessage 等）を行った直後
    // ログイン状態や権限のチェック・弾き処理

  } catch (err) {
    const errDetail = typeof err === "object" ? JSON.stringify(err) : err;
    showDebugError(`WOFF 処理エラー: ${errDetail}`);
  }
}

// 5. FastAPI へデータを送信する処理
async function handleFormSubmit(event) {
  event.preventDefault(); // フォーム送信時のページリロードを防止

  const resultEl = document.getElementById("result-message");
  const submitBtn = document.getElementById("submit-btn");

  if (!currentUserProfile) {
    alert("ユーザー情報が取得できていません。再読み込みしてください。");
    return;
  }

  // フォームの入力項目を取得（HTML側の id に合わせて調整してください）
  const titleVal = document.getElementById("title") ? document.getElementById("title").value : "";
  const detailVal = document.getElementById("detail") ? document.getElementById("detail").value : "";

  // FastAPI に送信する Payload（JSONデータ）の作成
  const payload = {
    userId: currentUserProfile.userId,
    displayName: currentUserProfile.displayName,
    title: titleVal,
    detail: detailVal
  };


  if (submitBtn) {
  submitBtn.disabled = true;
  }
  
  if (resultEl) {
    resultEl.className = "result-msg";
    resultEl.innerText = "送信中...";
  }

  try {
    // ★ ここに FastAPI のエンドポイント URL を指定します
    const FASTAPI_ENDPOINT = "https://dev-bcreer.betsukawa.co.jp/vision_api/woff/submit";

    const response = await fetch(FASTAPI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP エラー! ステータス: ${response.status}`);
    }

    const data = await response.json();
    if (resultEl) {
      resultEl.classList.add("success");
      resultEl.innerText = "正常に送信されました！画面を閉じます...";
    }

    // ★ ==========================================
    // 4. WOFF アプリを閉じる処理（送信成功時）
    // ==========================================
    setTimeout(() => {
      if (typeof woff !== "undefined" && woff.closeWindow) {
        woff.closeWindow(); // ← 送信成功から1.5秒後に自動で画面を閉じる
      }
    }, 1500);

  } catch (err) {
    console.error("送信エラー:", err);
    if (resultEl) {
      resultEl.classList.add("error");
      resultEl.innerText = "送信に失敗しました: " + err.message;
    }
  } finally {
    submitBtn.disabled = false;
  }
}

// DOM読み込み完了後に実行
document.addEventListener("DOMContentLoaded", () => {
  // 初期化関数の呼び出し
  initWoffApp();

  // フォーム送信イベントの割り当て
  const formEl = document.getElementById("woff-form");
  if (formEl) {
    formEl.addEventListener("submit", handleFormSubmit);
  }
});