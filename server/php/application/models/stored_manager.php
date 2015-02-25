<?php

class Stored_manager extends CI_Model
{
	private $_date;
	private $_time;
	private $_timestamp;
	function __construct()
	{
		parent::__construct();
		$this->load->database();
		$this->_date = date("Y-m-d");
		$this->_time = date("H:i:s");
		$this->_timestamp = time();
	}

	function migrate()
	{
		$query = array();
		$query[] = 'DROP VIEW "rb_view_task"';
		$query[] = 'CREATE VIEW "rb_view_task" AS 
					SELECT
						rb_job.job_title || ". (" || rb_client.client_name || ", " || rb_project.project_title || ", " || rb_project.project_env || ")" AS task_summary,
						rb_task.task_deadlinedate || " " || rb_task.task_deadlinetime AS task_deadline,
						rb_task.task_finishdate || " " || rb_task.task_finishtime AS task_finish,
						strftime("%s",rb_task.task_deadlinedate || " " || rb_task.task_deadlinetime) task_deadline_unix,
						strftime("%s",rb_task.task_finishdate || " " || rb_task.task_finishtime) AS task_finish_unix,
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
					GROUP BY rb_task.task_id';
		$query[] = 'DROP VIEW "rb_view_task_det"';
		$query[] = 'CREATE VIEW "rb_view_task_det" AS 
					SELECT
						rb_job.job_title || ". (" || rb_client.client_name || ", " || rb_project.project_title || ", " || rb_project.project_env || ")" AS task_summary,
						rb_task.task_deadlinedate || " " || rb_task.task_deadlinetime AS task_deadline,
						rb_task.task_finishdate || " " || rb_task.task_finishtime AS task_finish,
						strftime("%s",rb_task.task_deadlinedate || " " || rb_task.task_deadlinetime) task_deadline_unix,
						strftime("%s",rb_task.task_finishdate || " " || rb_task.task_finishtime) AS task_finish_unix,
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
					WHERE rb_job.job_status != "prepared" AND rb_project.project_env NOT IN ("plan","closed")';
		foreach($query as $q)
		{
			$this->db->query($q);
		}
	}

	function set_sign($type,$user)
	{
		$agent = $this->input->user_agent();
		$data = array(
			"sign_type"			=> $type,
			"sign_timestamp"	=> $this->_timestamp,
			"sign_date"			=> $this->_date,
			"sign_time"			=> $this->_time,
			"sign_ip"			=> $this->input->ip_address(),
			"sign_agent"		=> $agent ? $agent : "RealBoard Socket agent",
			"user_id"			=> $user
		);
		$this->db->insert("sign",$data);
		$this->db->update("user",
					array("user_active"=>($type == "in" ? "online" : "offline")),
					array("user_id"=>$user));
		return $this;
	}
	
	function set_version($user,$file_path,$type = "save",$content = NULL,$message = NULL)
	{
		$data = array(
			"version_type"		=> $type,
			"version_timestamp"	=> $this->_timestamp,
			"version_date"		=> $this->_date,
			"version_time"		=> $this->_time,
			"version_raw"		=> $content,
			"version_message"	=> $message,
			"user_id"			=> $user,
			"user_ip"			=> $this->input->ip_address(),
			"file_path"			=> $file_path
		);
		$this->db->insert("version",$data);
		return $this;
	}
	
	function set_deltas($user,$deltas,$file_path)
	{
		$data = array(
			"delta_timestamp"	=> $this->_timestamp,
			"delta_date"		=> $this->_date,
			"delta_time"		=> $this->_time,
			"delta_value"		=> $deltas,
			"user_id"			=> $user,
			"file_path"			=> $file_path
		);
		$this->db->insert("delta",$data);
		return $this;
	}
	
	function set_file($file_path,$value = NULL)
	{
		$data = array(
			'file_path'		=> $file_path,
			'file_name'		=> pathinfo($file_path,PATHINFO_BASENAME),
			'file_dir'		=> pathinfo($file_path,PATHINFO_DIRNAME),
			'file_timestamp'=> $this->_timestamp,
			'file_date'		=> $this->_date,
			'file_time'		=> $this->_time,
			'file_content'	=> $value,
			'file_type'		=> is_dir($file_path) ? "folder" : "file",
			'file_extension'=> pathinfo($file_path,PATHINFO_EXTENSION),
			'file_lock'		=> 0
			);
		if(!$this->db->limit(1)->get_where("file",array("file_path"=>$file_path))->num_rows())
		{
			$this->db->insert("file",$data);
		}
		else
		{
			unset($data['file_path']);
			$this->db->update("file",$data,array("file_path"=>$file_path));
		}
		return $this;
	}
	
