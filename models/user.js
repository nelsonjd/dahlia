module.exports = class User {
    constructor(opts = {}) {
        this.id = opts.id;
        this.username = opts.username
        this.refreshToken = opts.refreshToken;
        this.password = opts.password;
    }
}