# Frontend styles

Styles are grouped by feature so components do not accumulate page-specific CSS:

- `base/` contains application-wide CSS and Tailwind directives.
- `auth/` contains one entry stylesheet for each authentication page and a shared stylesheet for common controls.
- `customer/` contains styles used by the customer dashboard and its child UI components.

For a new feature, add its stylesheet in the matching feature folder and import it from the route or component that owns it. Use a feature prefix (for example, `auth-` or `vendor-`) for plain CSS class names to prevent cross-page selector collisions. Keep data-dependent values, such as chart widths or map coordinates, inline because they are runtime values rather than static styles.
