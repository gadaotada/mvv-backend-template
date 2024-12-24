/**
* RBAC Manager
* @class RBACManager
*/
export class RBACManager {
    private static instance: RBACManager;
    private roles: Map<string, {
        permissions: string[];
        inherits?: string[];
        description?: string;
    }> = new Map();

    private constructor() {
    }

    /**
    * Get the singleton instance of RBACManager
    * @returns {RBACManager} The singleton instance
    */
    public static getInstance(): RBACManager {
        if (!RBACManager.instance) {
            RBACManager.instance = new RBACManager();
        }
        return RBACManager.instance;
    }

    /**
    * Initialize the RBACManager with a list of roles
    * @param roles - The list of roles
    */
    public initialize(roles: Record<string, {
        permissions: string[];
        inherits?: string[];
        description?: string;
    }>) {
        this.roles = new Map(Object.entries(roles));
    }

    /**
    * Validate the format of a permission
    * @param permission - The permission to validate
    * @returns {boolean} True if the permission is valid, false otherwise
    */
    private validatePermissionFormat(permissions: string[]): boolean {
        // Format: resource:action:scope
        // Example: posts:create:own
        if (permissions.includes('*')) {
            return true;
        }
        const permissionRegex = /^[a-z_]+:[a-z_]+:(any|own)$/;
        for (const permission of permissions) {
            if (!permissionRegex.test(permission)) {
                return false;
            }
        }
        return true;
    }

    /**
    * Check for circular inheritance
    * @param roleName - The name of the role
    * @param inheritedRole - The name of the role that inherits from the current role
    * @param visited - The set of visited roles
    * @returns {boolean} True if there is a circular inheritance, false otherwise
    */
    private checkCircularInheritance(roleName: string, 
        inheritedRole: string, 
        visited = new Set<string>()
    ): boolean {
        if (visited.has(roleName)) {
            return false;
        }
        visited.add(roleName);
        const role = this.roles.get(roleName);
        if (!role || !role.inherits) {
            return false;
        }
        if (role.inherits.includes(inheritedRole)) {
            return true;
        }
        for (const inheritedRole of role.inherits) {
            if (this.checkCircularInheritance(inheritedRole, inheritedRole, visited)) {
                return true;
            }
        }
        return false;
    }

    /**
    * Get all roles
    * @returns {Map<string, {
    *         permissions: string[];
    *         inherits?: string[];
    *         description?: string;
    *     }>} The list of roles
    */
    public getAllRoles(): Map<string, {
        permissions: string[];
        inherits?: string[];
        description?: string;
    }> {
        return this.roles;
    }

    /**
    * Get a role
    * @param role - The name of the role
    * @returns {Record<string, {
    *         permissions: string[];
    *         inherits?: string[];
    *         description?: string;
    *     }> | null} The role data or null if not found
    */
    public getRole(role: string): {
        permissions: string[];
        inherits?: string[];
        description?: string;
    } | null {
        return this.roles.get(role) || null;
    }

    /**
    * Get the permissions for a role
    * @param role - The name of the role
    * @returns {string[]} The list of permissions
    */
    public getPermissions(role: string): string[] {
        const roleData = this.getRole(role);
        if (!roleData) {
            return [];
        }
        return roleData.permissions;
    }

    /**
    * Create a new role
    * @param role - The name of the role
    * @param permissions - The list of permissions
    * @param inherits - The list of roles that inherit from this role
    * @param description - The description of the role
    * @returns {boolean} True if the role was created, false otherwise
    */
    public createRole(role: string, permissions: string[], inherits?: string[], description?: string): boolean {
        if (this.roles.has(role) && this.validatePermissionFormat(permissions) && this.checkCircularInheritance(role, role)) {
            return false;
        }

        this.roles.set(role, { permissions, inherits, description });
        return true;
    }

    /**
    * Update a role
    * @param role - The name of the role
    * @param permissions - The list of permissions
    * @param inherits - The list of roles that inherit from this role
    * @param description - The description of the role
    * @returns {boolean} True if the role was updated, false otherwise
    */
    public updateRole(role: string, permissions: string[], inherits?: string[], description?: string): boolean {
        if (!this.roles.has(role) && this.validatePermissionFormat(permissions) && this.checkCircularInheritance(role, role)) {
            return false;
        }
        this.roles.set(role, { permissions, inherits, description });
        return true;
    }

    /**
    * Delete a role
    * @param role - The name of the role
    * @returns {boolean} True if the role was deleted, false otherwise
    */
    public deleteRole(role: string): boolean {
        if (!this.roles.has(role)) {
            return false;
        }
        // check if the role is inherited by other roles
        for (const roleData of this.roles.values()) {
            if (roleData.inherits && roleData.inherits.includes(role)) {
                return false;
            }
        }
        this.roles.delete(role);
        return true;
    }
}
