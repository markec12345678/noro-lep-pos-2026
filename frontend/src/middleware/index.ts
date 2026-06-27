/**
 * Role-Based Access Control (RBAC) middleware
 *
 * Routes that each role is RESTRICTED from accessing.
 * A route in the restricted list means the role CANNOT access it.
 */

// Waiters can only use POS + Tables. They cannot manage menus, kitchen, etc.
export const waiterRestrictedRoutes = [
  "/menus",
  "/kitchen",
  "/categories",
  "/orders",
  "/reports",
];

// Chefs can use Kitchen + Tables, but cannot see orders management or reports.
export const chefRestrictedRoutes = ["/orders", "/reports"];

/**
 * Returns TRUE if the given role is RESTRICTED from accessing the pathname.
 *
 * Usage:
 *   if (isRouteRestricted(user.role, pathname)) {
 *     navigate("/"); // redirect away
 *   }
 */
export const isRouteRestricted = (
  role: string | undefined,
  pathname: string,
): boolean => {
  if (!role) return false;

  if (role === "waiter") {
    return waiterRestrictedRoutes.includes(pathname);
  }

  if (role === "chef") {
    return chefRestrictedRoutes.includes(pathname);
  }

  // manager / admin / unknown role -> no restrictions
  return false;
};

/**
 * Convenience wrapper: returns TRUE if the role is ALLOWED to access the pathname.
 * Kept for backward compatibility with existing call sites.
 */
export const canAccess = (
  role: string | undefined,
  pathname: string,
): boolean => {
  return !isRouteRestricted(role, pathname);
};
