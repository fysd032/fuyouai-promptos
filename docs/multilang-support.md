# Multi-Language Support for /api/core/run

## Overview

The core framework endpoint `/api/core/run` supports automatic language mirroring: the AI output language matches the user's input language.

## How It Works

```
User Input (any language)
  │
  ▼
Frontend: detectLanguage(userInput)        ← CoreFrameworkPage.tsx
  │  returns "zh" / "en" / "fr" / "ja" / ...
  ▼
Frontend: systemOverrideTemplates[lang]    ← language-specific system prompt
  │
  ▼
callCoreFramework({ systemOverride })      ← coreframework-api.ts
  │  POST /api/core/run  { systemOverride: "..." }
  ▼
route.ts: reads body.systemOverride        ← fallback: LANGUAGE_GUARD
  │
  ▼
runEngine({ systemOverride })              ← run-engine.ts
  │
  ▼
runPromptModule(key, input, engine, systemOverride)  ← engine.ts
  │
  ├─ DeepSeek: messages[0].role = "system", content = systemOverride
  └─ Gemini:   prompt = systemOverride + "\n\n" + prompt
```

## Supported Languages

| Code | Language   | Detection Method                        |
|------|------------|-----------------------------------------|
| zh   | Chinese    | Unicode range `\u4e00-\u9fa5`           |
| ja   | Japanese   | Hiragana/Katakana `\u3040-\u30ff`       |
| ko   | Korean     | Hangul `\uac00-\ud7af`                  |
| ru   | Russian    | Cyrillic `\u0400-\u04ff`                |
| ar   | Arabic     | Arabic script `\u0600-\u06ff`           |
| de   | German     | Special chars `äöüß` + common words     |
| fr   | French     | Special chars `àâçéè...` + common words |
| es   | Spanish    | `¿¡` + special chars + common words     |
| pt   | Portuguese | `ãõç` + common words                   |
| it   | Italian    | `àèéìòù` + common words                |
| en   | English    | Default fallback                        |

## Files Modified

### Frontend (`fuyouai-frontend`)

| File | Change |
|------|--------|
| `src/pages/CoreFrameworkPage.tsx` | Added `detectLanguage()`, `systemOverrideTemplates`, passes `systemOverride` to API call |
| `src/lib/coreframework-api.ts` | Added `systemOverride?` to `CoreFrameworkArgs` type, included in request body |

### Backend (`fuyouai-projects`)

| File | Change |
|------|--------|
| `app/api/core/run/route.ts` | Reads `body.systemOverride`, falls back to `LANGUAGE_GUARD` |
| `lib/promptos/run-engine.ts` | Accepts `systemOverride?` param, passes to `runPromptModule` |
| `lib/promptos/engine.ts` | `runPromptModule` / legacy / v2 all accept `systemOverride?`, use as system message |
| `lib/llm/provider.ts` | `RunLLMInput` accepts `systemOverride?`, used in DeepSeek system message and Gemini prompt prefix |

## Fallback Behavior

- Frontend sends a language-specific `systemOverride` (e.g., "Respond in French")
- If frontend does NOT send `systemOverride`, backend falls back to `LANGUAGE_GUARD` (generic language mirroring rule)
- If neither is available, the hardcoded default `"You are a professional AI assistant."` is used

## Debugging

Open browser Console and look for:
```
=== DEBUG START ===
userInput: <what user typed>
detectedLang: fr
systemOverride: Vous êtes un assistant IA professionnel...
=== DEBUG END ===
📤 Calling API with params: { coreKey, tier, userInput, engineType, systemOverride }
```

In Network tab, the POST body to `/api/core/run` should contain the `systemOverride` field.
