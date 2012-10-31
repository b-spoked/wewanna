<?php
require_once 'config.php';
class Note {
	public $noteData;
	public $commentData;

	static $FIELDS = array('name', 'description','address','latitude','longitude','tags','rating');

	function __construct(){
		$this->noteData = new NoteData();
		$this->commentData = new CommentData();
	}

	function get($id=NULL) {
		return is_null($id) ? $this->noteData->getAll() : $this->noteData->get($id);
	}
	
	/**
	* @url GET /tag/:tag/
	*/
	function getByTag($tag=NULL) {
	    
		return $this->noteData->getByTag($tag);
	    
	}
	
	/**
	* @url GET /filter/:filters/
	*/
	function getByFilter($filters=NULL) {
	    
		return $this->noteData->getByFilter($filters);
	}
	
	/**
	* @url GET /date/:start/:finish/
	*/
	function getByDate($start=NULL,$finish=NULL) {
	    
		return $this->noteData->getByDate($start,$finish);
	    
	}
	
	/**
	* @url PUT /address/:id/:address/
	*/
	function putAddress($id=NULL,$address=NULL)
	{    
		return $this->noteData->updateAddress($id,$address);   
	}
	
	/**
	* @url POST /comment/
	*/
	function postComment($comment_data=NULL)
	{	
		return $this->commentData->insert($comment_data);
	}
	
	/**
	* @url GET /comments/
	*/
	function getComments($noteID=NULL)
	{	
		return $this->commentData->getAllForNote($noteID);
	}
	
	function post($request_data=NULL) {
		return $this->noteData->insert($this->_validate($request_data));
	}
	function put($id=NULL, $request_data=NULL) {
		return $this->noteData->update($id, $this->_validate($request_data));
	}
	function delete($id=NULL) {
		return $this->noteData->delete($id);
	}

	private function _validate($data){
		$note=array();
		foreach (Note::$FIELDS as $field) {
//you may also vaildate the data here
			if(!isset($data[$field]))throw new RestException(417,"$field field missing");
			$note[$field]=$data[$field];
		}
		return $note;
	}
}