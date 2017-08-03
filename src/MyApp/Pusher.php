<?php
namespace MyApp;
use Ratchet\ConnectionInterface;
use Ratchet\Wamp\WampServerInterface;

class Pusher implements WampServerInterface {

    public function __construct() {
        $this->clients = new \SplObjectStorage;
    }    

    /**
     * A lookup of all the topics clients have subscribed to
     */
    
    protected $subscribedContents = array();
    protected $subscribedContentCounts = array();
    protected $userSubscriptions = array();

    public function onSubscribe(ConnectionInterface $conn, $content) {
        #var_dump($content->getId());
        $this->subscribedContents[$content->getId()] = $content;
        @$this->subscribedContentCounts[$content->getId()]++;

        $subscribers = array();
        $this->userSubscriptions[$conn->resourceId][$content->getId()] = 1;
        if ($content->getId() != 'message' && $content->getId() != 'dir' && $content->getId() != 'chatroom' && $content->getId() != 'getid') {
            foreach ($this->clients as $client) {
                if (@$this->userSubscriptions[$client->resourceId][$content->getId()] == 1) {
                    $subscribers[] = $client->resourceId;
                }
            }
            foreach ($this->clients as $client) {
                if (@$this->userSubscriptions[$client->resourceId][$content->getId()] == 1) {
                    $client->event('message', array('message' => json_encode($subscribers)));
                }
            }
        }
    }

    /**
     * @param string JSON'ified string we'll receive from ZeroMQ
     */
    public function onContentSaved($entry) {
        $entryData = json_decode($entry, true);

        // If the lookup topic object isn't set there is no one to publish to
        #if (!array_key_exists($entryData['category'], $this->subscribedContents)) {
        if (empty($entryData)) {
            return;
        }

        $contents = array();
        $dataToBroadCast = array();
        foreach ($entryData as $d) {
            $url = $d['data']['url'];
            // echo $url . "\n";
            $contents[$url] = $this->subscribedContents[$url];
            $dataToBroadCast[$url] = $d;
        }

        $meta = @$entryData['data']['$set']['meta'];
        // var_dump($entryData);

        // re-send the data to all the clients subscribed to that category
        #var_dump($this->subscribedContents);
        foreach ($contents as $url => $content) {
            if (!is_null($content)) {

                // $content->broadcast($dataToBroadCast[$url]);
                // implement broadcast to clients without event creator
                $subscribers = $content->getIterator();
                //*
                foreach ($subscribers as $client) {
                    if ($client->WAMP->sessionId != $dataToBroadCast[$url]['sessionId']) {
                        $client->event($content->getId(), array('viewed' => $dataToBroadCast[$url]));
                    }
                }
                //*/
            }
            else {
                echo "Hmm, no one subscribes.\n";
            }

        }
        //*
        if (!is_null($this->subscribedContents['dir'])) {
            $subscribers = $this->subscribedContents['dir']->getIterator();
            foreach ($subscribers as $client) {
                if ($client->WAMP->sessionId != $dataToBroadCast[$url]['sessionId']) {
                    echo "Mom i'm here\n";
                    $client->event('dir', array('effected' => $dataToBroadCast, 'meta' => $meta));
                }
            }
        }
        //*/
    }

    public function onUnSubscribe(ConnectionInterface $conn, $content) {
        // $this->subscribedContents[$content->getId()] = $content;
        @$this->subscribedContentCounts[$content->getId()]--;
        $this->userSubscriptions[$conn->resourceId][$content->getId()] = 0;
        if ($this->subscribedContentCounts[$content->getId()] == 0) {
            unset($this->subscribedContents[$content->getId()]);
            // var_dump($this->subscribedContents[$content->getId()]);
        }
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
        echo $conn->WAMP->sessionId . "\n";
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        unset($this->userSubscriptions[$conn->resourceId]);
        echo "Connection {$conn->resourceId} has disconnected\n";
        if ($this->subscribedContentCounts['chatroom'] > 0) {
            if (!is_null($this->subscribedContents['chatroom'])) {
                $this->subscribedContents['chatroom']->broadcast('(' . $conn->resourceId . '): ' . "我走啦!");
            }
        }
        // var_dump($this->userSubscriptions);
        // var_dump($conn);
    }

    public function onCall(ConnectionInterface $conn, $id, $content, array $params) {
        // In this application if clients send data it's because the user hacked around in console
        $conn->callError($id, $content, 'You are not allowed to make calls')->close();
    }

    public function onPublish(ConnectionInterface $conn, $content, $event, array $exclude, array $eligible) {
        //*
        switch ($content->getId()) {
            case 'chatroom':
                $composed_msg = '(' . $conn->resourceId . '): ' . $event;
                $content->broadcast($composed_msg);
                break;
            case 'getid':
                $conn->event('getid', $conn->resourceId);
                break;

            // print($composed_msg);
            /*
            foreach ($this->clients as $client) {
                if ($this->userSubscriptions[$client->resourceId]['chatroom'] == 1) {
                    $client->event('chatroom', array('message' => '(' + $client->resourceId + ')' + ' '));
                }
            }
            //*/
        }
        //*/
        // In this application if clients send data it's because the user hacked around in console
        //$conn->close();
    }
    public function onError(ConnectionInterface $conn, \Exception $e) {
    }
}
