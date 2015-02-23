<?php

class Syspath extends CI_Model
{
	private $id = 0;
	private $_path;
	function __construct()
	{
		parent::__construct();
		$this->load->helper('file');
		$this->load->model("stored_manager","store");
		$this->_path = $this->config->item("ide_path");
	}
	
	private function _filter_path($file_path)
	{
		if(substr($file_path,0,1) != "/")return $file_path;
		return substr($file_path,strlen($this->_path));
	}
	
	function set_user($id)
	{
		$this->id = $id;
		return $this;
	}
	
	function file_read($file_path)
	{
		if(!file_exists($file_path))
		{
			return "File ".$this->_filter_path($file_path)." has been removed or does not exists";
		}
		
		$file_size = get_file_info($file_path, "size")["size"];
		if( $file_size/1000000 > 1)
		{
			return "Sorry this file cannot to open.".
			"\nFile size : ".$this->formatBytes($file_size).
			"\nMaximum Requirement: ".$this->formatBytes(1000000);
		}
		$data = read_file($file_path);
		$this->store->set_version($this->id,$this->_filter_path($file_path),'read',$data,"read file");
		return $data;
	}
	
	function file_write($file_path,$content="")
	{
		$isNew = file_exists($file_path) ? FALSE : TRUE;
		if(!is_dir($file_path) && write_file($file_path,$content))
		{
			$type = "update";
			if($isNew)
				$type = "create";
			$this->store->set_file($this->_filter_path($file_path));
			$this->store->set_version($this->id,$this->_filter_path($file_path),$type,$content,$type." file");
			return TRUE;
		}
		return FALSE;
	}
	
	function file_delete($file_path)
	{
		if(is_dir($file_path))
		{
			if(!@rmdir($file_path,TRUE))exec("rm -rf {$file_path}");
			$this->store
			->set_file($file_path)
			->set_version($this->id,$file_path,'delete','','delete folder');
			return TRUE;
		}
		elseif(file_exists($file_path))
		{
			$file_content = read_file($file_path);
			if(@unlink($file_path))
			{
				$this->store
				->set_file($this->_filter_path($file_path))
				->set_version($this->id,$this->_filter_path($file_path),'delete',$file_content,'delete file');	
			}
			return TRUE;
		}
		return FALSE;
	}
	
	function file_icon($file_path)
	{
		$file = strtolower(pathinfo($file_path,PATHINFO_EXTENSION));
		$type = array(
			'image' => array(
				'type' => explode(" ","png jpg jpeg gif"),
				'icon' => 'picture'
			),
			'archive' => array(
				'type' => explode(" ","zip tar bz2 gz bz xz rar deb"),
				'icon' => 'zip'
			),
			'application' => array(
				'type' => explode(" ","exe bin"),
				'icon' => 'application'
			),
			'database' => array(
				'type' => explode(" ","db sqlite sql dbf fbk"),
				'icon' => 'db'
			),
			'code' => array(
				'type' => explode(" ","py cgi"),
				'icon' => 'code'
			),
			'linux' => array(
				'type' => explode(" ","sh bin rpm"),
				'icon' => 'linux'
			),
			'java' => array(
				'type' => explode(" ","java class jsp"),
				'icon' => 'java'
			),
			'script' => array(
				'type' => explode(" ","js json jsonp config"),
				'icon' => 'js'
			),
			'movie' => array(
				'type' => explode(" ","mpeg wmv avi flv"),
				'icon' => 'film'
			),
			'document' => array(
				'type' => explode(" ","doc odf docx"),
				'icon' => 'doc'
			),
			'hypertext' => array(
				'type' => explode(" ","html xml xhtml"),
				'icon' => 'html'
			),
			'php' => array(
				'type' => explode(" ","php phps"),
				'icon' => 'php'
			),
			'stylesheet' => array(
				'type' => explode(" ","css sass scss"),
				'icon' => 'css'
			),
			'pdf' => array(
				'type' => array('pdf'),
				'icon' => 'pdf'
			),
			'audio' => array(
				'type' => explode(" ","mp3 odg mp4"),
				'icon' => 'music'
			),
			'spreadsheet' => array(
				'type' => explode(" ","xls xlsx csv"),
				'icon' => 'xls'
			),
			'text' => array(
				'type' => explode(" ","txt text md dist ini conf"),
				'icon' => 'txt'
			)
		);
		
		foreach($type as $tp)
		{
			if(in_array($file,$tp['type']))
			{
				return "public/img/{$tp['icon']}.png";
				break;
			}
		}
		return "public/img/file.png";
	}
	
	function file_list($path,$file)
	{
		if(!is_dir($path.$file))
			return FALSE;
		$output = array();
		$directories = array();
		$files = array();
		$registered = array();
		$type_folder = "Type: Folder<br />Last Modified: %s";
		$type_file = "Type: %s<br />Last Modified: %s<br />Size: %s";
		foreach(get_dir_file_info($path.$file) as $file)
		{
			if(in_array($file["name"],$registered))continue;
			
			$modified = date("M j, Y, g:i a",$file["date"]);
			$size = $this->formatBytes($file["size"]);
			$id = substr($file["relative_path"]."/".$file["name"],strlen($path));
			$registered[] = $file["name"];
			
			if(is_dir($file["server_path"]))
			{
				$directories[] = array(
					"text"	=> $file["name"],
					"size"	=> $size,
					"cls"	=> "folder",
					"qtip"	=> sprintf($type_folder,$modified),
					"id"	=> $id
				);
			}
			else
			{
				$files[] = array(
					"text"	=> $file["name"],
					"size"	=> $size,
					"cls"	=> "file",
	                "icon" => $this->file_icon($file["server_path"]),
					"qtip"	=> sprintf($type_file,get_mime_by_extension($file["name"]),$modified,$this->formatBytes($file["size"])),
					"id"	=> $id,
					"leaf"	=> TRUE,
					"prop" => $file
				);
			}
		}
		
		asort($directories);
		asort($files);
		foreach($directories as $i)
		{
			$output[] = $i;
		}
		foreach($files as $f)
		{
			$output[] = $f;
		}
		return $output;
	}
	
