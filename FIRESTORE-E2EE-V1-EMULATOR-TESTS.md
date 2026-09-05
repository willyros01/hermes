# FIDUNIO Firestore E2EE v1 — Emulator Validation Gate

**STATUS: ACTIVE REPOSITORY SECURITY GATE — EXACT `firestore.rules` SOURCE**

The account identity manager has passed its isolated iPad Safari gate. The Firestore Security Rules gate now loads the exact repository `firestore.rules` file directly into the Firebase Local Emulator Suite. There is no candidate/staged transform between the repository rule source and the emulator test.

Repository validation is not the same as live Firebase deployment. The live project must not be changed until the explicit production handoff is authorized.

## Deterministic test identities

- `ownerA`: authenticated, enrolled, active FIDUNIO user.
- `ownerB`: authenticated, enrolled, active FIDUNIO user.
- `disabled`: authenticated but inactive/suspended profile.
- `anon`: unauthenticated.

Use emulator-only documents. The suite uses demo project ID `demo-fidunio-e2ee-rules`. Never point this suite at production.

## Current 42-assertion matrix

### Private `users/{uid}/e2ee/identity`

1. anon read denied
2. other-user read denied
3. valid owner create allowed
4. owner read allowed
5. disabled owner read denied
6. collection list denied
7. delete denied
8. keyId update denied
9. recovery wrapper update denied
10. exact normal rewrap with revision +1 allowed
11. revision jump denied
12. unexpected plaintext field denied
13. wrong KDF denied
14. wrong wrapper version denied
15. wrong key algorithm denied
16. wrong state denied
17. revision zero create denied
18. client-created timestamp denied

### Public `e2eePublicKeys/{uid}`

19. owner exact public create allowed
20. registered correspondent read allowed
21. registered list allowed
22. anon read denied
23. disabled read denied
24. update denied
25. delete denied
26. cross-user create denied
27. private JWK `d` denied
28. unexpected public field denied
29. wrong curve denied
30. client-created timestamp denied

### Atomic create / partial-state behavior

31. invalid public record leaves no private residue
32. invalid private record leaves no public residue
33. valid private + public atomic create allowed
34. duplicate private create denied

### Existing-rule regression

35. invitation get behavior preserved
36. registered profile read behavior preserved
37. direct conversation create behavior preserved
38. direct message create behavior preserved
39. legacy device create behavior preserved until migration removal stage
40. group create behavior preserved

### Exact-schema regressions

41. generic recovery `metadata` is rejected
42. public JWK `ext` / `key_ops` are rejected

## Exact-source rule

`firestore-e2ee-v1.rules.test.mjs` must load:

```text
./firestore.rules
```

directly with `readFileSync`. A future change that reintroduces a candidate transform as the tested source is a security regression.

## Pass condition

The gate must end with:

```text
42/42 assertions passed.
```

The rebuild CI runs the same gate through:

```text
npm run emulator:test:e2ee-rules
```

using Firebase Local Emulator Suite and Java/Node in GitHub Actions.

## Production rule

Passing the emulator gate proves only repository rule behavior. It does **not** mean `firestore.rules` has been deployed to the live Firebase project.

Do not weaken unrelated rules to make this suite pass. Do not add a broad wildcard allow. Do not deploy a test rule set. Any live deployment must follow the later controlled Firebase project handoff.
