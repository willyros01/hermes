# FIDUNIO Firestore E2EE v1 — Emulator Validation Gate

**STATUS: REQUIRED BEFORE PRODUCTION RULE MERGE**

The account identity manager passed its isolated iPad Safari gate. The next trust boundary is Firestore Security Rules. Production `firestore.rules` MUST NOT receive the new account-E2EE paths until these tests pass against the Firebase Local Emulator Suite.

## Deterministic test identities

- `ownerA`: authenticated, enrolled, active FIDUNIO user.
- `ownerB`: authenticated, enrolled, active FIDUNIO user.
- `disabled`: authenticated but inactive/suspended profile.
- `anon`: unauthenticated.

Use emulator-only documents. Never point this suite at production.

## Required assertions

### Private `users/{uid}/e2ee/identity`

1. anon GET ownerA -> DENY
2. ownerA GET own -> ALLOW
3. ownerB GET ownerA -> DENY
4. disabled GET own -> DENY
5. ownerA LIST `/users/ownerA/e2ee` -> DENY
6. ownerA CREATE exact valid revision-1 identity -> ALLOW
7. ownerB CREATE under ownerA -> DENY
8. ownerA CREATE unexpected field -> DENY
9. ownerA CREATE plaintext `password`, `pin`, `privateKey` or `recoveryUnlockKey` field -> DENY
10. wrong schema/identity/wrapper version -> DENY
11. wrong key algorithm -> DENY
12. wrong KDF/iterations/wrapping algorithm -> DENY
13. ownerA normal-wrapper UPDATE with exact revision +1 and timestamp -> ALLOW
14. same update without revision increment -> DENY
15. revision jump >1 -> DENY
16. update keyId -> DENY
17. update recoveryWrapper -> DENY
18. update state -> DENY
19. update createdAt -> DENY
20. DELETE -> DENY

### Public `e2eePublicKeys/{uid}`

21. registered ownerA GET ownerB public key -> ALLOW
22. registered ownerA LIST public keys -> ALLOW (deliberate v1 correspondent lookup)
23. anon read -> DENY
24. disabled read -> DENY
25. ownerA CREATE own exact public record -> ALLOW
26. ownerB CREATE ownerA record -> DENY
27. public JWK with `d` -> DENY
28. public record unexpected field -> DENY
29. public UPDATE -> DENY
30. public DELETE -> DENY

### Atomic create / partial-state behavior

31. batch/transaction creating valid private + public records -> ALLOW
32. invalid private record causes whole atomic create -> DENY / no public residue
33. invalid public record causes whole atomic create -> DENY / no private residue
34. pre-existing private OR public half-state makes adapter create fail closed; no automatic repair/replacement.

### Existing-rule regression

35. invitation tests unchanged
36. profile/role lifecycle tests unchanged
37. direct conversation membership tests unchanged
38. message create/receipt tests unchanged
39. group/member tests unchanged
40. legacy device rules unchanged until migration removal stage

## Merge rule

Only after 1–40 pass may the bounded helpers and matches from `FIRESTORE-E2EE-V1-RULES.md` be inserted into production `firestore.rules`.

Do not weaken unrelated rules to make this suite pass. Do not add a broad wildcard allow. Do not deploy a test rule set.
