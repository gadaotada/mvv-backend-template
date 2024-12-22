import { pool } from "../../global/database/db.config";
import { DTO } from "../../global/systems/DTO";
import { LoggingSystem } from "../../global/systems/logging";
import { User } from "./types";

export async function getUsers() { 
    const connection = await pool.getConnection();
    try {
        const query = `
            SELECT * FROM users;
        `
        const dto = new DTO({
            connection,
            query
        })

        const result = await dto.execute();

        if (!result.success) {
            return null;
        }

        return result.data;
    } finally {
        connection.release();
    }
};

export async function createUser(user: User) {
    const logger = LoggingSystem.getInstance();
    const connection = await pool.getConnection();
    
    try {
        logger.log(`Creating new user: ${user.username}`, "info");

        const query = `
            INSERT INTO users (username, email, password) VALUES (?, ?, ?);
        `
        const dto = new DTO({
            connection,
            query,
            values: [user.username, user.email, user.password]
        })

        const result = await dto.execute();

        if (!result.success) {
            return null;
        }

        logger.log(`Successfully created user: ${user.username}`, "info");
        return result.metadata?.insertId;
    } finally {
        connection.release();
    }
}

export async function deleteUser(id: User["id"]) {
    const connection = await pool.getConnection();
    try {
        const query = `
            DELETE FROM users WHERE id = ?;
            DELETE FROM blog_posts WHERE author_id = ?;
        `

        await connection.beginTransaction();

        const dto = new DTO({
            connection,
            query,
            values: [id, id]
        })

        const result = await dto.execute();

        if (!result.success) {
            await connection.rollback();
            return null;
        }

        await connection.commit();
        return result.metadata?.affectedRows;
    } finally {
        connection.release();
    }
}
