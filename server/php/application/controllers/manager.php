<?php

class Manager extends CI_Controller
{
	private $file,$node,$path,$user,$s,$id;
	function __construct()
	{
		parent::__construct();
		$this->load->model(array("syspath","output_manager"));
		$this->load->model("stored_manager","store");
		$this->path = rtrim($this->config->item("ide_path"),"/")."/";
		$this->file = $this->input->get("file");
		$this->user = $this->input->get("user");
		$this->node = $this->input->get("node");
		$this->id 	= $this->input->get("id");
		$this->s 	= $this->syspath->set_user($this->user);
	}
	
	function index()
	{
		$this->output_manager->json_output(FALSE);
	}
	
	function getList()
	{
		if(!$this->node || strpos($this->node, '..') !== false)exit;
		
		$data = $this->s->file_list($this->path,$this->node);
		$this->output_manager->json_output($data,TRUE);
	}
	
	function getContentData()
	{
		if(!$this->file)exit;
		
		$data = $this->s->file_read($this->path.$this->file);
		$this->output_manager->json_output($data);
	}
	
	function getContentChange()
	{
		if(!$this->file)exit;
		
		$data = $this->store->get_file_content($this->file);
		$this->output_manager->json_output($data);
	}
	
	function sendContentData()
	{
		$this->file = $this->path.$this->input->post("file");
		$output = $this->s->file_write($this->file,$this->input->post("data"));
		$this->output_manager->json_output($output);
	}
	
	function sendContentChange()
	{
		$this->file = $this->input->post("file");
		$this->store->set_file_content($this->file,$this->input->post("data"));
	}
	
	function sendDelete()
	{
		$this->s->file_delete($this->path.$this->file);
		$this->output_manager->json_output($this->file);
	}
	
	function sendNewFile()
	{
		$file = $this->path.$this->node."/".$this->file;
		$output = $this->s->file_create($file);
		$this->output_manager->json_output($output);
	}
	
	function sendNewDir()
	{
		$output = $this->s->dir_create($this->path.$this->node."/".$this->file);
		$this->output_manager->json_output($output);
	}
	
	function sendRename()
	{
		$output = $this->s->file_rename($this->path.$this->node,$this->path.$this->file);
		$this->output_manager->json_output($output);
	}
	
	function sendPaste()
	{
		$type = $this->input->get("type");
		$output = $this->s->file_paste($this->path.$this->file,$this->path.$this->node,$type);
		$this->output_manager->json_output($output);
	}
	
	function sendUpload()
	{
		if(isset($_REQUEST["path"])) {
			$output = $this->s->file_upload($this->path.$_REQUEST["path"],$_FILES);
			echo json_encode($output);
		}
	}
	
	function sendSignin()
	{
		$email = $this->input->post("uid");
		$password = $this->input->post("passwd");
		$output = $this->store->get_user($email,$password);
		$this->output_manager->json_output($output);
	}
	
	function sendSignout()
	{
		$this->store->get_signout($this->input->post("uid"));
		$this->output_manager->json_output(TRUE);
	}

	function sendOnline()
	{
		$this->store->set_online($this->user);
		$this->output_manager->json_output(TRUE);
	}

	function sendSign()
	{
		$this->store->set_sign($this->input->get("sign"),$this->user);
		$this->output_manager->json_output(TRUE);
	}
	
	function saveProfile()
	{
		$id = $this->input->post("uid");
		$user_data = array(
			'user_name'			=> $this->input->post("name"),
			'user_email'		=> $this->input->post("email"),
			'user_theme'		=> $this->input->post("theme"),
			'user_theme_ide'	=> $this->input->post("theme_ide"),
			'user_ide_engine'	=> $this->input->post("ide_engine"),
			'user_ip'			=> $this->input->post("ip"),
			'user_share'		=> $this->input->post("share"),
			'user_active'		=> $this->input->post("status"),
		);
		$passwd = $this->input->post("passwd");
		if($passwd)
			$user_data['user_password'] = md5($passwd);
		
		if(!$user_data["user_ide_engine"])
			$user_data["user_ide_engine"] = "ace";

		$data = $this->store->set_user($id,$user_data);
		$this->output_manager->json_output($data,TRUE);
	}
	
	function getThemes()
	{
		$data = $this->store->get_themes($this->file);
		$this->output_manager->json_output($data,TRUE);
	}
	
	function getMail()
	{
		$data = $this->store->get_email();
		$this->output_manager->json_output($data);
	}
	
	function getSign()
	{
		$data = $this->store->get_sign($this->user);
		$this->output_manager->json_output($data,TRUE);
	}

	function getSignToday()
	{
		$data = $this->store->get_sign_today();
		$this->output_manager->json_output($data,TRUE);
	}
	
	function getVersion()
	{
		$data = $this->store->get_version_data();
		$this->output_manager->json_output($data,TRUE);
	}
	
	function getRaw()
	{
		$data = $this->store->get_version_raw($this->id);
		$this->output_manager->json_output($data);
	}
	
