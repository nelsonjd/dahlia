const { pool } = require('../pool');
const User = require('../models/user');

class UserRepository
{
    async findByUsername(user, connection, keepConnectionOpen = false) 
    {
        const statement = 'SELECT * from users WHERE username = ?';
        const values = [user.username];
        return this.runSqlStatement(statement, values, connection, keepConnectionOpen, (results, fields) => {
            let user;
            const row = results[0];
            if (row) {
                user = new User({
                   id: row.user_id, 
                   username: row.username, 
                   refreshToken: row.refresh_token,
                   password: row.password
                });
            }
            return { user };
        });
    }
    
    async findById(user, connection, keepConnectionOpen = false)
    {
        const statement = 'SELECT * from users WHERE user_id = ?';
        const values = [user.id];
        return this.runSqlStatement(statement, values, connection, keepConnectionOpen, (results, fields) =>
        {
            let user;
            const row = results[0];
            if (row) {
                user = new User({
                   id: row.user_id, 
                   username: row.username, 
                   refreshToken: row.refresh_token,
                   password: row.password
                });
            }
            return { user };
        });
    }
    
    async create(user, connection, keepConnectionOpen = false) 
    {
        const statement = 'INSERT INTO users(username, password) VALUES (?, ?)';
        const values = [user.username, user.password];

        return this.runSqlStatement(statement, values, connection, keepConnectionOpen, (results, fields) =>
        {
            if (results.insertId)
            {
                return { id: results.insertId };
            }
        });
    }

    async updateRefreshToken (user, connection) {
        const { id, refreshToken } = user;
        
        const statement = `UPDATE users
        SET refresh_token = ?
        WHERE user_id = ?`;

        const values = [refreshToken, id];

        return this.runSqlStatement(statement, values, connection, false);
    }

    async runSqlStatement(statement, values, connection, keepConnectionOpen, callback)
    {
        return new Promise((resolve, reject) =>
        {
            if (connection)
            {
                connection.query(statement, values, this.process(keepConnectionOpen, connection, resolve, reject, callback));
            }
            else {
                pool.getConnection((err, connection) => {
                    if (err)
                    {
                        return reject(err);
                    }
                    connection.query(statement, values, this.process(keepConnectionOpen, connection, resolve, reject, callback));
                });
            }
        });
    }

    process(keepConnectionOpen, connection, resolve, reject, callback) {
        return (err, results, fields) =>
        {
            if (err)
            {
                return reject(err);
            }

            let result;
            try {
                if (callback)
                {
                    result = callback(results, fields);
                }
            } catch (err)
            {
                return reject(err);
            }

            if (keepConnectionOpen) {
                resolve({ ...result, connection });
            }
            else {
                connection.release();
                resolve({ ...result });
            }
        };
    }
}


module.exports.userRespository = new UserRepository();