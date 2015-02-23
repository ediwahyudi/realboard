/*
Navicat SQLite Data Transfer

Source Server         : rb2
Source Server Version : 30714
Source Host           : :0

Target Server Type    : SQLite
Target Server Version : 30714
File Encoding         : 65001

Date: 2015-02-23 14:12:05
*/

PRAGMA foreign_keys = OFF;

-- ----------------------------
-- Table structure for rb_access
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_access";
CREATE TABLE "rb_access" (
"access_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"access_name"  TEXT,
"user_id"  INTEGER
);

-- ----------------------------
-- Table structure for rb_client
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_client";
CREATE TABLE "rb_client" (
"client_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"client_name"  TEXT
);

-- ----------------------------
-- Table structure for rb_delta
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_delta";
CREATE TABLE "rb_delta" (
"delta_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"delta_timestamp"  INTEGER,
"delta_date"  TEXT,
"delta_time"  TEXT,
"delta_value"  TEXT,
"user_id"  INTEGER,
"file_path"  TEXT
);

-- ----------------------------
-- Table structure for rb_file
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_file";
CREATE TABLE "rb_file" (
"file_path"  TEXT NOT NULL,
"file_name"  TEXT,
"file_dir"  TEXT,
"file_timestamp"  INTEGER,
"file_date"  TEXT,
"file_time"  TEXT,
"file_content"  TEXT,
"file_type"  TEXT,
"file_extension"  TEXT,
"file_lock"  TEXT,
PRIMARY KEY ("file_path" ASC)
);

-- ----------------------------
-- Table structure for rb_job
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_job";
CREATE TABLE "rb_job" (
					"job_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
					"job_title"  TEXT,
					"job_desc"  TEXT,
					"job_datestart"  TEXT,
					"job_datefinish"  TEXT,
					"job_status"  TEXT,
					"project_id"  INTEGER
					);

-- ----------------------------
-- Table structure for rb_project
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_project";
CREATE TABLE "rb_project" (
"project_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"project_title"  TEXT,
"project_date"  TEXT,
"project_env"  TEXT,
"client_id"  INTEGER
);

-- ----------------------------
-- Table structure for rb_sign
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_sign";
CREATE TABLE "rb_sign" (
"sign_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"sign_type"  TEXT,
"sign_timestamp"  INTEGER,
"sign_date"  TEXT,
"sign_time"  TEXT,
"sign_ip"  TEXT,
"sign_agent"  TEXT,
"user_id"  INTEGER
);

-- ----------------------------
-- Table structure for rb_task
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_task";
CREATE TABLE "rb_task" (
"task_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"task_title"  TEXT,
"task_desc"  TEXT,
"task_comment"  TEXT,
"task_status"  TEXT,
"task_deadlinedate"  TEXT,
"task_deadlinetime"  TEXT,
"task_finishdate"  TEXT,
"task_finishtime"  TEXT,
"task_level"  INTEGER,
"user_id"  INTEGER,
"job_id"  INTEGER
);

-- ----------------------------
-- Table structure for rb_taskuser
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_taskuser";
CREATE TABLE "rb_taskuser" (
"taskuser_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"task_id"  INTEGER,
"user_id"  INTEGER
);

-- ----------------------------
-- Table structure for rb_user
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_user";
CREATE TABLE "rb_user" (
				"user_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				"user_ip"  TEXT,
				"user_name"  TEXT,
				"user_email"  TEXT,
				"user_password"  TEXT,
				"user_theme"  TEXT DEFAULT gray,
				"user_theme_ide"  TEXT DEFAULT cobalt,
				"user_ide_engine"  TEXT,
				"user_share"  TEXT,
				"user_active"  TEXT DEFAULT 0
				);

-- ----------------------------
-- Table structure for rb_version
-- ----------------------------
DROP TABLE IF EXISTS "main"."rb_version";
CREATE TABLE "rb_version" (
"version_id"  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
"version_type"  TEXT,
"version_timestamp"  INTEGER,
"version_date"  TEXT,
"version_time"  TEXT,
"version_raw"  TEXT,
"version_message"  TEXT,
"user_ip"  TEXT,
"user_id"  INTEGER,
"file_path"  TEXT
);

