# 🚀 FuyouAI 上线检查清单

## ⏱️ 预计时间：20分钟

---

## 📋 第一步：Vercel 环境变量配置（5分钟）

**操作步骤**：
1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 **Settings** → **Environment Variables**
4. 确保选择 **Production** 环境
5. 参考 `.env.production.example` 逐一添加环境变量

### ✅ 必须设置的变量（共11个）

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ 敏感
- [ ] `DEEPSEEK_API_KEY` ⚠️ 敏感
- [ ] `CREEM_API_KEY` ⚠️ 敏感
- [ ] `CREEM_ENV` = `live` ⚠️ 必须是 live
- [ ] `CREEM_PRODUCT_ID_BASIC`
- [ ] `CREEM_PRODUCT_ID_PRO`
- [ ] `CREEM_PRODUCT_ID_STARTER`
- [ ] `CREEM_WEBHOOK_SECRET_LIVE` ⚠️ 敏感

### ✅ 推荐设置的变量（共4个）

- [ ] `UPSTASH_REDIS_REST_URL` （提升性能）
- [ ] `UPSTASH_REDIS_REST_TOKEN` （提升性能）
- [ ] `BILLING_ENABLED` = `1`
- [ ] `APP_URL` = `https://fuyouai.com`

### ❌ 绝对不能设置的变量

- [ ] 确认 **没有** `NEXT_PUBLIC_DEV_MODE`（否则绕过所有权限）
- [ ] 确认 **没有** `NEXT_PUBLIC_INVITE_ENABLED=false`（否则开放给所有人）

---

## 📋 第二步：Supabase 数据库初始化（5分钟）

**操作步骤**：
1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 点击 **SQL Editor** → **New query**
4. 复制 `database/init-production.sql` 的全部内容
5. 粘贴并点击 **Run**

### ✅ 验证表已创建

运行以下查询：

```sql
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'invite_codes',
    'invite_code_usage',
    'user_entitlements',
    'subscriptions',
    'creem_webhook_events'
  )
ORDER BY table_name;
```

**预期结果**：应该看到 5 个表

- [ ] `creem_webhook_events` (3列)
- [ ] `invite_code_usage` (5列)
- [ ] `invite_codes` (6列)
- [ ] `subscriptions` (11列)
- [ ] `user_entitlements` (4列)

### ✅ 检查初始邀请码

```sql
SELECT code, max_uses, used_count, active, channel FROM invite_codes;
```

**预期结果**：应该看到 3 个邀请码

- [ ] `FUYOU-BETA01` (100, official)
- [ ] `FUYOU-REDDIT` (50, reddit)
- [ ] `FUYOU-PH2025` (200, producthunt)

**可选**：修改或添加自己的邀请码

```sql
-- 添加新邀请码
INSERT INTO invite_codes (code, max_uses, channel) VALUES
  ('YOUR-LAUNCH-2025', 500, 'launch')
ON CONFLICT (code) DO NOTHING;
```

---

## 📋 第三步：Creem Payment 配置（3分钟）

**操作步骤**：
1. 登录 Creem Dashboard
2. 进入 **Webhooks** 设置
3. 点击 **Add endpoint**
4. 填写以下信息：

### ✅ Webhook 配置

- [ ] **URL**: `https://fuyouai.com/api/webhook/creem`
- [ ] **Environment**: `Production`
- [ ] **Events** 订阅以下所有事件：
  - [ ] `checkout.completed`
  - [ ] `subscription.created`
  - [ ] `subscription.active`
  - [ ] `subscription.paid`
  - [ ] `subscription.update`
  - [ ] `subscription.scheduled_cancel`
  - [ ] `subscription.canceled`
  - [ ] `subscription.expired`
  - [ ] `charge.refunded`
  - [ ] `refund.created`

5. 保存后复制 **Webhook Secret**
6. 将 secret 添加到 Vercel 环境变量 `CREEM_WEBHOOK_SECRET_LIVE`
7. 在 Vercel 重新部署（触发环境变量生效）

---

## 📋 第四步：功能验证（5分钟）

### ✅ 1. 网站可访问性

- [ ] 访问 `https://fuyouai.com`
- [ ] 首页正常加载
- [ ] 点击 "Get Started" 跳转到登录页

### ✅ 2. 邀请码流程

- [ ] 访问 `https://fuyouai.com/modules/core?invite=FUYOU-BETA01`
- [ ] 未登录 → 显示 "Sign In Required"
- [ ] 点击 Sign In → 跳转到 `/login`
- [ ] 输入邮箱 → 收到验证码
- [ ] 输入验证码 → 自动跳回 `/modules/core`
- [ ] 邀请码自动填充并提交
- [ ] 成功进入 Core Methodologies 页面

### ✅ 3. Core 模块功能

- [ ] 选择任意引擎（如 Task Decomposition）
- [ ] 测试文件上传：
  - [ ] 点击 Upload 按钮
  - [ ] 上传 .txt 或 .md 文件
  - [ ] 文件显示在附件列表
  - [ ] 点击附件名称 → 预览内容正确
