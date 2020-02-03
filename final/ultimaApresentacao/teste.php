<?php 

class teste{

    function __construct(){

        if(isset($_GET['action']) ? $_GET['action'] : 0 != 0 ){
            if(method_exists($this, $_GET['action'])){
                    call_user_func(array($this, $_GET['action']));
            }
        }

    }

    public function arqJson(){
       $file = $_FILES['file'];
       $caminho = $_FILES['file']['tmp_name'];
       $json = file_get_contents($file['tmp_name']);
       $json_data = json_decode($json, true);
       echo  json_encode(array('data'=>$json_data));
   } 

   public function gravaJson(){
        $json_data = json_decode($_POST['json'], true);
        $fp = fopen('novoJson/out.json', 'w');
        fwrite($fp, json_encode($json_data));
        fclose($fp);
        echo  json_encode(array('data'=>$json_data));
   }
}

new teste();
?>