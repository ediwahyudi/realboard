SELECT 
	u.user_id,
	u.user_name,
	SUM(IFNULL(t.task_level,0)) total_task
FROM rb_user u
LEFT JOIN rb_access a ON a.user_id = u.user_id
LEFT JOIN rb_task t ON t.user_id = u.user_id AND t.task_status = "done"
GROUP BY u.user_id