	function get_user($user,$password)
	{
		$where = array(
			"user_email"=>$user,
			"user_password"=>md5($password)
		);
		$user_data = $this->db->get_where("user",$where);
		$response = array(
			"success" => FALSE,
			"message" => "Undefined user or password",
			"data" => NULL
		);
		if($user_data->num_rows())
		{
			$data = $user_data->row_array();
			if( $data["user_active"] == "offline" )
			{
				$this->set_sign("in",$data['user_id']);
				unset($data['user_password']);
				$response["data"] = $data;
			}
			else
			{
				$response["message"] = "User already signin!";
			}
			$response["success"] = TRUE;
		}
		return $response;
	}
	
	function get_users($viewer = 0,$id = 0)
	{
		if( $id )
		{
			$data = $this->db->limit(1)->get_where("user",array("user_id"=>$id))->row_array();
			if($data) {
				$access = array();
				foreach($this->db->get_where("access",array("user_id"=>$id))->result() as $o )
				{
					array_push($access,$o->access_name);
				}
				unset($data["user_password"]);
				$data["user_access"] = $access;	
			}
			return $data;
		}
		else
		{
			$opt["table"] = "user";
			$opt["fields"]	= array(
				"user.user_id",
				"user.user_ip",
				"user.user_name",
				"user.user_email",
				"user.user_password",
				"user.user_theme",
				"user.user_theme_ide",
				"user.user_ide_engine",
				"user.user_share",
				"user.user_active"
			);
			$opt["where"] = array("user_id !="=>$viewer);
			return $this->_output_filters($opt);
		}
		
	}
	
	function get_file_content($file_path)
	{
		$data = $this->db->limit(1)->get_where("file",array("file_path"=>$file_path));
		if($data->num_rows() == 1)
		{
			$output = $data->row()->file_content;
			if($output)return $output;
			return FALSE;
		}
		return "";
	}
	
	function set_file_content($file_path,$content)
	{
		$this->set_file($file_path,$content);
	}
	
	function set_user($id,$data){
		$user = $this->db->limit(1)->get_where("user",array('user_email'=>$data["user_email"]))->row();
		$ip = $this->db->limit(1)->get_where("user",array('user_ip'=>$data["user_ip"],'user_id !='=>$id))->row();
		$response = array(
			"success"=>TRUE,
			"data"=>NULL,
			"message"=>"Undefined user"
		);
		if(isset($user->user_id) && $user->user_id != $id)
		{
			$response['message'] = "Email already used by another user";
		}
		else if(isset($ip->user_ip) && $ip->user_ip == $data["user_ip"])
		{
			$response['message'] = "IP Address already registered by another user";
		}
		else if(!$id && !@$data["user_password"])
		{
			$response['message'] = "Password cannot set to empty.";
		}
		else
		{
			$method = $id && $id > 0 ? "update" : "insert";
			$this->db->{$method}("user",$data,array("user_id"=>$id));
			if(!$id)$id = $this->db->insert_id();
			$response['data'] = $this->db->limit(1)->get_where('user',array('user_id'=>$id))->row_array();
			$response['message'] = "Profile saved!";
			//unset($response['data']['user_password']);
		}
		return $response;
	}
	
	function remove_user($owner,$id)
	{
		if($owner && $id)
		{
			$where = array("user_id"=>$owner,"access_name"=>"superuser");
			if($this->_count_by_id("access",$where))
			{
				$who = array("user_id"=>$id);
				$this->db->delete("user",$who);
				$this->db->delete("delta",$who);
				$this->db->delete("access",$who);
				$this->db->delete("sign",$who);
				$this->db->delete("version",$who);
				return TRUE;
			}
		}
		return FALSE;
	}
	
	function get_themes($theme = "ace")
	{
		if(!$theme)
			$theme = "ace";

		$theme_path = array(
				"ace" => FCPATH . "../../client/public/plugins/ace/lib/ace/theme/",
				"codemirror" => FCPATH . "../../client/public/plugins/codemirror/theme/",
			);

		$this->load->helper("file");
		$data = array(
			array('theme'=>$theme_path[$theme])
		);
		if(is_dir($theme_path[$theme]))
		{
			$data = array();
			foreach(get_dir_file_info($theme_path[$theme]) as $css)
			{
				if(pathinfo($css["name"],PATHINFO_EXTENSION) != "css")
				{
					continue;
				}
				
				$data[] = array("theme"=>strtok($css["name"],"."));
			}
		}
		asort($data);
		$data = array_values($data);
		return $data;
	}
	
