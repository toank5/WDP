# Account Page Redesign Notes

## Old vs New Layout

Old layout:
- Single flat list of mixed account actions.
- Weak hierarchy and low scanability.
- Primary account actions and app/support actions were not grouped.
- Logout was just a standard button and visually blended with normal options.

New layout:
- Profile summary header with avatar initials, full name, email, and Edit button.
- Settings-style grouped sections:
  - Shopping: Orders, Returns, Favorites
  - Account: Profile & Personal Info, Addresses, Security
  - App & Support: Notifications & Settings, Help / Contact Support, About / Legal
- Reusable settings row pattern: icon + title + subtitle + chevron.
- Dedicated warning-style logout row separated from regular actions.

## Renamed / Regrouped Items

Renamed for clarity:
- "Order history" -> "Orders"
- "Shipping address" -> "Addresses"
- "Help & Support" -> "Help / Contact Support"
- "About Us" -> "About / Legal"

Regrouping:
- Return access moved under Shopping section as "Returns".
- Notifications are now grouped with app settings under "Notifications & Settings".

## Existing Functions Preserved

All previously available account actions remain accessible:
- Profile settings
- Address management
- Favorites
- Order history
- Security settings
- Contact support
- About page
- Sign out

Note:
- Returns entry currently routes users to Orders, where return actions are initiated from order details.
