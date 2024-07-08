<?php
require_once('vendor/autoload.php');
define('DEBUG', false);


// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
    // you want to allow, and if so:
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        // may also be using PUT, PATCH, HEAD etc
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}

header('Content-type: application/json');



// ====================================
// SODIUM SIGN FLOW
// ====================================
// $sign_seed = random_bytes(SODIUM_CRYPTO_SIGN_SEEDBYTES);
// var_dump($sign_seed);
// $sign_pair = sodium_crypto_sign_seed_keypair($sign_seed);

// $sign_pair = sodium_crypto_sign_keypair();
// var_dump($sign_pair);
// $sign_secret = sodium_crypto_sign_secretkey($sign_pair);
// $sign_public = sodium_crypto_sign_publickey($sign_pair);
// var_dump($sign_secret);
// var_dump($sign_public);

// //--------------------------------------------------
// // Person 1, signing

// $message = 'Hello';

// $signature = sodium_crypto_sign_detached($message, $sign_secret);
// var_dump($signature);
// $buffer = array_map(function($value){
//     return ord($value);
// },str_split($signature));
// var_dump($buffer);


if($_SERVER['REQUEST_METHOD'] == 'GET'){

    echo json_encode([
        "statement" => "Clicking Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee.",
        "version" => "1",
        "nonce" => "oBbLoEldZs",
        "chainId" => "mainnet",
        "issuedAt" => date("c"),
        "resources" => ["https://solana-phantom.ratersapp.com", "https://phantom.app/"]
    ]);

}

function not_valid_response($message){
    echo json_encode(['valid' => false, 'message' =>$message]);
}

// For test
$text = "localhost:3000 wants you to sign in with your Solana account:
8bByRAc5GnCwBdXiupaHcuZietJHYyLkEpdqFynCYYdG

Clicking Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee.

Version: 1
Chain ID: mainnet
Nonce: oBbLoEldZs
Issued At: 2024-06-17T12:11:43.537Z
Resources:
- https://example.com
- https://phantom.app/";


const DOMAIN = "(?<domain>[^\\n]+?) wants you to sign in with your Solana account:\\n";
const ADDRESS = "(?<address>[^\\n]+)(?:\\n|$)";
const STATEMENT = '(?:\\n(?<statement>[\\S\\s]*?)(?:\\n|$))?';
const URI = '(?:\\nURI: (?<uri>[^\\n]+))?';
const VERSION = '(?:\\nVersion: (?<version>[^\\n]+))?';
const CHAIN_ID = '(?:\\nChain ID: (?<chainId>[^\\n]+))?';
const NONCE = '(?:\\nNonce: (?<nonce>[^\\n]+))?';
const ISSUED_AT = '(?:\\nIssued At: (?<issuedAt>[^\\n]+))?';
const EXPIRATION_TIME = '(?:\\nExpiration Time: (?<expirationTime>[^\\n]+))?';
const NOT_BEFORE = '(?:\\nNot Before: (?<notBefore>[^\\n]+))?';
const REQUEST_ID = '(?:\\nRequest ID: (?<requestId>[^\\n]+))?';
const RESOURCES = '(?:\\nResources:(?<resources>(?:\\n- [^\\n]+)*))?';
const FIELDS = URI . VERSION . CHAIN_ID . NONCE . ISSUED_AT . EXPIRATION_TIME . NOT_BEFORE . REQUEST_ID . RESOURCES;
const MESSAGE = '/^' . DOMAIN . ADDRESS . STATEMENT . FIELDS . "\\n*$/im";

// echo "\nMessage:\n";
// echo $text;
// echo "\nRegex:\n";
// echo MESSAGE;
// preg_match_all(MESSAGE, $text, $match);

// echo "\nOutput:\n";

// var_dump($match);


function parse_SignIn_MessageText($text){
    preg_match_all(MESSAGE, $text, $groups); 
    if (!$groups) return null;

    return [
        "domain" => $groups['domain'][0],
        "address" => $groups['address'][0],
        "statement" => $groups['statement'][0],
        "uri" => $groups['uri'][0],
        "version" => $groups['version'][0],
        "nonce" => $groups['nonce'][0],
        "chainId" => $groups['chainId'][0],
        "issuedAt" => $groups['issuedAt'][0],
        "expirationTime" => $groups['expirationTime'][0],
        "notBefore" => $groups['notBefore'][0],
        "requestId" => $groups['requestId'][0],
        "resources" => $groups['resources'][0]
    ];
}




if($_SERVER['REQUEST_METHOD'] == 'POST'){
    $base58 = new StephenHill\Base58();
    $entityBody = file_get_contents('php://input');
    if(!$entityBody) return not_valid_response('Body not fount.');


    extract( json_decode($entityBody, true) ); // signature, message, publicKey
    if(!$signature || !isset($signature['data'])) return not_valid_response('Signature not fount.');
    if(!$message) return not_valid_response('Message not fount.');
    if(!$publicKey) return not_valid_response('PublicKey not fount.');
    $parsed_massage = parse_SignIn_MessageText($message);
    //check nonce
    if(DEBUG) var_dump( $parsed_massage ); 
    if(DEBUG) var_dump( $signature['data'] );

    $publicKey = $base58->decode($publicKey);
    if(DEBUG) var_dump($publicKey);

    // Conver ArrayBuffer JS Type to String of Char codes (utf-8).
    $char_signature = implode('', array_map(function($value){
        return chr($value);
    }, $signature['data']));

    $message_valid = sodium_crypto_sign_verify_detached($char_signature, $message, $publicKey);
    if(DEBUG) var_dump($message_valid);
    echo json_encode(['valid' => $message_valid]);
}