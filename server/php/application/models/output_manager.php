<?php

class Output_manager extends CI_Model
{
	function __construct()
	{
		parent::__construct();
	}
	
	function json_output($data,$single = FALSE)
	{
		$output = array(
				"data" => NULL,
				"success" => FALSE
			);
		$callback_var = "%s";
		if($data !== FALSE)
		{
			if(!$single)
			{
				$output["data"] = $data;
				$output["success"] = TRUE;
			}
			else
			{
				unset($output);
				$output = $data;
			}
		}
		
		if($this->input->get("callback"))
			$callback_var = $this->input->get("callback") . "(%s)";
		
		$this->output->set_content_type("application/json");
		$this->output->set_output(sprintf($callback_var,json_encode($output)));
	}
}
