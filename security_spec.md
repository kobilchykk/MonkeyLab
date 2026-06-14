# Security Specification - Monkey LAB

## Data Invariants
- A user must have a valid role (admin, manager, master).
- An order must belong to an existing client.
- An order item must belong to an existing order and reference a valid inventory item.
- Only admins can change user roles.
- Masters can only update orders assigned to them.
- Inventory quantities cannot be negative.

## The Dirty Dozen Payloads (Denial Tests)
1. Create user with role "admin" (by non-admin).
2. Update order status to "Done" by a manager who is not assigned (if strict assignment enforced).
3. Create order with someone else's UID as author (if authorship tracked).
4. Delete client record by a Master.
5. Update inventory price by a Manager (if restricted to Admin).
6. Inject 2MB string into device model field.
7. Create order item without corresponding inventory decrement (atomic batch test).
8. Read client PII (email/address) as an unauthorized Master.
9. Change order clientId to a different client ID after creation.
10. Set order status to "Delivered" without it being "Done" (state logic).
11. Add a field "vulnerable: true" to an order update.
12. Create a client with a 10KB name string.

## Red Team Status
- [ ] Identity Spoofing Protected
- [ ] State Shortcutting Protected
- [ ] Resource Poisoning Protected
- [ ] Ghost Field Injection Protected
