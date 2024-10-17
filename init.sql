CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
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


CREATE TABLE public.problem (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE
);

CREATE TABLE public.unvisited (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE
);

CREATE TABLE public.visited (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE
);
