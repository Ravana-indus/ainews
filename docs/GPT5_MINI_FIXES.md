# GPT-5-Mini Model Fixes

## Problem

The `gpt-5-mini` model has **very strict** parameter restrictions:
- ❌ **Temperature**: Not supported (only default value of `1`)
- ❌ **top_p**: Not supported
- ❌ **frequency_penalty**: Not supported
- ❌ **presence_penalty**: Not supported
- ✅ **max_completion_tokens**: Supported
- ✅ **messages**: Supported

## Errors Encountered

```
Error 1: Unsupported value: 'temperature' does not support 0.1 with this model.
Only the default (1) value is supported.

Error 2: Unsupported parameter: 'top_p' is not supported with this model.
```

## Solution Applied

Removed all unsupported parameters (`temperature` and `top_p`) from AI service calls across the codebase.

### Files Modified:

1. **`lib/ai/azure.ts`** ✅
   - Removed default `top_p: 0.95` from request body
   - Changed body construction to only include optional parameters if explicitly provided
   - Now only sends `messages` and `max_completion_tokens` by default

2. **`lib/ai/title.ts`** ✅
   - Removed `temperature: 0.1`
   - Added comment explaining gpt-5-mini limitation

3. **`lib/ai/classify.ts`** ✅
   - Removed `temperature: 0`
   - Added comment explaining gpt-5-mini limitation

4. **`lib/ai/bias.ts`** ✅
   - Removed `temperature: 0.2`
   - Added comment explaining gpt-5-mini limitation

5. **`lib/ai/summarize.ts`** ✅
   - Removed `temperature: 0.3` (line 76)
   - Removed `temperature: 0.2` (line 226)
   - Added comments explaining gpt-5-mini limitation

## Code Changes

### Before (❌ Incorrect):
```typescript
const response = await chatCompletion({
  messages: [...],
  temperature: 0.1,  // ❌ Not supported by gpt-5-mini
  top_p: 0.95,       // ❌ Not supported by gpt-5-mini
  max_completion_tokens: 60,
});
```

### After (✅ Correct):
```typescript
const response = await chatCompletion({
  messages: [...],
  // Note: gpt-5-mini only supports max_completion_tokens
  max_completion_tokens: 60,
});
```

## Azure.ts Default Handling

```typescript
// gpt-5-mini only supports max_completion_tokens
const body: any = {
  messages: request.messages,
  max_completion_tokens: request.max_completion_tokens ?? 2000,
};

// Only include optional parameters if explicitly requested (for models that support them)
if (request.temperature !== undefined) {
  body.temperature = request.temperature;
}
if (request.top_p !== undefined) {
  body.top_p = request.top_p;
}
```

This allows:
- ✅ gpt-5-mini to work with minimal parameters (only messages + max_completion_tokens)
- ✅ Other models to use custom parameters if needed in the future
- ✅ Graceful handling of unsupported parameters

## Impact on AI Quality

**Question**: Will removing temperature customization affect output quality?

**Answer**: Minimal impact expected because:
1. **Title Generation**: Previously used 0.1 (very deterministic)
   - Now uses 1.0 (more creative)
   - Effect: Slightly more variation in canonical titles (acceptable for news)

2. **Classification**: Previously used 0.0 (maximum determinism)
   - Now uses 1.0
   - Effect: May see slight variation in category assignments
   - Mitigation: Strong system prompts still guide behavior

3. **Bias Detection**: Previously used 0.2
   - Now uses 1.0
   - Effect: More nuanced bias analysis (could be beneficial)

4. **Summarization**: Previously used 0.3
   - Now uses 1.0
   - Effect: More natural, less formulaic summaries

## Testing Recommendations

After deploying, monitor:
1. **Title Quality**: Check if canonical titles are still neutral and factual
2. **Classification Consistency**: Verify categories remain appropriate
3. **Bias Scores**: Ensure lean scores (-2 to +2) are still reasonable
4. **Summary Quality**: Confirm summaries remain neutral and factual

## Alternative Solutions (Not Implemented)

### Option 1: Switch to Different Model
- Use `gpt-4o` or `gpt-4o-mini` which support custom temperature
- **Not chosen**: Would require Azure deployment changes

### Option 2: Use gpt-5-mini with Sampling
- Implement custom sampling logic client-side
- **Not chosen**: Overly complex for marginal benefit

### Option 3: Fall Back to Different Models Per Task
- Use gpt-5-mini for some tasks, gpt-4o for others
- **Not chosen**: Increases complexity and cost

## Verification

### Build Status: ✅ PASSED
```bash
npm run build
```

All 56 pages compiled successfully with no errors.

### Test the Pipeline
```bash
npm run dev
# Visit: http://localhost:3000/admin/sync
# Click "Run Complete Pipeline Now"
```

Expected: All 7 stages should complete without temperature errors.

## Summary

- ✅ All custom temperature parameters removed
- ✅ gpt-5-mini compatibility achieved
- ✅ Build passing
- ✅ Minimal expected impact on AI quality
- ✅ System prompts still provide strong guidance

---

**Status**: ✅ RESOLVED
**Build**: PASSING
**Ready for Testing**: YES
