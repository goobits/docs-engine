# Upgrade Proposal: remark-directive v3 → v4

**Status:** Proposed
**Priority:** Medium
**Effort:** Small (1-2 hours)
**Breaking Changes:** Yes

## Summary

Upgrade `remark-directive` from v3.0.1 to v4.0.0 to stay current with the remark ecosystem.

## Current State

- **Current Version:** 3.0.1
- **Latest Version:** 4.0.0
- **Used By:**
  - `src/lib/plugins/reference.ts` - Symbol reference blocks (`:::reference`)
  - `src/lib/plugins/callouts.ts` - Note/warning blocks (`:::note`, `:::warning`)
  - Any custom directive-based plugins

## Breaking Changes in v4

Based on the remark-directive v4 release notes:

### 1. **ESM-Only Package**
- v4 is now pure ESM (no CommonJS support)
- **Impact:** ✅ No impact - we're already using ESM

### 2. **Updated Dependencies**
- Requires remark >= 14
- Requires micromark-extension-directive >= 3
- **Impact:** ⚠️ Need to verify remark version compatibility

### 3. **API Changes**
- Directive node structure may have changed
- `containerDirective`, `leafDirective`, `textDirective` types unchanged
- **Impact:** ✅ Likely minimal - standard directive types remain the same

## Required Changes

### Phase 1: Update Dependencies

```bash
# Update remark-directive
pnpm add remark-directive@^4.0.0

# Check if remark needs updating
pnpm list remark
```

### Phase 2: Test Directive Plugins

**Files to test:**

1. **`src/lib/plugins/reference.ts`**
   ```typescript
   // Test: :::reference Symbol blocks
   visit(tree, 'containerDirective', (node: any) => {
     if (node?.name === 'reference') {
       // Verify node structure still works
     }
   });
   ```

2. **`src/lib/plugins/callouts.ts`**
   ```typescript
   // Test: :::note, :::warning, :::info blocks
   visit(tree, 'containerDirective', (node: any) => {
     if (['note', 'warning', 'info', 'tip'].includes(node?.name)) {
       // Verify callout rendering still works
     }
   });
   ```

### Phase 3: Update Tests

**Test cases to verify:**

```markdown
<!-- Test 1: Reference blocks -->
:::reference RequestState
:::

<!-- Test 2: Callout blocks -->
:::note
This is a note
:::

:::warning
This is a warning
:::

<!-- Test 3: Nested directives -->
:::note
Some content with {@Symbol} references
:::
```

### Phase 4: Run Full Test Suite

```bash
# Unit tests
pnpm test:run

# Build test
pnpm build

# Integration test (if applicable)
pnpm dev
```

## Migration Plan

### Step 1: Create Test Branch
```bash
git checkout -b upgrade/remark-directive-v4
```

### Step 2: Update Package
```json
{
  "dependencies": {
    "remark-directive": "^4.0.0"
  }
}
```

### Step 3: Install and Test
```bash
pnpm install
pnpm test:run
pnpm build
```

### Step 4: Manual Testing
- Test reference blocks in documentation
- Test callout blocks
- Verify MDX rendering
- Check production build

### Step 5: Commit if Successful
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: upgrade remark-directive to v4.0.0"
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Node structure changes | Low | Medium | Comprehensive tests |
| Performance regression | Very Low | Low | Benchmark before/after |
| Build failures | Low | High | Test in branch first |
| Type errors | Low | Low | TypeScript will catch |

## Rollback Plan

If issues arise:

```bash
# Revert package.json
git checkout HEAD~1 package.json pnpm-lock.yaml

# Reinstall old version
pnpm install

# Verify working state
pnpm test:run && pnpm build
```

## Success Criteria

✅ All 88 tests passing
✅ Clean build with no errors
✅ Symbol references render correctly
✅ Callout blocks render correctly
✅ No type errors
✅ No runtime errors in dev mode

## Timeline

- **Investigation:** 15 minutes
- **Update & Test:** 30 minutes
- **Manual Verification:** 15 minutes
- **Total:** ~1 hour

## Alternative: Defer Update

**Option:** Stay on v3.0.1 until a critical security issue or required feature appears.

**Pros:**
- Zero risk
- No testing overhead
- v3 is stable and working

**Cons:**
- Fall behind ecosystem
- May accumulate technical debt
- Harder to upgrade later

**Recommendation:** Upgrade now while the gap is small (one major version). The testing overhead is minimal.

## Checklist

Before merging:
- [ ] Create test branch
- [ ] Update remark-directive to 4.0.0
- [ ] Run `pnpm install`
- [ ] Run `pnpm test:run` - all passing
- [ ] Run `pnpm build` - clean build
- [ ] Manual test: reference blocks
- [ ] Manual test: callout blocks
- [ ] Review changelog for any missed breaking changes
- [ ] Update this proposal with findings
- [ ] Commit and merge

## References

- [remark-directive GitHub](https://github.com/remarkjs/remark-directive)
- [remark-directive v4 Changelog](https://github.com/remarkjs/remark-directive/releases/tag/4.0.0)
- [remark Ecosystem](https://github.com/remarkjs/remark)
