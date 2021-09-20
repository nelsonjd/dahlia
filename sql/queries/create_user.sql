IF NOT EXISTS (SELECT username from users WHERE username = 'jimbo')
BEGIN
	INSERT INTO users (username, password) VALUES ('test', 'password')
END