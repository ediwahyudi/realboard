<?php

class Manager extends CI_Controller
{
	private $file,$node,$path;
	function __construct()
	{
		parent::__construct();
		$this->load->model(array("syspath","output_manager"));
		$this->file = $this->input->get("file");
		$this->path = rtrim("/home/morkid/ftp/","/")."/";//$this->input->get("path");
		$this->node = $this->input->get("node");
	}
	
	function index()
	{
		$this->output_manager->json_output(FALSE);
	}
	
	function getList()
	{
		if(!$this->node || strpos($this->node, '..') !== false)exit;
		
		$data = $this->syspath->file_list($this->path,$this->node);
		$this->output_manager->json_output($data,TRUE);
	}
	
	function getContentData()
	{
		if(!$this->file)exit;
		
		$data = $this->syspath->file_read($this->path.$this->file);
		$this->output_manager->json_output($data);
	}
	
	function sendContentData()
	{
		$this->file = $this->path.$this->input->post("file");
		$output = $this->syspath->file_write($this->file,$this->input->post("data"));
		$this->output_manager->json_output($output);
	}
	
	function sendDelete()
	{
		$this->syspath->file_delete($this->path.$this->file);
		$this->output_manager->json_output($this->file);
	}
	
	function sendNewFile()
	{
		$file = $this->path.$this->node."/".$this->file;
		$output = $this->syspath->file_write($file);
		$this->output_manager->json_output($output);
	}
	
	function sendNewDir()
	{
		$output = $this->syspath->dir_create($this->path.$this->node."/".$this->file);
		$this->output_manager->json_output($output);
	}
	
	function sendRename()
	{
		$output = $this->syspath->file_rename($this->path.$this->node,$this->path.$this->file);
		$this->output_manager->json_output($output);
	}
	
	function sendPaste()
	{
		$type = $this->input->get("type");
		$output = $this->syspath->file_paste($this->path.$this->file,$this->path.$this->node,$type);
		$this->output_manager->json_output($output);
	}
	
	function sendUpload()
	{
		if(isset($_REQUEST["path"])) {
			$output = $this->syspath->file_upload($this->path.$_REQUEST["path"],$_FILES);
			//echo json_encode($output);
			$this->output_manager->json_output($output);
		}
	}
	
	function sendSignin()
	{
		$user_email = $this->input->post("uid");
		$user_password = $this->input->post("passwd");
		$output = NULL;
		if($user_email == "morkid@gmail.com" && $user_password == "123456")
		{
			$output = array(
				"user"	=> $user_email,
				"ip"	=> $_SERVER['REMOTE_ADDR'],
				"time"	=> date("Y-m-d H:i:s"));
		}
		$this->output_manager->json_output($output);
	}
}
