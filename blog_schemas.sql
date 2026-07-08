CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'freelancer' CHECK (role IN ('freelancer','hirer'))
);


CREATE TABLE posts (
	id SERIAL PRIMARY KEY,  
	title VARCHAR(255) NOT NULL,
	content TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    author_id INTEGER NOT NULL REFERENCES accounts(id),
    expiry_date TIMESTAMPTZ NOT NULL
	
);

CREATE TABLE applications (
	id SERIAL PRIMARY KEY,
	content TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    post_id INTEGER NOT NULL REFERENCES posts(id),
    user_id INTEGER NOT NULL REFERENCES accounts(id),
    UNIQUE( post_id,user_id)
);