	function get_email()
	{
		$where = array("user_ip"=>$this->input->ip_address());
		$data = $this->db->select("user_email")->limit(1)->get_where("user",$where)->row();
		if(isset($data->user_email))
			return $data->user_email;
		return FALSE;
	}
	
	function get_signout($id)
	{
		$this->set_sign("out",$id);
	}

	private function _alias_of($fields,$column = "")
	{
		foreach($fields as $index)
		{
			$arr = explode(".",$index);
			if(isset($arr[1]) && $arr[1] == $column){
				return $arr[0].".".$column;
				break;
			}
		}
		return $column;
	}
	
	protected function _count_by_id($table,$where)
	{
		return $this->db->where($where)->count_all_results($table);
	}
	
	protected function _prepare_filters($opt = array())
	{
		if(!$opt)return FALSE;
		$table	= $opt["table"];
		$fields	= $opt["fields"];
		$where	= isset($opt["where"]) ? $opt["where"] : NULL;
		$join	= isset($opt["join"]) ? $opt["join"] : NULL;
		$type	= isset($opt["type"]) ? $opt["type"] : "GET";
		$db		= $this->db;
		$offset	= $this->input->get("start");
		$limit	= $this->input->get("limit");
		
		$sortable = array();
		
		$search = $this->input->get("search");
		if($search && $search != "")
		{
			foreach($fields as $key)
			{
				$db->or_like($key,$search);
			}
		}
		
		$last_filter = substr($this->db->_compile_select(),15);
		$this->db->_reset_select();
		if($where)
		{
			$db->where($where);
		}
		
		if($last_filter)
			$db->where("({$last_filter})",NULL,FALSE);
		
		if($type == "GET")
		{
			if( $limit )$db->limit($limit,$offset);
			else $db->limit(25);
		}
		
		if($sortable = json_decode($this->input->get("sort"))){
			foreach($sortable as $index => $sort)
			{
				$db->order_by($this->_alias_of($fields,$sort->property),$sort->direction);
			}
		}
		
		$is_join = isset($join[0]) ? TRUE : FALSE;
		
		if($is_join)
		{
			if(!is_array($join[0]) && in_array(count($join),array(2,3)))
			{
				$join_type = isset($join[2]) ? $join[2] : "LEFT";
				$db->join($join[0],$join[1],$join_type);
			}
			else
			{
				foreach($join as $join_value){
					$join_type = isset($join_value[2]) ? $join_value[2] : "LEFT";
					$db->join($join_value[0],$join_value[1],$join_type);
				}
			}
		}
		$db->select($fields);
		
		if($type == "GET")
			return $db->get($table)->result_array();
		else if($type == "COUNT")
			return $db->count_all_results($table);
		return $db->from($table);
	}
	
	protected function _output_filters($opt,$callback = NULL)
	{
		$opt["type"] = "GET";
		$data = $this->_prepare_filters($opt);
		if($callback)
		{
			$callbackedData = array();
			foreach($data as $val)
			{
				$callbackedData[] = call_user_func_array(
					array($this,$callback), 
					array($val)
				);
			}
			$data = $callbackedData;
		}
		$opt["type"] = "COUNT";
		$results = $this->_prepare_filters($opt);
		return array(
			"success"=>TRUE,
			"total"=>(int)$results,
			"items"=>$data
		);
	}
	
	function get_sign($id)
	{
		$search_access = array("manager","superuser");
		$where_id = array("user_id"=>$id);
		
		$is_special = $this->db
		->where_in("access_name",$search_access)
		->where($where_id)
		->count_all_results("access");
		if($is_special < 1)
		$opt["where"]	= array("user.user_id"=>$id);
		$opt["table"]	= "sign";
		$opt["fields"]	= array(
			"user.user_name",
			"user.user_email",
			"sign.sign_ip",
			"sign.sign_type",
			"sign.sign_date",
			"sign.sign_time",
			"sign.sign_agent"
		);
		$opt["join"]	= array("user","user.user_id=sign.user_id","left");
		return $this->_output_filters($opt);
	}

	function get_sign_today()
	{
		$opt["where"] = array("sign.sign_date"=>date("Y-m-d"));
		$opt["table"]	= "sign";
		$opt["fields"]	= array(
			"user.user_name",
			"user.user_email",
			"sign.sign_ip",
			"sign.sign_type",
			"sign.sign_date",
			"sign.sign_time",
			"sign.sign_agent"
		);
		$opt["join"]	= array("user","user.user_id=sign.user_id","left");
		return $this->_output_filters($opt);
	}
	
