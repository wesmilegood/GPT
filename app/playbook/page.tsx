export const metadata = { title: "ROAS 5 攻略｜Meta 廣告 ROAS 儀表板" };

export default function Playbook() {
  return (
    <article className="max-w-3xl prose-tw">
      <h1>把 Meta 廣告 ROAS 做到 5 以上的實戰設定</h1>
      <p>
        先講結論：<strong>ROAS 5 不是靠「某個神奇設定」，而是四件事同時做對</strong>：
        轉換事件乾淨、活動結構簡單、素材夠多且輪替、預算往贏家集中。下面照順序做，每一步都有明確的檢查點。
      </p>

      <h2>0. 先算清楚你的 ROAS 門檻</h2>
      <ul>
        <li><strong>損益兩平 ROAS = 1 ÷ 毛利率。</strong>毛利率 50% → 2.0×；毛利率 30% → 3.3×。</li>
        <li>目標 ROAS 5 在毛利率 50% 的商品等於每 100 元廣告賺 150 元毛利；毛利率 30% 只賺 50 元。<strong>毛利率低於 25% 的商品，用廣告做到 ROAS 5 仍可能不划算，先調商品組合。</strong></li>
        <li>把這兩個數字填進「設定」頁，儀表板的紅線綠線才會準。</li>
      </ul>

      <h2>1. 追蹤：ROAS 算不準，其他都白做</h2>
      <ol>
        <li><strong>Pixel + Conversions API（CAPI）雙軌。</strong>只有 Pixel 的帳戶，iOS 使用者的購買會漏掉 20–40%，ROAS 會被系統性低估，連帶讓演算法學錯人。Shopline、Cyberbiz、Shopify 都有一鍵 CAPI。</li>
        <li><strong>事件管理工具 → 檢查「購買」事件的去重率與事件比對品質分數</strong>，目標 ≥ 6/10。低於 6 代表傳回的 email / 電話 / 外部 ID 不夠。</li>
        <li><strong>網域驗證 + 彙總事件評估排序</strong>：購買排第一，加入購物車第二。</li>
        <li>檢查點：Ads Manager 看到的購買數與後台訂單數差距 &lt; 15%（7 天點擊歸因）。</li>
      </ol>

      <h2>2. 活動結構：少即是多</h2>
      <p>多數 ROAS 上不去的帳戶問題是活動太多、預算太碎，每個活動都卡在學習階段。推薦結構：</p>
      <table>
        <thead><tr><th>活動</th><th>目標／設定</th><th>預算占比</th><th>目標 ROAS</th></tr></thead>
        <tbody>
          <tr><td>① Advantage+ 購物活動（ASC）</td><td>銷售 / 購買事件 / 最高數量或最高價值</td><td>50–60%</td><td>4–6×</td></tr>
          <tr><td>② 再行銷</td><td>銷售 / 購買事件 / 受眾：30 天網站訪客 + 加入購物車，排除 7 天購買者</td><td>15–20%</td><td>8–12×</td></tr>
          <tr><td>③ 拓新測試</td><td>銷售 / 購買事件 / 廣泛受眾（只設年齡、地區）或 Advantage+ 受眾</td><td>20–25%</td><td>2.5–4×（過門檻就搬進 ①）</td></tr>
          <tr><td>④ 目錄廣告（DPA）</td><td>目錄銷售 / 瀏覽過商品的人</td><td>5–10%</td><td>6–10×</td></tr>
        </tbody>
      </table>
      <ul>
        <li><strong>開 CBO（活動預算最佳化）</strong>，讓系統把錢分給表現好的廣告組，不要手動分。</li>
        <li>每個廣告組至少 <strong>6–10 則廣告</strong>，給系統足夠的素材可以輪替。</li>
        <li>流量、互動、觸及目標的活動 <strong>總預算不超過 10%</strong>。它們不會優化購買，ROAS 低是正常的，拿來做 ROAS 5 是緣木求魚。</li>
      </ul>

      <h2>3. 出價策略：先「最高數量」，穩定後再「最低 ROAS」</h2>
      <ol>
        <li>新活動一律用<strong>最高數量（Highest volume）</strong>，先讓系統累積轉換。</li>
        <li>當活動 <strong>每週穩定 ≥ 50 次購買</strong> 且 ROAS 已在目標附近，改成<strong>最低 ROAS（ROAS goal）</strong>，數值設為目標的 80%（目標 5 就設 4.0）。設太高會直接不花錢。</li>
        <li>客單價差異大的商品（有 500 元也有 5000 元）用<strong>最高價值（Highest value）</strong>，讓系統找會買貴的人。</li>
        <li>不要用成本上限（cost cap）追 ROAS，它控的是 CPA 不是價值。</li>
      </ol>

      <h2>4. 素材：ROAS 的 70% 來自素材</h2>
      <ul>
        <li><strong>每週補 3–5 組新素材</strong>到主力活動。素材壽命在台灣電商通常 2–4 週，頻率超過 3 就該換。</li>
        <li>每組素材用<strong>不同切角</strong>：痛點、使用情境、社會證明（評價截圖）、價格錨定、限時。</li>
        <li>影片開頭 3 秒要出現商品與主張；直式 9:16 一定要有，Reels 的 CPM 通常比動態消息低 20–40%。</li>
        <li>判斷標準：<strong>CTR（全部）≥ 1.5%、縮圖停留率（3 秒觀看 / 曝光）≥ 25%</strong>。CTR 低的素材 3 天內就關。</li>
        <li>開啟 Advantage+ 創意（自動加強、音樂、多版位裁切），通常能再降 5–10% CPA。</li>
      </ul>

      <h2>5. 落地頁與客單價：ROAS 的另一半</h2>
      <ul>
        <li><strong>連結點擊 → 落地頁瀏覽 ≥ 70%</strong>。低於這個數字代表頁面太慢，手機 3 秒內要開完。</li>
        <li><strong>加入購物車 → 購買 ≥ 15%</strong>。低於這個數字看運費門檻、付款方式（一定要有 LINE Pay／超商取付）、是否能一頁結帳。</li>
        <li><strong>客單價 +20% = ROAS 直接 +20%</strong>：組合價、第二件折扣、滿額免運門檻設在客單價的 1.3 倍。這是最被忽略卻最有效的槓桿。</li>
      </ul>

      <h2>6. 每天 10 分鐘的操作節奏</h2>
      <table>
        <thead><tr><th>情況</th><th>動作</th></tr></thead>
        <tbody>
          <tr><td>活動花費 &lt; 判斷門檻（3–5 倍 CPA）</td><td><strong>不要動</strong>。學習階段內改任何東西都會重置。</td></tr>
          <tr><td>ROAS ≥ 目標，頻率 &lt; 3</td><td>預算 +20%，3 天看一次。掉超過 20% 就退回。</td></tr>
          <tr><td>ROAS ≥ 目標，頻率 ≥ 3</td><td>先擴受眾／排除已購買者，再加碼。</td></tr>
          <tr><td>損益兩平 &lt; ROAS &lt; 目標</td><td>預算不動，換素材、改落地頁、拉客單價。</td></tr>
          <tr><td>ROAS &lt; 損益兩平，CTR 低</td><td>換素材測 3 天，仍低就暫停。</td></tr>
          <tr><td>ROAS &lt; 損益兩平，CTR 正常</td><td>問題在落地頁或價格，暫停廣告先修頁面。</td></tr>
          <tr><td>近 7 天 ROAS 比前 7 天掉 20%</td><td>素材疲乏，整批換；檢查是否撞到大檔期 CPM 上漲。</td></tr>
        </tbody>
      </table>
      <p>
        把這張表設成 Ads Manager 的<strong>自動規則</strong>：「ROAS 7 天 &lt; 損益兩平 且 花費 &gt; 門檻 → 暫停」、「ROAS 3 天 ≥ 目標 → 預算 +20%，每 72 小時最多一次」。儀表板上的建議就是照這套邏輯算的。
      </p>

      <h2>7. 常見錯誤</h2>
      <ul>
        <li>每天改預算、改受眾 → 永遠在學習階段。</li>
        <li>看 1 天的 ROAS 做決定 → 看 7 天滾動。</li>
        <li>興趣受眾疊 10 層 → CPM 爆高。2024 之後廣泛受眾＋好素材幾乎都贏細分受眾。</li>
        <li>只看 ROAS 不看毛利 → ROAS 5 但毛利 20% 還是賠錢。</li>
        <li>沒做再行銷 → 平白放掉 ROAS 最高的那一塊。</li>
      </ul>

      <h2>8. 用 MCP 讓 Claude 直接幫你看帳戶</h2>
      <p>
        在 claude.ai 的「設定 → 連接器」加入 Meta Ads 連接器並用 Facebook 帳號授權後，就能直接用自然語言問：「近 30 天哪個活動 ROAS 最低？」「把拓新活動的預算降 30%」。
        完整步驟與權限說明見專案內的 <code>docs/meta-mcp-setup.md</code>。
      </p>
    </article>
  );
}
