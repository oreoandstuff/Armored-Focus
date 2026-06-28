// The only impure module in the functional core. Everything else takes ids as
// parameters (inject `genId` / pass ids in) so the rest of the core stays pure
// and deterministically testable. (SPEC §11)

export function generateId(): string {
	return Math.random().toString(36).slice(2, 11);
}
