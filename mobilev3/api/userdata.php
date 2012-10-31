<?php
/**
 * MySQL DB. All data is stored in data_pdo_mysql database
 * Create an empty MySQL database and set the dbname, username
 * and password below
 * 
 * This class will create the table with sample data
 * automatically on first `get` or `get($id)` request
 */
require_once 'config.php';
class UserData
{
    private $db;
    function __construct(){
	
	try {
            $this->db = new PDO(DB_SERVER, DB_USER, DB_PASSWORD);
            $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, 
            PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new RestException(501, 'MySQL: ' . $e->getMessage());
        }
     }
    
    function get ($id, $installTableOnFailure = FALSE)
    {
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        try {
            $sql = 'SELECT * FROM user WHERE id = ' . mysql_escape_string(
            $id);
            return $this->id2int($this->db->query($sql)
                ->fetch());
        } catch (PDOException $e) {
            if (! $installTableOnFailure && $e->getCode() == '42S02') {
//SQLSTATE[42S02]: Base table or view not found: 1146 Table 'authors' doesn't exist
                $this->install();
                return $this->get($id, TRUE);
            }
            throw new RestException(501, 'MySQL: ' . $e->getMessage());
        }
    }
    
    
    function getByEmail($email, $installTableOnFailure = FALSE){
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        try {
            
            $stmt = $this->db->query("SELECT * FROM user WHERE email = '{$email}'");
            return $this->id2int($stmt->fetchAll());
            
        } catch (PDOException $e) {
            if (! $installTableOnFailure && $e->getCode() == '42S02') {
//SQLSTATE[42S02]: Base table or view not found: 1146 Table 'authors' doesn't exist
                $this->install();
                return $this->get($id, TRUE);
            }
            throw new RestException(501, 'MySQL: ' . $e->getMessage());
        }
    }
    
    function getNotes($id, $installTableOnFailure = FALSE){
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        try {
            
            $stmt = $this->db->query("SELECT id, name, description,address,latitude,longitude,tags,rating FROM notes WHERE addedby = '{$id}'");
            return $this->id2int($stmt->fetchAll());
            
        } catch (PDOException $e) {
            if (! $installTableOnFailure && $e->getCode() == '42S02') {
//SQLSTATE[42S02]: Base table or view not found: 1146 Table 'authors' doesn't exist
                $this->install();
                return $this->get($id, TRUE);
            }
            throw new RestException(501, 'MySQL: ' . $e->getMessage());
        }
    }
    
    function insert ($rec)
    {
        $name = mysql_escape_string($rec['name']);
        $email = mysql_escape_string($rec['email']);
	
        $sql = "INSERT INTO user (name,email) VALUES ('$name', '$email')";  
        if (! $this->db->query($sql))
            return FALSE;
        return $this->get($this->db->lastInsertId());
    }
    
    function update ($id, $rec)
    {
       $name = mysql_escape_string($rec['name']);
        $email = mysql_escape_string($rec['email']);
	
        $sql = "UPDATE user SET name = '$name', email ='$email'  WHERE id = $id";
        if (! $this->db->query($sql))
            return FALSE;
        return $this->get($id);
    }
    
    function delete ($id)
    {
        $r = $this->get($id);
        if (! $r || ! $this->db->query(
        'DELETE FROM user WHERE id = ' . mysql_escape_string($id)))
            return FALSE;
        return $r;
    }
    private function id2int ($r)
    {
        if (is_array($r)) {
            if (isset($r['id'])) {
                $r['id'] = intval($r['id']);
            } else {
                foreach ($r as &$r0) {
                    $r0['id'] = intval($r0['id']);
                }
            }
        }
        return $r;
    }
    private function install ()
    {
        $this->db->exec(
        "CREATE TABLE user (
            id INT AUTO_INCREMENT PRIMARY KEY ,
            name TEXT NOT NULL ,
            email TEXT NOT NULL,
            addedon DATE
        );");
	
	//rcommended places relationship
	$this->db->exec(
        "CREATE TABLE UserRecommendedPlace
	(
	    user_id INT REFERENCES user (id),
	    recommended_id INT REFERENCES notes (id),
	    PRIMARY KEY (user_id, recommended_id)
	);");
	//todo places relationship
	$this->db->exec(
        "CREATE TABLE UserToDoPlace
	(
	    user_id INT REFERENCES user (id),
	    todo_id INT REFERENCES notes (id),
	    PRIMARY KEY (user_id, todo_id)
	);");
	//create places relationship
	$this->db->exec(
        "CREATE TABLE UserCreatedPlace
	(
	    user_id INT REFERENCES user (id),
	    created_id INT REFERENCES notes (id),
	    PRIMARY KEY (user_id, created_id)
	);");
	//demo data
	$this->db->exec(
        "INSERT INTO user (name, email,addedon) VALUES ('Demo Dave','demo.dave@whatwewanna.co.nz',CURDATE());
        INSERT INTO user (name, email,addedon) VALUES ('Demo Daisy','demo.daisey@whatwewanna.co.nz',CURDATE());
	INSERT INTO user (name, email,addedon) VALUES ('Demo Donna','demo.donna@whatwewanna.co.nz',CURDATE());
            ");
    }
}