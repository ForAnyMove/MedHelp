# Managers — Naming & Pattern Convention

This document defines the two patterns used for data managers in this codebase.
Following the convention keeps components predictable and makes future Supabase migration straightforward.

---

## Pattern A — React Hooks (`useXxxManager`)

**Use when:** the manager owns React state that is rendered directly by components.

| Manager | Hook name | Owns state |
|---|---|---|
| `userManager.js` | `userManager()` | `user`, `initials` |
| `doctorManager.js` | `doctorManager()` | doctor list, filters |
| `consultationManager.js` | `consultationManager()` | booking state |
| `historyManager.js` | `historyManager()` | metrics, timeline, vitamins |
| `themeManager.js` | `themeManager()` | dark mode toggle, sizes |

**Rules:**
- Named as a plain function (lowercase). Called via `useComponentContext()` or directly within a component.
- Returns state values + updater functions.
- **Must not** contain async data-fetching directly — delegate to a Class manager or use `useEffect` + `useState`.

---

## Pattern B — Singleton Classes (`XxxManager`)

**Use when:** the manager makes async requests and returns data — no React state inside.

| File | Export | Responsibility |
|---|---|---|
| `transactionManager.js` | `transactionManager` | Balance, payouts, history |
| `myDoctorProfileManager.js` | `myDoctorProfileManager` | Doctor profile + upcoming consultations |

**Rules:**
- Named as a PascalCase class, exported as a singleton instance (camelCase).
- All methods are `async` and `return` data — no `useState` inside.
- Components call these in `useEffect` and store results in local state.

---

## Migration Path to Supabase

Replace the mock logic inside each manager method with a real `supabase.*` call:

```js
// Before (mock)
async getBalanceInfo() {
  await new Promise(resolve => setTimeout(resolve, 800));
  return { availablePayout: 360 };
}

// After (Supabase)
async getBalanceInfo() {
  const { data, error } = await supabase
    .from('balances')
    .select('available_payout')
    .eq('doctor_id', session.userId)
    .single();
  if (error) throw error;
  return { availablePayout: data.available_payout };
}
```

No component changes needed — the interface stays the same.
