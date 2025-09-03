package main

import (
	"encoding/json"
	"log"
	"net/http"
	middleware "server/middleware"
	"server/utils"

	"sync"
	"time"

	"strings"

	"github.com/gorilla/websocket"
	"github.com/streadway/amqp"
)

type Message struct {
	User      string    `json:"User"`
	Text      string    `json:"Text"`
	Timestamp time.Time `json:"Timestamp"`
	RoomName  string    `json:"RoomName"`
}

type Chatroom struct {
	Name     string
	Clients  map[*websocket.Conn]string
	Messages []Message
}

var (
	activeRooms  = make(map[string]bool)
	roomMu       sync.Mutex
	chatrooms    = make(map[string]*Chatroom)
	upgrader     = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	messageLimit = 50
)

// const rabbitmqServer = "amqp://guest:guest@localhost:5672/"

func addRoom(room string) {
	roomMu.Lock()
	defer roomMu.Unlock()
	activeRooms[room] = true
}

func listRoomsHandler(w http.ResponseWriter, r *http.Request) {
	roomMu.Lock()
	defer roomMu.Unlock()

	rooms := make([]string, 0, len(activeRooms))
	for room := range activeRooms {
		rooms = append(rooms, room)
	}

	json.NewEncoder(w).Encode(rooms)
}

func main() {
	// WebSocket enables real-time communication between the client
	// and the server using a communication channel
	// WebSocket request ws://localhost:8080/ws?room={{room}}&token={{token}}
	startWebSocketServer()
	time.Sleep(time.Second * 5)
}

func startWebSocketServer() {
	// Initialize DB
	if err := InitDB(); err != nil {
		log.Fatalf("DB init failed: %v", err)
	}
	defer db.Close()

	authService := &AuthServiceImpl{}
	authHandler := &AuthHandler{Service: authService}

	// HTTP Handlers
	http.HandleFunc("/api/login", middleware.CorsMiddleware(authHandler.loginHandler))
	http.HandleFunc("/api/register", middleware.CorsMiddleware(authHandler.registerHandler)) // optional
	http.HandleFunc("/ws", middleware.CorsMiddleware(handleServerConnections))               // WebSocket
	http.HandleFunc("/api/rooms", middleware.CorsMiddleware(listRoomsHandler))

	go func() {
		botStockInit() // Bot stock consumer
	}()

	go consumeServerMessages()
	// Note: websocket/postman url ws://localhost:8080/ws?room={{room}}&token={{token}}
	log.Println("WebSocket server started on ws://localhost:8080/ws?room={{room}}&token={{token}}")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleServerConnections(w http.ResponseWriter, r *http.Request) {
	// Validate JWT token from query
	tokenStr := r.URL.Query().Get("token")
	claims, err := ParseAndValidateToken(tokenStr)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// (getUsername)
	username := claims.Username

	// (getRoomName)
	roomName := r.URL.Query().Get("room")
	if roomName == "" {
		roomName = "general"
	}

	// Now we know the user is authenticated
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}
	defer ws.Close()

	// Ensure room exists (getOrCreateChatroom)
	room, exists := chatrooms[roomName]
	if !exists {
		room = &Chatroom{Name: roomName, Clients: make(map[*websocket.Conn]string)}
		chatrooms[roomName] = room
	}
	room.Clients[ws] = username
	addRoom(roomName)

	// Send last 50 messages to this client (sendPreviousMessages)
	for _, msg := range room.Messages {
		log.Println(msg)
		err := ws.WriteJSON(msg)
		if err != nil {
			log.Println(err)
		}
	}

	for {
		// Read text frames (handleServerMessage)
		messageType, msgText, err := ws.ReadMessage()
		if err != nil {
			delete(room.Clients, ws)
			break
		}

		log.Printf("%d %s \n", messageType, string(msgText))
		rawMsg := string(msgText)
		msg := Message{User: username, Text: rawMsg, Timestamp: time.Now(), RoomName: roomName}

		// Intercept Stock command
		if strings.HasPrefix(rawMsg, "/stock=") {
			stockCode := strings.TrimSpace(strings.TrimPrefix(rawMsg, "/stock="))
			if stockCode != "" {
				go utils.PublishQueueMessage(roomName, stockCode, utils.StockQueue)
			}
		}

		addServerMessage(room, msg)
		broadcastServerMessage(room, msg)
	}
}

func addServerMessage(room *Chatroom, msg Message) {
	room.Messages = append(room.Messages, msg)
	if len(room.Messages) > messageLimit {
		room.Messages = room.Messages[len(room.Messages)-messageLimit:]
	}
}

func broadcastServerMessage(room *Chatroom, msg Message) {
	for client := range room.Clients {
		client.WriteJSON(msg)
	}
}

func consumeServerMessages() {
	rabbitmqConn, err := amqp.Dial(utils.RabbitmqServer)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ consumeServerMessages -> server: %v %v", err, rabbitmqConn)
	}
	defer rabbitmqConn.Close()

	log.Println("RabbitMQ(server) connection is ready...")
	ch, err := rabbitmqConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %v", err)
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(utils.ChatQueue, false, false, false, false, nil)
	if err != nil {
		log.Fatalf("Failed to declare a queue: %v", err)
	}

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
	if err != nil {
		log.Fatalf("Failed to consume messages: %v", err)
	}

	for d := range msgs {
		parts := strings.SplitN(string(d.Body), "|", 2)
		if len(parts) < 2 {
			log.Printf("Invalid message format: %s", d.Body)
			continue
		}

		roomName := parts[0]
		text := parts[1]
		room, ok := chatrooms[roomName]
		if !ok {
			log.Printf("Chatroom not found: %s", roomName)
			continue
		}

		msg := Message{User: "Bot", Text: text, Timestamp: time.Now(), RoomName: roomName} //Bot message
		addServerMessage(room, msg)
		broadcastServerMessage(room, msg)
	}
}