	function get_files()
	{
		$opt["table"]	= "file";
		$opt["fields"]	= array(
			"file_path",
			"file_name",
			"file_dir",
			"file_timestamp",
			"file_date",
			"file_time",
			"file_extension",
			"file_lock"
		);
		return $this->_output_filters($opt);
	}
	
	function get_version_data()
	{
		$opt["table"] = "version";
		$opt["fields"]	= array(
			"file.file_path",
			"user.user_name",
			"user.user_email",
			"version.user_ip",
			"version.version_type",
			"file.file_dir",
			"file.file_name",
			"file.file_extension",
			"version.version_date",
			"version.version_time",
			"version.version_message",
			"file.file_date",
			"file.file_time",
			"version.version_id"
		);
		$opt["where"]	= array("file.file_path !="=>"");
		$opt["join"]	= array(
			array("user","user.user_id=version.user_id"),
			array("file","file.file_path=version.file_path")
		);
		return $this->_output_filters($opt);
	}
	
	function get_version_raw($id)
	{
		$output	= FALSE;
		$where	= array("version_id"=>$id);
		$data	= $this->db->select("version_raw")->limit(1)->get_where("version",$where);
		if($data->num_rows() == 1)
		{
			$output = $data->row()->version_raw;
		}
		return $output;
	}

	function set_multi_tasking($data,$task_id = 0)
	{
		if(!$data)return false;

		$this->db->delete("taskuser",array("task_id"=>$task_id));
		if(!$task_id)
		{
			$row = $this->db->select_max("task_id")->get("task")->row();
			$task_id = @$row->task_id;
		}

		foreach ($data as $user_id) {
			$this->db->insert("taskuser",array("user_id"=>$user_id,"task_id"=>$task_id));
		}
	}

	function set_data($table,$data,$id)
	{
		$method = $id && $id > 0 ? "update" : "insert";
		$this->db->{$method}($table,$data,array($table."_id"=>$id));
		if(!$id)$data[$table."_id"] = $this->db->insert_id();
		else $data[$table."_id"] = $id;
		return $data;
	}

	function remove_data($table,$id = NULL)
	{
		if(is_array($id))
		{
			$this->db->delete($table,$id);
		}
		else
		{
			$this->db->delete($table,array($table."_id"=>$id));
		}
		return TRUE;
	}

	function get_client()
	{
		$opt["table"] = "client";
		$opt["fields"] = array("client_id","client_name");
		return $this->_output_filters($opt);
	}
	
	function get_project()
	{
		$opt["table"] = "project";
		$opt["fields"] = array(
			"project.project_id",
			"client.client_name",
			"client.client_id",
			"project.project_title",
			"project.project_date",
			"project.project_env"
		);
		$opt["join"] = array("client","client.client_id=project.client_id");
		return $this->_output_filters($opt);
	}
	
	function get_job($id = 0)
	{
		$opt["table"] = "job";
		$opt["fields"] = array(
			"job_id",
			"job_title",
			"job_desc",
			"job_datestart",
			"job_datefinish",
			"job_status",
			"project_id"
		);
		if($id)
			$opt["where"] = array("project_id"=>$id);
		return $this->_output_filters($opt);
	}
	
	function get_task($id = 0)
	{
		$opt["table"] = "task";
		$opt["fields"] = array(
			"task.task_id",
			"task.task_title",
			"task.task_desc",
			"task.task_comment",
			"task.task_status",
			"task.task_deadlinedate",
			"task.task_deadlinetime",
			"task.task_level",
			"task.task_finishdate",
			"task.task_finishtime",
			"task.user_id",
			"user.user_name",
			"task.job_id"
		);
		$opt["join"] = array("user","user.user_id=task.user_id");
		if($id)
			$opt["where"] = array("job_id"=>$id);
		return $this->_output_filters($opt);
	}

	function get_user_task($id = 0)
	{
		$data =  $this->db
		->select("user.user_id,user.user_name,t.task_id")
		->join("taskuser t","t.user_id=user.user_id AND t.task_id = {$id}","LEFT")
		->group_by("user.user_id")
		->get_where("user")->result();
		$output = array();
		foreach($data as $o)
		{
			$output[] = array(
					"boxLabel"		=> $o->user_name,
					"name"			=> "user_id[]",
					"inputValue"	=> $o->user_id,
					"checked"		=> (bool)$o->task_id
				);
		}
		return $output;
	}

