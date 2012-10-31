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
class NoteData
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
            $sql = 'SELECT * FROM notes WHERE id = ' . mysql_escape_string(
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
    function getAll ($installTableOnFailure = FALSE)
    {
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        try {
            $stmt = $this->db->query('SELECT * FROM notes');
            return $this->id2int($stmt->fetchAll());
        } catch (PDOException $e) {
            if (! $installTableOnFailure && $e->getCode() == '42S02') {
//SQLSTATE[42S02]: Base table or view not found: 1146 Table 'authors' doesn't exist
                $this->install();
                return $this->getAll(TRUE);
            }
            throw new RestException(501, 'MySQL: ' . $e->getMessage());
        }
    }
    
    function getByFilter($filters,$installTableOnFailure = FALSE)
    {
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        parse_str($filters,$values);
        $location = $values['locationfilter'];
	$type = $values['typefilter'];
        
        try {
            $query = "SELECT * FROM notes WHERE address LIKE '%{$location}%'";
	    
	    if($type){
		$query .= " AND name LIKE '%{$type}%' OR description LIKE '%{$type}%'";
	    }
	    
            $stmt = $this->db->query($query);
            return $this->id2int($stmt->fetchAll());
        } catch (PDOException $e) {
            if (! $installTableOnFailure && $e->getCode() == '42S02') {
//SQLSTATE[42S02]: Base table or view not found: 1146 Table 'authors' doesn't exist
                $this->install();
                return $this->getAll(TRUE);
            }
            throw new RestException(501, 'MySQL: ' . $e->getMessage());
        }
    }
    
    function getByTag($tag, $installTableOnFailure = FALSE){
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        try {
            
            $stmt = $this->db->query("SELECT * FROM notes WHERE tags LIKE '%{$tag}%'");
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
        $description = mysql_escape_string($rec['description']);
        $address = mysql_escape_string($rec['address']);
        $latitude = mysql_escape_string($rec['latitude']);
        $longitude = mysql_escape_string($rec['longitude']);
        $tags = mysql_escape_string($rec['tags']);
        $rating = mysql_escape_string($rec['rating']);
        
        $addedby = 1;
        $sql = "INSERT INTO notes (name,description,address,latitude,longitude, tags,rating,addedby,addedon) VALUES ('$name', '$description','$address','$latitude','$longitude','$tags','$rating','$addedby',CURDATE())";  
        if (! $this->db->query($sql))
            return FALSE;
        return $this->get($this->db->lastInsertId());
    }
    
    function update ($id, $rec)
    {
        $id = mysql_escape_string($id);
        $name = mysql_escape_string($rec['name']);
        $description = mysql_escape_string($rec['description']);
        $address = mysql_escape_string($rec['address']);
        $latitude = mysql_escape_string($rec['latitude']);
        $longitude = mysql_escape_string($rec['longitude']);
        $tags = mysql_escape_string($rec['tags']);
        $rating = mysql_escape_string($rec['rating']);
        $sql = "UPDATE notes SET name = '$name', description ='$description', address ='$address', latitude ='$latitude',longitude ='$longitude', tags='$tags', rating='$rating'  WHERE id = $id";
        if (! $this->db->query($sql))
            return FALSE;
        return $this->get($id);
    }
    
    function updateAddress ($id, $address)
    {
        $id = mysql_escape_string($id);
        $address = mysql_escape_string($address);
        $sql = "UPDATE notes SET address ='$address' WHERE id = $id";
        if (! $this->db->query($sql))
            return FALSE;
        return $this->get($id);
    }
    
    function delete ($id)
    {
        $r = $this->get($id);
        if (! $r || ! $this->db->query(
        'DELETE FROM notes WHERE id = ' . mysql_escape_string($id)))
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
        "CREATE TABLE notes (
            id INT AUTO_INCREMENT PRIMARY KEY ,
            name TEXT NOT NULL ,
            description TEXT NOT NULL,
            address TEXT NOT NULL,
            latitude TEXT NOT NULL,
            longitude TEXT NOT NULL,
            tags TEXT,
            rating INT,
            userID INT,
            addedon DATE
        );");
        
        $this->db->exec(
        "INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Beach Walk','Beach loop from the back beach ending at the playground','Back Beach Road, Tahunanui, Demovile','-41.285974','173.23166','Walk, Beach, Playground',3,1,CURDATE());
        INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Valley Playground','A great little playground that has become a family fav with a new play house and good swings','Pioneer Park, Washington Valley, Demovile','-41.272525','173.275487','Playground, Swings',3,1,CURDATE());
        INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Model Train Ride','A hit with the whole family are the great train rides at the modelers pond - they even have Thomas!','Modelers pond, Tahunanui, Demovile','-41.281806','173.24388','Trains, Beach',5,1,CURDATE());
        INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Park','A good size park with lots of trees to climb and heaps of room to play cricket or kick around a ball','Back Beach Road, Tahunanui, Demovile','-41.285974','173.23166','Park, Field',3,1,CURDATE());
        INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Toilets','Clean toilets with a change table for the little ones','Pioneer Park, Washington Valley, Demovile','-41.272525','173.275487','Toilets, Change table',3,1,CURDATE());
        INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Park and Lake','Big park with trees, lots of grass a small lake and plenty of wildlife','Big Park, Tahunanui, Demovile','-41.281806','173.24388','Ducks, Lake, Park, Field',5,1,CURDATE());
        INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Forrest Walk','Walk through native forrest - nice wide track that is flat and suited to buggy or kids on small bikes','Back Beach Road, Tahunanui, Demovile','-41.285974','173.23166','Walk, Bush',3,1,CURDATE());
        INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Museum','This Museum is great on a rainey day (or any day actually) with exhibits aimed at the kids and that are interactive to keep them entertained.','Pioneer Park, Washington Valley, Demovile','-41.272525','173.275487','Rainy Day',3,1,CURDATE());
        INSERT INTO notes (name, description,address,latitude,longitude,tags,rating,userID,addedon) VALUES ('Demo Big Playground','Playground that suits all ages (well under 10) with a seprate toddlers area. Swings, slides, climbing structures','Big Park, Tahunanui, Demovile','-41.281806','173.24388','Playground, Swings, Slide',5,1,CURDATE());
            ");
    }
}