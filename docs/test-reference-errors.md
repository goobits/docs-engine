# Test Symbol Reference Errors

This page tests the graceful error handling for unresolved symbol references.

## Inline References

Here are some symbol references that should show warning badges:

The {@InvalidSymbol} type doesn't exist and should show a red warning badge.

Another test with {@WorkflowState} which should also fail to resolve (0 matches).

Multiple in one paragraph: {@Foo}, {@Bar}, and {@Baz} should all show warnings.

## Table Test

| Symbol | Status |
|--------|--------|
| {@TestSymbol} | Should show error |
| {@AnotherBadRef} | Should show error |

## List Test

- {@ListItem1} - First test
- {@ListItem2} - Second test
- {@ListItem3} - Third test

## Block Reference Test

:::reference InvalidBlockSymbol
:::

This should render a red warning block instead of crashing the page.
