-- Вариант 2: Выполненные задачи категории «Проект».
SELECT t.id, t.title, t.completed, t.priority, t.category_id, c.name AS category_name
FROM public.tasks t
JOIN public.categories c ON t.category_id = c.id
WHERE c.name = 'Проект' AND t.completed = true
ORDER BY t.id;