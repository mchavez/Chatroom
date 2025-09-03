# Chatroom Go + React with Stock Bot(go-financial-chat)

## Description

This project is designed to test your knowledge of back-end web technologies, specifically in Go
and assess your ability to create back-end products with attention to details, standards, and
reusability.

---

### Assignment
The goal of this exercise is to create a simple browser-based chat application using Go.
This application should allow several users to talk in a chatroom and also to get stock quotes
from an API using a specific command.

---

### Mandatory Features

- Allow registered users to log in and talk with other users in a chatroom.
- Allow users to post messages as commands into the chatroom with the following format
/stock=stock_code
- Create a decoupled bot that will call an API using the stock_code as a parameter
(https://stooq.com/q/l/?s=aapl.us&f=sd2t2ohlcv&h&e=csv, here aapl.us is the
stock_code)
- The bot should parse the received CSV file and then it should send a message back into
the chatroom using a message broker like RabbitMQ. The message will be a stock quote
using the following format: “APPL.US quote is $93.42 per share”. The post owner will be
the bot.
- Have the chat messages ordered by their timestamps and show only the last 50
messages.
- Unit test the functionality you prefer.
- Have more than one chatroom.
- Handle messages that are not understood or any exceptions raised within the bot.

---

## Demo

If you cannot see the demo video, please download the file named [demo.mov](demo.mov) included in the root directory.
<video controls src="demo.mov" title="Title"></video>

---

## Features

- User registration and login
- Multiple chatrooms 
- Chat messages with timestamps
- Stock command: `/stock=STOCKCODE`
- Bot replies with stock price in the same chatroom
- Last 50 messages shown per chatroom

---

## Folder Structure
```bash

chat-app/
├── server/
│   ├── auth.go 
│   ├── bot.go # Stock bot consuming RabbitMQ
│   ├── db.go 
|   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   ├── helper.go 
│   ├── main_test.go
│   ├── main.go
│   ├── mock_auth.go
│   ├── service.go
|   ├──  migrations/
|   |   └── 001_init.sql # Initial migration file
|   ├── middleware/
|   |    └── middleware.go 
|   ├── utils/
|   |    └── helper.go 
|   └── docs/
|       └── go-financial-chat.pdf 
├── client/
│   ├── package.json # proxy http://localhost:8080/ for dev
│   ├── package-lock.json
│   ├── nginx.conf # proxy api calls
│   ├── Dockerfile
│   └── src/
│       ├── App.js
│       ├── Chat.js
│       ├── index.js
│       ├── jest.config.js
│       ├── Login.js
│       ├── Message.js
│       ├── Register.js
│       ├── RoomsList.js
│       ├── setupTests.js
│       └── __tests__/
│           ├── App.test.js
│           ├── Chat.test.js
│           ├── Login.test.js
│           ├── Message.test.js
│           ├── Register.test.js
│           └── RoomList.test.js
├── README.md
├── .gitignore
├── Makefile
└── docker-compose.yml

```

---

## Prerequisites

- Go 1.20+
- Node.js 18+
- npm or yarn- Docker / Docker-Compose (for RabbitMQ + Postgres)

---
Access services:

- React frontend → http://localhost:3000 (alice/password123)
- Go server API → http://localhost:8080
- RabbitMQ Access management UI → http://localhost:15672 (guest/guest)
- PostgreSQL → localhost:5432 (user: chatuser / pass: chatpass / db: chatdb)

---

# Setup Instructions (Docker Compose)

## Containers
```bash
- chat-app
   ├── rabbitmq
   ├── chat-server
   ├── chat-client
   └── chat-postgres
```
## Services
```bash
- chat-app
   ├── rabbitmq
   ├── server
   ├── client
   └── postgres
```
### Usage

1. Login for authenticated users or register a new user.
2. Enter username and room name.
3. Join the chatroom.
4. Send stock command(messages) via WebSocket (Bot replies via RabbitMQ into the chat):
```bash
command(message): 
/stock=aapl.us
```
```bash
Bot reply: 
AAPL.US quote is $153.42 per share
```

5. You can switch rooms by entering a new room name and joining.

## Docker Compose Steps

1. Build & start services:
```bash
   docker-compose up --build -d
```
![alt text](/img/start_services.png)

2. Apply DB migration (once DB is ready):
```bash
   docker exec -i chat-postgres psql -U chatuser -d chatdb < server/migrations/001_init.sql
```
![alt text](/img/migrations.png)

3. Check database data(optional)
```bash
docker exec -i chat-postgres psql -U chatuser -d chatdb
```
![alt text](/img/database_data.png)

4. Logs bot and server(optional):
```bash
   docker-compose logs -f
```
![alt text](/img/logs.png)

5. Runnig test(frontend)
```bash
cd client
npm install
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm test
```
![alt text](/img/jest_tests.png)

6. Runing test(backend)
```bash
cd server
go test -v
```
![alt text](/img/backend_test.png)

7. Stop containers(It will stop the chat app)
```bash
docker-compose down
```
![alt text](/img/stop_containers.png)


---

## Security(storing password): 
- chat-app uses (bcrypt) for securely storing passwords on db.

---

## Utilities

#### Get authenticated token(Curl)
```bash
curl -X POST -H "Content-Type: application/json" -d '{"username": "miguel", "password": "password123"}' http://localhost:8080/api/login
```
---

#### Register new user(Curl)
```bash
curl -X POST -H "Content-Type: application/json" -d '{"username": "john", "password": "password123"}' http://localhost:8080/api/register
```
---

#### Connect to WebSocket using Postman query url(Parameters: roomName / token)
```bash
ws://localhost:8080/ws?room={{roomName}}&token={{token}}
```

#### Open brave without CORS 
```bash
open -n "/Applications/Brave Browser.app" --args --user-data-dir="$HOME/brave-dev-data" --disable-web-security
```

#### Open chrome without CORS 
```bash
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security
```
## Notes:

1. The bot uses Stooq CSV API(https://stooq.com/q/l/?s=AAPL.US&f=sd2t2ohlcv&h&e=csv) to fetch stock prices.
2. RabbitMQ handles message queuing between server(chat_queue) and bot(stock_queue).
3. Messages are automatically capped at last 50 per room to optimize performance.
4. Rabbitmq credentials:
   - RABBITMQ_DEFAULT_USER: guest
   - RABBITMQ_DEFAULT_PASS: guest
   - RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
5. Postgres credentials:
   - POSTGRES_USER: chatuser
   - POSTGRES_PASSWORD: chatpass
   - POSTGRES_DB: chatdb
   - DATABASE_URL: postgres://chatuser:chatpass@postgres:5432/chatdb?sslmode=disable

- Containers running on docker
![alt text](/img/containers.png)

- RabbitMQ UI(Queues)
![alt text](/img/rabbitmq.png)

---


## Setup Instructions (Locally without docker)

### 1. Start RabbitMQ
```bash
docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 2. Start Chat Server + Stock Bot(DATABASE_URL required)
```bash
cd server
go run .
```

### 3. Start React Frontend
```bash
cd client
npm install
npm start
```

### Running Tests (Backend)
```bash
cd server
go test -v
```

### Running Tests (Frontend)
```bash
cd client
npm install
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm test
```



