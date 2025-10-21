ALTER TABLE public.tasks
ADD CONSTRAINT unique_notification_num UNIQUE (notification_num);