CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT UNIQUE NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description TEXT,
    headlines TEXT,
    price TEXT,
    discount TEXT,
    number_of_students TEXT,
    duration TEXT,
    teacher_name TEXT,
    course_type TEXT,
    course_level TEXT,
    certificate_type TEXT,
    education_place TEXT,
    CONSTRAINT unique_name_url UNIQUE (title, url)
);


CREATE TABLE problem (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE
);

CREATE TABLE unvisited (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE
);

CREATE TABLE visited (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE
);




-- docker run --name postgres-container -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=hd6730mrm -e POSTGRES_DB=tmooty -p 5432:5432 -d postgres
