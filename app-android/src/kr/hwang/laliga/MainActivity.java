package kr.hwang.laliga;

// 월드 풋볼매니저 안드로이드 앱(웹뷰 1개). v226 APK 소스가 사라져 2026-10-30에 다시 작성.
// - 게임은 https://laliga.local/ 가상 주소로 제공(localStorage·IndexedDB 정상, 기존 저장 그대로 이어짐)
// - 자동 업데이트: 앱으로 돌아올 때마다(10분 간격) GitHub main의 version.json 확인 → 새 버전이면 index.html을 받아 두고
//   "지금 적용 / 나중에" 안내. 받아 둔 버전이 있으면 다음 실행 때 자동 적용
// - 뒤로가기: 게임의 window.appBack()(창 닫기 → 홈 탭) → false면 앱을 뒤로 보냄
// - 저장 내보내기: AndroidApp.saveFile(이름, 내용) → 저장 위치 선택 창, 불러오기: 파일 선택 창
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {
    static final int BUNDLED = 258;               // 이 APK에 묶인 웹 버전
    static final String HOME = "https://laliga.local/index.html";
    static final String RAW = "https://raw.githubusercontent.com/kreahwang-del/laliga-manager/main/";
    static final long CHECK_MS = 10 * 60 * 1000L;
    static final int REQ_SAVE = 11, REQ_OPEN = 12;

    WebView web;
    LinearLayout banner;
    TextView bannerText;
    Button bApply, bLater;
    SharedPreferences prefs;
    Handler ui = new Handler(Looper.getMainLooper());
    volatile boolean checking = false;
    String pendingSave = null;
    ValueCallback<Uri[]> fileCb = null;

    File cur() { return new File(getFilesDir(), "game-index.html"); }
    File pend() { return new File(getFilesDir(), "game-pend.html"); }
    File tmp() { return new File(getFilesDir(), "game-index.tmp"); }
    int curV() { int v = prefs.getInt("cur", 0); return (v > BUNDLED && cur().exists()) ? v : BUNDLED; }

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences("upd", MODE_PRIVATE);
        getWindow().setStatusBarColor(Color.parseColor("#0A0B0D"));
        getWindow().setNavigationBarColor(Color.parseColor("#0A0B0D"));
        // 받아 둔 새 버전이 있으면 시작할 때 적용
        int pv = prefs.getInt("pend", 0);
        if (pv > curV() && pend().exists()) { if (pend().renameTo(cur())) prefs.edit().putInt("cur", pv).putInt("pend", 0).apply(); }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#0A0B0D"));
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setAllowFileAccess(false);
        web.setBackgroundColor(Color.parseColor("#0A0B0D"));
        web.addJavascriptInterface(new Bridge(), "AndroidApp");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if ("laliga.local".equals(u.getHost())) {
                    String p = u.getPath();
                    if (p == null || p.equals("/") || p.equals("/index.html")) {
                        try {
                            InputStream in = (curV() > BUNDLED) ? new FileInputStream(cur()) : getAssets().open("index.html");
                            return new WebResourceResponse("text/html", "utf-8", in);
                        } catch (Exception e) { return null; }
                    }
                }
                return null;
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, String url) {
                Uri u = Uri.parse(url);
                if ("laliga.local".equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) {}
                return true;
            }
            @Override public void onPageFinished(WebView v, String url) {
                // 예전 업데이트본에 뒤로가기 처리가 없을 때를 대비해 주입
                v.evaluateJavascript("if(typeof window.appBack==='undefined'){window.appBack=function(){try{if(document.getElementById('scrim')){if(typeof M!=='undefined'&&M&&M.paused&&!M.done)return true;closeSheet();return true}if(document.getElementById('match'))return true;if(typeof UI!=='undefined'&&typeof S!=='undefined'&&S&&UI.tab&&UI.tab!=='home'){UI.tab='home';render();return true}}catch(e){}return false}}", null);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams fp) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                try {
                    Intent it = new Intent(Intent.ACTION_GET_CONTENT);
                    it.addCategory(Intent.CATEGORY_OPENABLE);
                    it.setType("*/*");
                    startActivityForResult(Intent.createChooser(it, "저장 파일 선택"), REQ_OPEN);
                } catch (Exception e) { fileCb = null; return false; }
                return true;
            }
        });
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // 업데이트 안내 띠(아래)
        banner = new LinearLayout(this);
        banner.setOrientation(LinearLayout.HORIZONTAL);
        banner.setGravity(Gravity.CENTER_VERTICAL);
        banner.setBackgroundColor(Color.parseColor("#1B1E23"));
        int pad = (int) (12 * getResources().getDisplayMetrics().density);
        banner.setPadding(pad, pad, pad, pad);
        bannerText = new TextView(this);
        bannerText.setTextColor(Color.parseColor("#F2F3F5"));
        bannerText.setTextSize(14);
        banner.addView(bannerText, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        bLater = new Button(this); bLater.setText("나중에"); bLater.setAllCaps(false);
        bApply = new Button(this); bApply.setText("지금 적용"); bApply.setAllCaps(false);
        bApply.setBackgroundColor(Color.parseColor("#F5D547")); bApply.setTextColor(Color.parseColor("#0A0B0D"));
        banner.addView(bLater); banner.addView(bApply);
        bLater.setOnClickListener(new View.OnClickListener() { public void onClick(View x) { banner.setVisibility(View.GONE); } });
        bApply.setOnClickListener(new View.OnClickListener() { public void onClick(View x) { applyNow(); } });
        banner.setVisibility(View.GONE);
        FrameLayout.LayoutParams bl = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM);
        root.addView(banner, bl);
        setContentView(root);
        web.loadUrl(HOME);
    }

    @Override protected void onResume() {
        super.onResume();
        int pv = prefs.getInt("pend", 0);
        if (pv > curV() && pend().exists()) { showReady(pv); return; }
        long last = prefs.getLong("last", 0), now = System.currentTimeMillis();
        if (now - last >= CHECK_MS) check();
    }

    void showText(String t) { bannerText.setText(t); bApply.setVisibility(View.GONE); bLater.setVisibility(View.GONE); banner.setVisibility(View.VISIBLE); }
    void showReady(int v) { bannerText.setText("새 버전 v" + v + " 준비 완료"); bApply.setVisibility(View.VISIBLE); bLater.setVisibility(View.VISIBLE); banner.setVisibility(View.VISIBLE); }

    void check() {
        if (checking) return;
        checking = true;
        prefs.edit().putLong("last", System.currentTimeMillis()).apply();
        new Thread(new Runnable() { public void run() {
            try {
                String js = readText(RAW + "version.json?t=" + System.currentTimeMillis());
                final int v = new JSONObject(js).getInt("v");
                if (v > curV() && v != prefs.getInt("pend", 0)) {
                    ui.post(new Runnable() { public void run() { showText("새 버전 v" + v + " 받는 중…"); } });
                    download(RAW + "index.html?t=" + System.currentTimeMillis(), tmp());
                    if (tmp().length() > 200000 && tmp().renameTo(pend())) {
                        prefs.edit().putInt("pend", v).apply();
                        ui.post(new Runnable() { public void run() { showReady(v); } });
                    } else {
                        ui.post(new Runnable() { public void run() { showText("업데이트를 받지 못했습니다. 다음에 다시 시도합니다."); ui.postDelayed(new Runnable() { public void run() { banner.setVisibility(View.GONE); } }, 4000); } });
                    }
                }
            } catch (final Exception e) {
                ui.post(new Runnable() { public void run() { if (banner.getVisibility() == View.VISIBLE && bApply.getVisibility() != View.VISIBLE) { showText("업데이트 확인 실패(인터넷 연결 확인)"); ui.postDelayed(new Runnable() { public void run() { banner.setVisibility(View.GONE); } }, 4000); } } });
            } finally { checking = false; }
        } }).start();
    }

    void applyNow() {
        banner.setVisibility(View.GONE);
        web.evaluateJavascript("try{if(typeof save==='function')save()}catch(e){}", null);
        ui.postDelayed(new Runnable() { public void run() {
            int pv = prefs.getInt("pend", 0);
            if (pv > 0 && pend().exists()) {
                cur().delete();
                if (pend().renameTo(cur())) prefs.edit().putInt("cur", pv).putInt("pend", 0).apply();
            }
            web.clearCache(true);
            web.loadUrl(HOME);
        } }, 800);
    }

    static String readText(String u) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
        c.setConnectTimeout(15000); c.setReadTimeout(60000); c.setUseCaches(false);
        InputStream in = c.getInputStream();
        java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
        byte[] b = new byte[8192]; int n;
        while ((n = in.read(b)) > 0) bo.write(b, 0, n);
        in.close(); c.disconnect();
        return bo.toString("UTF-8");
    }
    static void download(String u, File f) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(u).openConnection();
        c.setConnectTimeout(15000); c.setReadTimeout(60000); c.setUseCaches(false);
        InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(f);
        byte[] b = new byte[65536]; int n;
        while ((n = in.read(b)) > 0) out.write(b, 0, n);
        out.close(); in.close(); c.disconnect();
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript("(window.appBack&&window.appBack())?'1':'0'", new ValueCallback<String>() {
            public void onReceiveValue(String r) { if (r == null || !r.contains("1")) moveTaskToBack(true); }
        });
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_OPEN) {
            if (fileCb != null) { fileCb.onReceiveValue((res == RESULT_OK && data != null && data.getData() != null) ? new Uri[]{data.getData()} : null); fileCb = null; }
        } else if (req == REQ_SAVE) {
            final String str = pendingSave; pendingSave = null;
            String msg = "저장 내보내기를 취소했습니다";
            if (res == RESULT_OK && data != null && data.getData() != null && str != null) {
                try { OutputStream o = getContentResolver().openOutputStream(data.getData()); o.write(str.getBytes("UTF-8")); o.close(); msg = "저장 파일을 내보냈습니다"; }
                catch (Exception e) { msg = "내보내기 실패: " + e.getMessage(); }
            }
            final String m = msg.replace("'", " ");
            web.evaluateJavascript("try{toast('" + m + "')}catch(e){}", null);
        }
    }

    class Bridge {
        @JavascriptInterface public String saveFile(final String name, final String str) {
            pendingSave = str;
            ui.post(new Runnable() { public void run() {
                try {
                    Intent it = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    it.addCategory(Intent.CATEGORY_OPENABLE);
                    it.setType("application/json");
                    it.putExtra(Intent.EXTRA_TITLE, name);
                    startActivityForResult(it, REQ_SAVE);
                } catch (Exception e) { pendingSave = null; }
            } });
            return "저장 위치를 고르세요";
        }
        @JavascriptInterface public int version() { return curV(); }
    }
}
