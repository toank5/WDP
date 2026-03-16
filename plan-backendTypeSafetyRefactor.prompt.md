## Plan: Backend Type Safety Refactor

Backend-first is the right cut. The highest-value work is in the return flow, then revenue/order/review/favorite/VNPay. I did not implement changes in this pass; I researched the backend and saved the detailed handoff plan in `/memories/session/plan.md`.

**Steps**
1. Establish shared typing primitives for the backend. Reuse `AuthenticatedRequest` from [wdp-be/src/commons/types/express.types.ts](wdp-be/src/commons/types/express.types.ts) and standardize on Mongoose types such as `FilterQuery`, `UpdateQuery`, `PipelineStage[]`, and `Record<string, 1 | -1>` for dynamic query objects.
2. Refactor controller request typing first. Replace `@Request() req: any` in [wdp-be/src/controllers/return.controller.ts](wdp-be/src/controllers/return.controller.ts) with `AuthenticatedRequest`, and add safe extraction for `req.user?.id` / `req.user?._id`. Apply the same pattern to other backend controllers that still rely on untyped request access.
3. Refactor return service dynamic objects. In [wdp-be/src/services/return.service.ts](wdp-be/src/services/return.service.ts), replace `filter: any`, `sort: any`, `updateData: any`, and `dateFilter: any` with narrower Mongoose or local types, and guard nested reads like `order.history`, `order.items`, and `policy.config`.
4. Refactor revenue, order, and review services in parallel after step 1. In [wdp-be/src/services/revenue.service.ts](wdp-be/src/services/revenue.service.ts), replace `any`-typed match/pipeline objects with typed filters and aggregation stages. In [wdp-be/src/services/order.service.ts](wdp-be/src/services/order.service.ts), replace `baseQuery: any` and remove `dto.status as any`. In [wdp-be/src/services/review.service.ts](wdp-be/src/services/review.service.ts), replace dynamic query/sort `any` objects and guard `order.items`.
5. Fix populated-document null safety. In [wdp-be/src/services/favorite.service.ts](wdp-be/src/services/favorite.service.ts), define concrete local populated shapes for `productId` and `variantId`, guard deleted or partially populated documents, and default optional arrays safely.
6. Tighten VNPay callback typing. In [wdp-be/src/services/vnpay.service.ts](wdp-be/src/services/vnpay.service.ts), replace `Record<string, any>` callback input with a concrete callback shape or `Record<string, string | undefined>` plus narrowing, and add existence checks before using signature fields.
7. Review schema/DTO-level `any` and `unknown`. Revisit places like [wdp-be/src/commons/schemas/review.schema.ts](wdp-be/src/commons/schemas/review.schema.ts) after service typing is stabilized so schema changes do not ripple unpredictably into public behavior.
8. Verify and close out. Run backend typecheck and lint, then search `wdp-be/src` again for remaining `any` / `unknown` and confirm each remaining occurrence is intentional and validated.

**Relevant files**
- [wdp-be/src/commons/types/express.types.ts](wdp-be/src/commons/types/express.types.ts)
- [wdp-be/src/controllers/return.controller.ts](wdp-be/src/controllers/return.controller.ts)
- [wdp-be/src/services/return.service.ts](wdp-be/src/services/return.service.ts)
- [wdp-be/src/services/revenue.service.ts](wdp-be/src/services/revenue.service.ts)
- [wdp-be/src/services/order.service.ts](wdp-be/src/services/order.service.ts)
- [wdp-be/src/services/favorite.service.ts](wdp-be/src/services/favorite.service.ts)
- [wdp-be/src/services/review.service.ts](wdp-be/src/services/review.service.ts)
- [wdp-be/src/services/vnpay.service.ts](wdp-be/src/services/vnpay.service.ts)
- [wdp-be/src/commons/schemas/review.schema.ts](wdp-be/src/commons/schemas/review.schema.ts)

**Verification**
1. Run backend type checking for `wdp-be`.
2. Run backend linting for `wdp-be`.
3. Search `wdp-be/src` for remaining `any` / `unknown`.
4. Exercise return flows end to end, since they combine request typing, dynamic Mongoose objects, and nested null-sensitive access.
5. Exercise revenue/reporting, favorite/review, and VNPay callback paths with representative data.

**Decisions**
- Included: backend only for the first pass.
- Included: `any` replacement, `unknown` replacement where the concrete shape is locally provable, null/undefined safety, and safe default initialization where current logic already assumes presence.
- Excluded: FE, Mobile, and API redesigns.
- Important constraint: some `unknown` usages are external-input boundaries. The safe plan is to validate first, then narrow immediately, rather than force a concrete type too early and lose runtime safety.

If you want to proceed, approve this plan and hand it off to implementation.