	function getFiles()
	{
		$data = $this->store->get_files();
		$this->output_manager->json_output($data,TRUE);
	}
	
	function getUsers()
	{
		$data = $this->store->get_users($this->user,$this->id);
		$this->output_manager->json_output($data,TRUE);
	}
	
	function sendRemoveUser()
	{
		$data = $this->store->remove_user($this->user,$this->id);
		$this->output_manager->json_output($data);
	}

	function getClient()
	{
		$data = $this->store->get_client();
		$this->output_manager->json_output($data,TRUE);
	}

	function saveClient()
	{
		$data = array("client_name" => $this->input->post("client_name"));
		$output = $this->store->set_data("client",$data,$this->input->post("client_id"));
		$this->output_manager->json_output($output);
	}

	function removeClient()
	{
		$this->store->remove_data("client",$this->id);
		$this->output_manager->json_output(TRUE);
	}
	
	function getProject()
	{
		$data = $this->store->get_project();
		$this->output_manager->json_output($data,TRUE);
	}

	function saveProject()
	{
		$data = array(
			"project_title"	=> $this->input->post("project_title"),
			"project_env"	=> $this->input->post("project_env"),
			"project_date"	=> $this->input->post("project_date"),
			"client_id"		=> $this->input->post("client_id")
		);
		$output = $this->store->set_data("project",$data,$this->input->post("project_id"));
		$this->output_manager->json_output($output);
	}

	function removeProject()
	{
		$this->store->remove_data("project",$this->id);
		$this->output_manager->json_output(TRUE);
	}
	
	function getJob()
	{
		$data = $this->store->get_job($this->id);
		$this->output_manager->json_output($data,TRUE);
	}

	function saveJob()
	{
		$data = array(
			"project_id"	=> $this->input->post("project_id"),
			"job_title"		=> $this->input->post("job_title"),
			"job_desc"		=> $this->input->post("job_desc"),
			"job_status"	=> $this->input->post("job_status"),
			"job_datestart"	=> $this->input->post("job_datestart")
		);
		$output = $this->store->set_data("job",$data,$this->input->post("job_id"));
		$this->output_manager->json_output($output);
	}

	function removeJob()
	{
		$this->store->remove_data("job",$this->id);
		$this->output_manager->json_output(TRUE);
	}
	
	function getTask()
	{
		$data = $this->store->get_task($this->id);
		$this->output_manager->json_output($data,TRUE);
	}

	function saveTask()
	{
		$data = array(
			"task_title" 		=> $this->input->post("task_title"),
			"task_desc" 		=> $this->input->post("task_desc"),
			"task_status" 		=> $this->input->post("task_status"),
			"task_level" 		=> $this->input->post("task_level"),
			"task_deadlinedate"	=> $this->input->post("task_deadlinedate"),
			"task_deadlinetime"	=> $this->input->post("task_deadlinetime"),
			//"user_id"			=> $this->input->post("user_id"),
			"job_id"			=> $this->input->post("job_id")
		);
		if($data["task_status"] == "done")
		{
			$data["task_finishdate"] = date("Y-m-d");
			$data["task_finishtime"] = date("H:i:s");
		}
		$output = $this->store->set_data("task",$data,$this->input->post("task_id"));
		$this->store->set_multi_tasking($this->input->post("user_id"),$this->input->post("task_id"));
		$this->output_manager->json_output($output);
	}

	function getUserTask()
	{
		$where = array();
		$filters = array("task_status","project_env","job_status","project_id","job_id");
		foreach ($filters as $filter) {
			if($this->input->get($filter))
			{
				$where[$filter] = $this->input->get($filter);
			}
		}
		$table = "view_task_det";
		if($this->input->get("access") == "true")
		{
			$this->user = 0;
			$table = "view_task";
		}
		else{
			$where["task_status !="] =  "done";
		}
		$data = $this->store->get_task_detail($this->user,$where,$table);
		$this->output_manager->json_output($data,TRUE);
	}

	function getUserTaskList()
	{
		$data = $this->store->get_user_task($this->id);
		$this->output_manager->json_output($data,TRUE);	
	}

	function removeTask()
	{
		$this->store->remove_data("task",$this->id);
		$this->output_manager->json_output(TRUE);
	}
	
	function applyTask()
	{
		$data = array(
			"task_comment"	=> $this->input->post("task_comment"),
			"task_status"	=> $this->input->post("task_status")
		);
		if($data["task_status"] == "done")
		{
			$data["task_finishdate"] = date("Y-m-d");
			$data["task_finishtime"] = date("H:i:s");
		}
		$this->store->set_data("task",$data,$this->input->post("task_id"));
		$this->output_manager->json_output(TRUE);
	}

	function runMigrate()
	{
		//$this->store->migrate();
	}
	
	function getTaskReport()
	{
		$from = strtotime($this->input->get("from"));
		$to = strtotime($this->input->get("to"));
		
		$projects = $this->input->get("projects");
		if($projects && !is_array($projects))
			$projects = explode(",",$projects);

		$report = $this->store->get_task_report($from,$to,$projects);
		$this->output->set_output($report);
	}

}
