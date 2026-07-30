/**
 * Utility functions for filtering project access based on user role and assigned id_user.
 */

/**
 * Checks whether a given user can access a specific project.
 * 
 * Rules:
 * - Admin users (isAdmin === true or user.admin === true / 'true' / 1 / 'TRUE') can access ALL projects.
 * - Non-admin users can ONLY access projects where project.id_user matches user.id (or contains user.id).
 */
export const canUserAccessProject = (project, userParam, isAdminParam) => {
  if (!project) return false;

  let user = userParam;
  let isAdmin = isAdminParam;

  // If user object or isAdmin is not provided, inspect localStorage fallback
  if (typeof window !== 'undefined') {
    const storedId = localStorage.getItem('custom_user_id');
    const storedAdmin = localStorage.getItem('custom_user_admin');
    const storedMail = localStorage.getItem('custom_user_mail');

    if (isAdmin === undefined && storedAdmin !== null) {
      isAdmin = storedAdmin === 'true';
    }

    if (!user && storedId) {
      user = { id: storedId, mail: storedMail, admin: storedAdmin === 'true' };
    }
  }

  // Check if user is Admin
  const userAdminValue = user?.admin;
  const isUserAdmin = isAdmin || userAdminValue === true || userAdminValue === 'true' || userAdminValue === 1 || userAdminValue === 'TRUE';
  
  if (isUserAdmin) {
    return true;
  }

  // Non-admin user access check
  if (!user || !user.id) {
    return false;
  }

  if (!project.id_user) {
    return false;
  }

  const projUserId = String(project.id_user).trim();
  const userId = String(user.id).trim();

  return projUserId === userId || projUserId.includes(userId);
};

/**
 * Filters an array of projects according to user permissions.
 */
export const filterProjectsByUser = (projects, user, isAdmin) => {
  if (!Array.isArray(projects)) return [];
  return projects.filter(project => canUserAccessProject(project, user, isAdmin));
};
