import { DTO } from '../DTO';
import { pool } from '../../database/db.config';

export class RBACSystem implements AuthModule.RBACProvider {
    private static instance: RBACSystem;
    private roles!: Record<string, AuthModule.Role>;

    constructor(config: AuthModule.RBACConfig) {
        if (RBACSystem.instance) {
            return RBACSystem.instance;
        }

        this.roles = config.roles;
        RBACSystem.instance = this;
    }

    async hasPermission(userId: number, permission: string): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permission);
    }

    async hasRole(userId: number, role: string): Promise<boolean> {
        const roles = await this.getUserRoles(userId);
        return roles.includes(role);
    }

    async getUserRoles(userId: number): Promise<string[]> {
        const connection = await pool.getConnection();
        try {
            const dto = new DTO({
                connection,
                query: 'SELECT role FROM user_roles WHERE user_id = ?',
                values: [userId]
            });

            const result = await dto.execute();
            if (!result.success || !result.data) return [];

            return result.data.map(row => row.role);
        } finally {
            connection.release();
        }
    }

    async getUserPermissions(userId: number): Promise<string[]> {
        const roles = await this.getUserRoles(userId);
        const permissions = new Set<string>();

        for (const roleName of roles) {
            const role = this.roles[roleName];
            if (!role) continue;

            // Add direct permissions
            role.permissions.forEach(p => permissions.add(p));

            // Add inherited permissions if hierarchy is enabled
            if (role.inherits) {
                for (const inheritedRole of role.inherits) {
                    const parentRole = this.roles[inheritedRole];
                    if (parentRole) {
                        parentRole.permissions.forEach(p => permissions.add(p));
                    }
                }
            }
        }

        return Array.from(permissions);
    }

    async assignRole(userId: number, role: string): Promise<void> {
        if (!this.roles[role]) {
            throw new Error(`Role ${role} does not exist`);
        }

        const connection = await pool.getConnection();
        try {
            const dto = new DTO({
                connection,
                query: 'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
                values: [userId, role]
            });

            await dto.execute();
        } finally {
            connection.release();
        }
    }

    async removeRole(userId: number, role: string): Promise<void> {
        const connection = await pool.getConnection();
        try {
            const dto = new DTO({
                connection,
                query: 'DELETE FROM user_roles WHERE user_id = ? AND role = ?',
                values: [userId, role]
            });

            await dto.execute();
        } finally {
            connection.release();
        }
    }
} 