-- Q1: Все задачи с названием категории через JOIN; сортировка по id задачи.
SELECT t.id, t.title, t.completed, t.priority, t.category_id, c.name AS category_name
FROM public.tasks t
JOIN public.categories c ON t.category_id = c.id
ORDER BY t.id;

-- Q2: Невыполненные задачи высокого приоритета в категории 2.
SELECT id, title, completed, priority, category_id
FROM public.tasks
WHERE completed = false AND priority = 'high' AND category_id = 2
ORDER BY id;

-- Q3: Поиск ПРОВЕР в названии без учёта регистра.
SELECT id, title, completed, priority, category_id
FROM public.tasks
WHERE title ILIKE '%ПРОВЕР%'
ORDER BY id;

-- Q4: Для каждой категории число задач, включая категории без задач.
SELECT c.id, c.name, count(t.id) AS task_count
FROM public.categories c
LEFT JOIN public.tasks t ON c.id = t.category_id
GROUP BY c.id, c.name
ORDER BY c.id;

-- Q5: Число выполненных и невыполненных задач в каждой категории.
SELECT c.id, c.name,
       count(t.id) FILTER (WHERE t.completed = true) AS completed_count,
       count(t.id) FILTER (WHERE t.completed = false) AS uncompleted_count
FROM public.categories c
LEFT JOIN public.tasks t ON c.id = t.category_id
GROUP BY c.id, c.name
ORDER BY c.id;

-- Q6: Категории, имеющие не менее четырёх задач, через HAVING.
SELECT c.id, c.name, count(t.id) AS task_count
FROM public.categories c
JOIN public.tasks t ON c.id = t.category_id
GROUP BY c.id, c.name
HAVING count(t.id) >= 4
ORDER BY c.id;

-- Q7: Задача id 4 с именами полей API; category_id как "categoryId".
SELECT id, title, completed, priority, category_id AS "categoryId"
FROM public.tasks
WHERE id = 4
ORDER BY id;