-- ----------------------------
-- View structure for rb_view_task
-- ----------------------------
DROP VIEW IF EXISTS "main"."rb_view_task";
CREATE VIEW "rb_view_task" AS 
SELECT
						rb_job.job_title || ". (" || rb_client.client_name || ", " || rb_project.project_title || ", " || rb_project.project_env || ")" AS task_summary,
						rb_task.task_deadlinedate || " " || rb_task.task_deadlinetime AS task_deadline,
						rb_task.task_finishdate || " " || rb_task.task_finishtime AS task_finish,
						group_concat(rb_user.user_name) user_name,
						group_concat(rb_user.user_id) user_id,
						rb_task.task_title,
						rb_task.task_desc,
						rb_task.task_comment,
						rb_task.task_status,
						rb_task.task_deadlinedate,
						rb_task.task_deadlinetime,
						rb_task.task_finishdate,
						rb_task.task_finishtime,
						rb_task.task_level,
						rb_job.job_title,
						rb_job.job_desc,
						rb_job.job_datestart,
						rb_job.job_datefinish,
						rb_job.job_status,
						rb_project.project_title,
						rb_project.project_date,
						rb_project.project_env,
						rb_client.client_name,
						rb_task.task_id,
						rb_task.job_id,
						rb_job.project_id,
						rb_project.client_id
					FROM
						rb_task
					LEFT JOIN rb_job ON rb_job.job_id = rb_task.job_id
					LEFT JOIN rb_project ON rb_project.project_id = rb_job.project_id
					LEFT JOIN rb_client ON rb_client.client_id = rb_project.client_id
					LEFT JOIN rb_taskuser ON rb_taskuser.task_id = rb_task.task_id
					LEFT JOIN rb_user ON rb_user.user_id = rb_taskuser.user_id
					WHERE rb_job.job_status != "prepared" AND rb_project.project_env NOT IN ("plan","closed")
					GROUP BY rb_task.task_id;

-- ----------------------------
-- View structure for rb_view_task_det
-- ----------------------------
DROP VIEW IF EXISTS "main"."rb_view_task_det";
CREATE VIEW "rb_view_task_det" AS 
SELECT
						rb_job.job_title || ". (" || rb_client.client_name || ", " || rb_project.project_title || ", " || rb_project.project_env || ")" AS task_summary,
						rb_task.task_deadlinedate || " " || rb_task.task_deadlinetime AS task_deadline,
						rb_task.task_finishdate || " " || rb_task.task_finishtime AS task_finish,
						rb_user.user_name,
						rb_user.user_id,
						rb_task.task_title,
						rb_task.task_desc,
						rb_task.task_comment,
						rb_task.task_status,
						rb_task.task_deadlinedate,
						rb_task.task_deadlinetime,
						rb_task.task_finishdate,
						rb_task.task_finishtime,
						rb_task.task_level,
						rb_job.job_title,
						rb_job.job_desc,
						rb_job.job_datestart,
						rb_job.job_datefinish,
						rb_job.job_status,
						rb_project.project_title,
						rb_project.project_date,
						rb_project.project_env,
						rb_client.client_name,
						rb_task.task_id,
						rb_task.job_id,
						rb_job.project_id,
						rb_project.client_id
					FROM
						rb_task
					LEFT JOIN rb_job ON rb_job.job_id = rb_task.job_id
					LEFT JOIN rb_project ON rb_project.project_id = rb_job.project_id
					LEFT JOIN rb_client ON rb_client.client_id = rb_project.client_id
					LEFT JOIN rb_taskuser ON rb_taskuser.task_id = rb_task.task_id
					LEFT JOIN rb_user ON rb_user.user_id = rb_taskuser.user_id
					WHERE rb_job.job_status != "prepared" AND rb_project.project_env NOT IN ("plan","closed");

-- ----------------------------
-- Indexes structure for table rb_access
-- ----------------------------
CREATE INDEX "main"."find_access_by_user_id"
ON "rb_access" ("user_id" ASC);

-- ----------------------------
-- Indexes structure for table rb_file
-- ----------------------------
CREATE INDEX "main"."find_file_by_others"
ON "rb_file" ("file_path" ASC, "file_name" ASC, "file_dir" ASC, "file_date" ASC, "file_time" ASC, "file_type" ASC, "file_extension" ASC);

-- ----------------------------
-- Indexes structure for table rb_sign
-- ----------------------------
CREATE INDEX "main"."find_signin_by_userdate"
ON "rb_sign" ("sign_date" ASC, "user_id" ASC);
