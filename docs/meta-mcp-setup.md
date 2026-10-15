# Meta 廣告怎麼串 MCP

MCP（Model Context Protocol）是讓 Claude 直接呼叫外部系統的標準介面。Meta 在 2026 年 4 月推出官方的 **Meta Ads MCP**，由 Meta 自己託管，你不需要架任何伺服器。

## 一、在 claude.ai（網頁 / App / Claude Code 雲端）串接

1. 打開 claude.ai → 右上角頭像 → **設定（Settings）** → **連接器（Connectors）**。
2. 點 **新增自訂連接器（Add custom connector）**，貼上官方網址：

   ```
   https://mcp.facebook.com/ads
   ```

3. 按「連接」後會跳出 Facebook 的授權視窗。**用對廣告帳戶有管理員權限的 Facebook 帳號登入**。
4. 授權時會列出要求的權限：
   - `ads_read`：讀成效、活動、受眾（看儀表板用這個就夠）
   - `business_management`：讀商業管理平台下的帳戶與目錄
   - `ads_management`：**可以改預算、開關活動、建廣告**。只有你真的要讓 Claude 動手改才勾。
5. 回到對話，問 Claude「列出我的廣告帳戶」。如果看到帳戶清單就串好了。

> 目前這個 session 已經串好了。你的 Meta 帳號底下有 10 個廣告帳戶，其中「威斯邁 Wesmile」被 Meta 標記為異常活動並停用，「優兔數位_BM6_FB_SO_來來來_好漢草」尚未開放 Ads MCP（Meta 分批開放中），其餘 8 個都可以查詢。

## 二、在 Claude Code（本機終端機）串接

```bash
claude mcp add --transport http meta-ads https://mcp.facebook.com/ads
```

第一次使用時會開瀏覽器做 OAuth 授權，之後就在任何專案都能用 `/mcp` 看到 `meta-ads` 的工具。

## 三、常見狀況

| 狀況 | 原因與做法 |
|---|---|
| 連接器加好了但 Claude 說工具被停用 | Meta 分批開放中，帳戶還沒被納入。過幾天再試，或換另一個廣告帳戶。 |
| 某個帳戶 `is_queryable = false` | 帳戶被 Meta 停用或有待處理的付款／安全驗證。去 Ads Manager 的「帳戶品質」處理。 |
| 授權時找不到廣告帳戶 | 登入的 Facebook 帳號沒有該帳戶的管理員權限。到商業管理平台 → 使用者 → 指派權限。 |
| 想限制 Claude 只能讀不能寫 | 授權時不要勾 `ads_management`。注意：OAuth 授權是帳號層級的，一旦給了寫入權限，所有對話都能寫。 |
| 看到 `meta-ads.mcp.pipeboard.co` 之類的網址 | 那是第三方社群版，和官方不同，授權模式也不同。要用官方就只貼 `mcp.facebook.com/ads`。 |

## 四、官方 MCP 能做什麼（工具分類）

- **帳戶**：列出廣告帳戶、粉絲專頁、IG 帳號
- **活動**：讀取／建立／修改活動、廣告組、廣告、素材；開關、改預算
- **成效**：帳戶／活動／廣告組／廣告層級指標，支援分組（年齡、版位、日期）、篩選、排序、產業基準、異常偵測
- **資料集**：Pixel / 資料集的事件設定與品質
- **目錄**：商品目錄、商品組、動態廣告健康度
- **實驗**：A/B 測試、成效提升測試

## 五、這個網站和 MCP 的關係

MCP 是給 Claude 用的；這個網站用的是同一套 **Meta Marketing API**（Graph API），但是用你自己產生的存取權杖直接呼叫，不經過 Claude。兩者可以並存：

- 平常看數字、看建議 → 用網站（不花 Claude 的額度）
- 要改預算、問複雜問題 → 在 Claude 裡用 MCP

### 網站用的存取權杖怎麼產生

1. 商業管理平台 → **商家設定 → 使用者 → 系統用戶** → 新增（角色選「管理員」或「員工」）。
2. 指派資產：把要看的廣告帳戶加給這個系統用戶，權限至少「查看成效」。
3. **產生權杖** → 選你的應用程式（沒有就到 developers.facebook.com 建一個「商業」類型的應用程式）→ 勾 `ads_read`（要改廣告就再勾 `ads_management`）→ 有效期限選「永不過期」。
4. 把權杖貼到網站「設定」頁，或寫進 `.env.local` 的 `META_ACCESS_TOKEN`。