	function file_create($file_path)
	{
		if(!file_exists($file_path))
		{
			if(!write_file($file_path,""))
			{
				return FALSE;
			}
			else
			{
				$this->store
				->set_file($this->_filter_path($file_path))
				->set_version($this->id,$this->_filter_path($file_path),'create','','create file');
				return TRUE;
			}
		}
		return FALSE;
	}
	
	function file_rename($from,$to)
	{
		if(file_exists($to) || is_dir($to))
			return FALSE;
		if(!@rename($from,$to))
			return FALSE;
		
		$this->store
		->set_file($this->_filter_path($to))
		->set_version($this->id,$this->_filter_path($from),'rename')
		->set_version($this->id,$this->_filter_path($to),'create',NULL,'create from rename');
		return TRUE;
	}
	
	function file_paste($from,$to,$type)
	{
		if(preg_replace("/[^a-zA-Z0-9]/","",$to) == "" || file_exists($to) || is_dir($to))
			return FALSE;
		$type = "move";
		if($type == "cut")
		{
			$paste = $this->file_rename($from,$to);
			$this->file_delete($from);
		}
		else
		{
			$type = "copy";
			$paste = $this->file_copy($from,$to);
		}
		
		$content = is_dir($to) ? '' : (file_exists($to) ? read_file($to) : '' );
		$this->store->set_file($this->_filter_path($to))
		->set_version($this->id,$this->_filter_path($from),$type,'',$type.' to '.$this->_filter_path($to))
		->set_version($this->id,$this->_filter_path($to),'create',$content,$type.' from '.$this->_filter_path($from));
		
		return $paste;
	}
	
	function dir_create($path)
	{
		if(!file_exists($path) && !is_dir($path))
		{
			if(!@mkdir($path))
			{
				return FALSE;
			}
			else
			{
				$this->store->set_file($this->_filter_path($path))
				->set_version($this->id,$this->_filter_path($path),'create','','create folder');
				return TRUE;
			}
		}
		return FALSE;
	}
	
	function file_copy($source, $dest)
	{
		// Check for symlinks
		if (is_link($source)) {
		    return symlink(readlink($source), $dest);
		}

		// Simple copy for a file
		if (is_file($source)) {
		    return copy($source, $dest);
		}

		// Make destination directory
		if (!is_dir($dest)) {
		    mkdir($dest);
		}

		// Loop through the folder
		$dir = dir($source);
		while (false !== $entry = $dir->read()) {
		    // Skip pointers
		    if ($entry == '.' || $entry == '..') {
		        continue;
		    }
		    // Deep copy directories
		    $this->file_copy("$source/$entry", "$dest/$entry");
		}

		// Clean up
		$dir->close();
		return TRUE;
	}
	
	function file_upload($path_dir,$files)
	{
		$f = isset($files["fileupload"]) ? $files["fileupload"] : FALSE;
		if($f){
			if(move_uploaded_file($f["tmp_name"],$path_dir.$f["name"])){
				$output = array(
					"file" => $f["name"],
					"path" => $path_dir,
					"type" => $f["type"],
					"size" => (double)$f["size"],
					"success" => TRUE
				);
				$file_path = $path_dir.$f["name"];
				$this->store
				->set_file($this->_filter_path($file_path))
				->set_version($this->id,$this->_filter_path($file_path),'create','untrusted source','create file from upload');
				@chmod($path_dir.$f["name"],0777);
			}
		}
		else{
			$output = array(
				"file" => NULL,
				"path" => $path_dir,
				"type" => NULL,
				"size" => 0,
				"success" => FALSE
			);
		}
		
		return $output;
	}
	
	/*
	 * written by extjs
	 */ 
	function formatBytes($val, $digits = 3, $mode = 'SI', $bB = 'B'){ //$mode == 'SI'|'IEC', $bB == 'b'|'B'
		$si = array('', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y');
		$iec = array('', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi');
		switch(strtoupper($mode)) {
		   case 'SI' : $factor = 1000; $symbols = $si; break;
		   case 'IEC' : $factor = 1024; $symbols = $iec; break;
		   default : $factor = 1000; $symbols = $si; break;
		}
		switch($bB) {
		   case 'b' : $val *= 8; break;
		   default : $bB = 'B'; break;
		}
		for($i=0;$i<count($symbols)-1 && $val>=$factor;$i++)
		   $val /= $factor;
		$p = strpos($val, '.');
		if($p !== false && $p > $digits) $val = round($val);
		elseif($p !== false) $val = round($val, $digits-$p);
		return round($val, $digits) . ' ' . $symbols[$i] . $bB;
	}
}