- [ ] 测试语音输入（Chrome/Edge）：
  - [ ] 点击 Voice Input 按钮
  - [ ] 说话 → 文字实时显示
  - [ ] 点击 Stop → 文字保留在输入框
- [ ] 输入需求 → 点击 "Generate Prompt and Run"
- [ ] AI 输出正常显示

### ✅ 4. Universal 模块功能

- [ ] 访问 `/modules/general`
- [ ] 选择任意模块运行
- [ ] 确认输出正常

### ✅ 5. Webhook 端点

```bash
# 测试 webhook 端点可访问
curl https://fuyouai.com/api/webhook/creem
```

**预期返回**：
```json
{"ok":true,"message":"creem webhook endpoint alive"}
```

- [ ] ✅ Webhook 端点可访问

### ✅ 6. 付费流程（可选，建议测试）

- [ ] 访问 `/pricing`
- [ ] 点击 "Subscribe to Basic"
- [ ] 跳转到 Creem 支付页面
- [ ] 使用测试卡完成支付（如果 Creem 支持测试模式）
- [ ] 支付成功后检查 Supabase `subscriptions` 表
- [ ] 确认 webhook 收到事件（查看 Vercel Logs）

---

## 📋 第五步：试用期过期测试（可选）

### ✅ 验证15天试用逻辑

手动设置邀请码使用时间为16天前：

```sql
-- 找到测试用户的 usage 记录
SELECT * FROM invite_code_usage WHERE user_id = 'your-test-user-id';

-- 设置为16天前
UPDATE invite_code_usage
SET used_at = NOW() - INTERVAL '16 days'
WHERE user_id = 'your-test-user-id';
```

然后：
- [ ] 注销并重新登录
- [ ] 访问 `/modules/core`
- [ ] 应该看到 "Trial Expired" 页面
- [ ] 点击 "Upgrade Now" → 跳转到 `/pricing`

**测试完成后恢复**：

```sql
UPDATE invite_code_usage
SET used_at = NOW()
WHERE user_id = 'your-test-user-id';
```

---

## 📋 第六步：监控和日志（2分钟）

### ✅ 1. Vercel 部署日志

- [ ] 访问 Vercel Dashboard → Deployments
- [ ] 检查最新部署状态 = **Ready**
- [ ] 点击部署 → 查看 Build Logs
- [ ] 确认没有错误

### ✅ 2. Function 日志

- [ ] Vercel Dashboard → Functions
- [ ] 查看 `/api/webhook/creem` 日志
- [ ] 查看 `/api/core/run` 日志
- [ ] 确认关键日志正常输出

### ✅ 3. Supabase 日志

- [ ] Supabase Dashboard → Logs
- [ ] 查看 API 请求日志
- [ ] 确认没有异常错误

---

## 🎯 最终检查

### ✅ 安全性

- [ ] Vercel 环境变量中没有 `NEXT_PUBLIC_DEV_MODE`
- [ ] `CREEM_ENV=live`（不是 test）
- [ ] 所有敏感密钥已正确设置
- [ ] API keys 没有暴露在前端代码中

### ✅ 功能性

- [ ] 邀请码系统工作正常
- [ ] 15天试用逻辑正确
- [ ] Core 模块文件上传可用
- [ ] Core 模块语音输入可用
- [ ] Universal 模块运行正常
- [ ] Webhook 端点可访问

### ✅ 性能

- [ ] Redis 缓存已配置（可选）
- [ ] API 响应速度正常（< 2秒）
- [ ] 页面加载速度正常（< 3秒）

### ✅ 用户体验

- [ ] 移动端访问正常
- [ ] 错误提示清晰
- [ ] 登录流程顺畅
- [ ] 过期提示友好

---

## ✅ 上线完成！

恭喜！你的 FuyouAI 平台已成功上线 🎉

### 📊 后续监控

建议定期检查：
1. **Vercel 使用量**：Functions 调用次数、带宽
2. **Supabase 使用量**：数据库大小、API 请求数
3. **Redis 使用量**（如果启用）：缓存命中率
4. **Creem Dashboard**：订阅数量、支付成功率
5. **用户反馈**：通过邀请码渠道收集

### 🔧 常见问题

**Q: 用户报告无法访问模块**
- 检查邀请码是否过期（15天）
- 检查 Supabase `invite_code_usage` 表
- 检查 Redis 缓存是否正常

**Q: Webhook 未收到事件**
- 检查 Creem Dashboard webhook 配置
- 检查 Vercel Function 日志
- 确认 `CREEM_WEBHOOK_SECRET_LIVE` 正确

**Q: 支付后订阅未激活**
- 检查 `subscriptions` 表数据
- 检查 `creem_webhook_events` 表（是否有重复事件）
- 查看 Vercel `/api/webhook/creem` 日志

---

**文档版本**: 1.0
**更新时间**: 2025-01-21
**维护者**: FuyouAI Team
