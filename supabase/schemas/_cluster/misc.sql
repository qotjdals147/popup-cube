SELECT cron.schedule_in_database('auto_confirm_purchases_daily', '0 3 * * *', 'SELECT public._auto_confirm_purchases();', 'postgres', NULL, true);