	function get_task_detail($id = 0,$where = array(),$table = "view_task")
	{
		$opt["table"] = $table;
		$opt["fields"] = array(
			"task_summary",
			"task_title",
			"task_desc",
			"task_comment",
			"task_status",
			"task_deadline",
			"task_deadlinedate",
			"task_deadlinetime",
			"task_finish",
			"task_finishdate",
			"task_finishtime",
			"job_title",
			"task_level",
			"job_desc",
			"job_datestart",
			"job_datefinish",
			"job_status",
			"project_title",
			"project_date",
			"project_env",
			"client_name",
			"user_name",
			"task_id",
			"user_id",
			"job_id"
		);

		if($where)
		{
			$opt["where"] = $where;
		}
		if($id){
			$opt["where"]["user_id"] = $id;
		}
		return $this->_output_filters($opt);
	}

	function get_task_report($date_start = NULL, $date_end = NULL, $project_ids = array())
	{
		$project = $this->db
		->join("client c","c.client_id=project.client_id","LEFT")
		->get("project")->result();
		$from = date("Y-m-d",$date_start);
		$to = date("Y-m-d",$date_end);
		$where = array(
			"task_deadline >=" => $from,
			"task_deadline <=" => $to);
		$output = '';
		foreach($project as $o)
		{
			$theJob = $this->db->get_where("job",array("project_id"=>$o->project_id))->result();
			$jobs = '';
			foreach($theJob as $job)
			{
				$tasks = '';
				$this->db->where($where);
				if($project_ids)$this->db->where_in("project_id",$project_ids);
				$theTask = $this->db->get_where("view_task",array("job_id"=>$job->job_id))->result();
				// exit($this->db->last_query());
				foreach ($theTask as $task)
				{
					$level = preg_replace("/[^0-9]/",'',$task->task_level);
					$tasks .= "<tr class='status-{$task->task_status}'>
						<td><ol><li>".str_replace(",","<li>",$task->user_name)."</td>
						<td>{$task->task_title}</td>
						<td>{$task->task_deadline}</td>
						<td>{$task->task_finish}</td>
						<td>
							<div class='bar bar-{$level}' style='width:{$level}%'>{$level}</div>
						</td>
						<td>{$task->task_status}</td>
					</tr>";
				}
				if($tasks == '')continue;
				$jobs .= "<tr style='background-color:#d5d5d5'>
							<th colspan='6'>JOB : {$job->job_title} ".date("D ,d F Y",strtotime($job->job_datestart))."</th>
						</tr>
						<tr style='background-color:#F2EDA2'>
							<th>Team / Developer</th>
							<th>Task</th>
							<th width='130px'>Deadline</th>
							<th width='130px'>Finish</th>
							<th width='60px'>Level</th>
							<th width='60px'>Status</th>
						</tr>".$tasks;
			}
			if($jobs == '')continue;
			$output.= "<div class='container'>
						<div class='sub-container'>
							<h1>
								{$o->client_name}. {$o->project_title} <small><em>[{$o->project_env}]</em></small>
								<br>
								<small>{$from} &raquo; {$to}</small>
							</h1>
							<hr>
							<table class='table' border='1'>
								{$jobs}
							</table>
						</div>
					</div>";
		}
		return '<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<title>Task Report</title>
				<style>
					body{
						margin:0;
						font-family:arial;
						color:#333;
						font-size:12px;
					}
					.container{
						display:block;
						width:100%;
						border-bottom:5px double #d5d5d5;
						position:relative;
					}
					.sub-container{
						padding:5px;
					}
					hr{
						border-top:0;
						border-left:0;
						border-bottom:1px solid #d5d5d5;
						height:1px;
						border-right:0;
						background-color:transparent;
					}
					table{
						width:100%;
						border-collapse:separate;
						border-spacing:0;
					}
					th,td{
						vertical-align:top;
					}
					ul,ol{
						margin:0;
					}
					h1{
						text-align:center;
					}
					
					.bar{
						display:block;
						width:100%;
						line-height:20px;
						font-weight:bold;
					}
					.bar-25{
						background-color:#ff0000;
						color:#fff;
					}
					.bar-50{
						background-color:#FFA500;
						color:#333;
					}
					.bar-75{
						background-color:#ffff00;
						color:#333;
					}
					.bar-100{
						background-color:#0000ff;
						color:#fff;
					}
					.status-waiting,.status-progress,.status-revision{
						background-color:#E41E1E;
						color:#fff;
					}
				</style>
			</head>
			<body>
				'.$output.'
			</body>
		</html>';
	}
}
