<?php
	/*
		### SAMPLE CALLS ###

		--> wordnet.php?action=lookup&terms=test-lookup

		{
		  "test": {
		    "foul": 0,
		    "wordid": 131658,
		    "pronunciation": "T EH1 S T",
		    "syllables": 1
		  },
		  "lookup": {
		    "foul": 0,
		    "wordid": 79160,
		    "pronunciation": "L UH1 K AH0 P",
		    "syllables": 2
		  }
		}

		--> wordnet.php?action=morph&terms=goose

		{
		  "goose": {
		    "morph": Array[1][
		      {
		        "morphid": 1684,
		        "morph": "geese"
		      }
		    ]
		  }
		}

		--> wordnet.php?action=define&terms=guest

		{
		  "guest": {
		    "definitions": Array[4][
		      {
		        "part": "noun",
		        "domain": "artifact",
		        "definition": "(computer science) any computer that is hooked up to a computer network"
		      },
		      {
		        "part": "noun",
		        "domain": "person",
		        "definition": "a visitor to whom hospitality is extended"
		      },
		      {
		        "part": "noun",
		        "domain": "person",
		        "definition": "a customer of a hotel or restaurant etc."
		      },
		      {
		        "part": "noun",
		        "domain": "person",
		        "definition": "United States journalist (born in England) noted for his syndicated homey verse (1881-1959)"
		      }
		    ]
		  }
		}
	*/

	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);

	header('Content-Type: application/json');

	$actions = ['default'];
	$words = '';

	if(isset($_GET['action'])){
		$actions = explode(',', (filter_var($_GET['action'], FILTER_SANITIZE_STRING)));	
	}

	if(isset($_GET['terms'])){
		$words = explode('-', (filter_var($_GET['terms'], FILTER_SANITIZE_STRING)));

		try{
			$conn = db_connect();
			$json = [];
			foreach($words as $word){
				$temp = [];
				foreach($actions as $action){
					switch($action){
						case 'morph':
							$temp += array('morph' => morph_word($conn, $word));
							break;
						case 'lookup':
							$temp = lookup($conn, $word);
							break;
						case 'define':
							$temp += array('definitions' => define_word($conn, $word));
							break;
						default:
							$temp = lookup($conn, $word);
							$temp += array('definitions' => define_word($conn, $word));
							$temp += array('morph' => morph_word($conn, $word));
					}	
				}
				$json += array($word => $temp);
			}
			print(json_encode($json, JSON_NUMERIC_CHECK));
			$conn->close();	
		} catch(RuntimeException $e){
			print(json_encode(array('ERROR' => $e->getMessage())));	
		}
	} else {
		print(json_encode(array('ERROR' => 'WORD_NOT_SET')));
	}
?>

<?php
	function db_connect(){
		$host = "localhost";
		$database = "wordnet";
		$username = "wordnet";
		$password = "ASvCMkCbUK0Ei8hb";

		/* create connection */
		$conn = new mysqli($host, $username, $password, $database);

		if(mysqli_connect_errno()) {
		    throw new RuntimeException(mysqli_connect_errno().": ".mysqli_connect_error());
		}

		return $conn;
	}
	
	function lookup($conn, $word){
		$query =  "SELECT COUNT(fid) AS foul FROM `badwords` WHERE word LIKE '".$word."';";
		$query .= "SELECT 
					words.wordid, 
					pronunciations.pronunciation, 
					pronunciations.syllables
						FROM `words` 
						LEFT JOIN pronunciations ON pronunciations.wordid = words.wordid
							WHERE words.lemma LIKE '".$word."';";

		$results = [];

		if (!$conn->multi_query($query)) {
		    $results = array("ERROR", $conn->errno.": ".$conn->error);
		}

		do {
		    if ($result = $conn->store_result()) {
	            while ($row = mysqli_fetch_assoc($result)) {
	                foreach($row as $key => $value){ 
	                	$results[$key] = $value; 
	                }
	            }
	            $result->free();
	        }
		} while ($conn->more_results() && $conn->next_result());

		return $results;
	}

	function morph_word($conn, $word){

		$query = "
		SELECT words.wordid, morphs.morphid, morphs.morph
		 FROM `words`
			INNER JOIN `morphmaps` ON words.wordid = morphmaps.wordid
			INNER JOIN `morphs` ON morphmaps.morphid = morphs.morphid
				WHERE words.lemma LIKE '".$word."'";

		$results = [];

		if ($result = mysqli_query($conn, $query)) {

		    /* fetch associative array */
		    while ($row = mysqli_fetch_assoc($result)){
		        array_push($results, array(
		        	'morphid' => $row['morphid'],
		        	'morph' => $row['morph']
		        ));
		    } if(!$results) {
		    	$results = 'No results';
		    }

		    /* free result set */
		    mysqli_free_result($result);
		}

		return $results;
	}

	function define_word($conn, $word){
		$query = "SELECT
					words.wordid,
					senses.synsetid,
					synsets.definition,
					lexdomains.lexdomainname
						FROM `words`
						INNER JOIN senses ON senses.wordid = words.wordid
						INNER JOIN synsets ON synsets.synsetid = senses.synsetid
						INNER JOIN lexdomains ON lexdomains.lexdomainid = synsets.lexdomainid
							WHERE words.lemma LIKE '".$word."'";

		$results = [];

		if ($result = mysqli_query($conn, $query)) {

		    /* fetch associative array */
		    while($row = mysqli_fetch_assoc($result)){
		    	$lex = explode('.', $row['lexdomainname']);
		        array_push($results, array(
		        	'part' => $lex[0],
		        	'domain' => $lex[1],     	
		        	'definition' => $row['definition']  		        	
		        ));
		    } if(!$results) {
		    	$results = 'No results';
		    }

		    /* free result set */
		    mysqli_free_result($result);
		}

		return $results;	
	}
?>