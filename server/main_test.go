package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	gomock "go.uber.org/mock/gomock"
)

func TestAddMessageKeepsLast50PerRoom(t *testing.T) {
	room := &Chatroom{Name: "testroom", Clients: make(map[*websocket.Conn]string)}
	for i := 1; i <= 60; i++ {
		addServerMessage(room, Message{User: "User", Text: fmt.Sprintf("msg%d", i), Timestamp: time.Now(), RoomName: "general"})
	}

	if len(room.Messages) != 50 {
		t.Errorf("Expected 50 messages, got %d", len(room.Messages))
	}

	if !strings.HasSuffix(room.Messages[0].Text, "11") {
		t.Errorf("Expected first message msg11, got %s", room.Messages[0].Text)
	}
}

func TestParseBotMessageForRoom(t *testing.T) {
	bodyMsg := "AAPL.US quote is $153.42 per share"
	rawMsg := fmt.Sprintf("room1|%s", bodyMsg)
	parts := strings.SplitN(rawMsg, "|", 2)
	if parts[0] != "room1" {
		t.Errorf("Expected room 'room1', got '%s'", parts[0])
	}

	if parts[1] != bodyMsg {
		t.Errorf("Unexpected message body: %s", parts[1])
	}
}

func TestParseStockCSV(t *testing.T) {
	// Mock CSV content
	data := `Symbol,Date,Time,Open,High,Low,Close,Volume
		AAPL.US,2025-08-29,22:00:00,150.00,155.00,149.00,153.42,1000000
		`
	r := csv.NewReader(strings.NewReader(data))
	_, _ = r.Read() // skip header
	record, _ := r.Read()

	closePrice := record[6]
	if closePrice != "153.42" {
		t.Errorf("Expected 153.42, got %s", closePrice)
	}
}

func TestGenerateAndParseJWT(t *testing.T) {
	token, err := GenerateJWT("alice")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	claims, err := ParseAndValidateToken(token)
	if err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}

	if claims.Username != "alice" {
		t.Errorf("expected username alice, got %s", claims.Username)
	}
}

func TestParseAndValidateToken_Invalid(t *testing.T) {
	_, err := ParseAndValidateToken("")
	if err == nil {
		t.Error("expected error for missing token, got nil")
	}
}

func TestRegisterHandler_ValidationError(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	body := `{"username":"","password":""}`
	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	mockSvc := NewMockAuthService(ctrl)
	handler := &AuthHandler{Service: mockSvc}
	handler.registerHandler(w, req)

	if w.Result().StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d", w.Result().StatusCode)
	}
}

func TestLoginHandler_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockAuthService(ctrl)
	handler := &AuthHandler{Service: mockSvc}

	// Setup expectations
	mockSvc.EXPECT().FindUser("alice").Return(&User{
		ID: 1, Username: "alice", PasswordHash: "hashed",
	}, nil)
	mockSvc.EXPECT().CheckPassword("hashed", "secret").Return(nil)
	mockSvc.EXPECT().GenerateJWT("alice").Return("mocked-token", nil)

	body := `{"username":"alice","password":"secret"}`
	req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	handler.loginHandler(w, req)
	if w.Result().StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", w.Result().StatusCode)
	}
}

func TestRegister_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockAuthService(ctrl)
	handler := &AuthHandler{Service: mockSvc}

	// Expectations
	mockSvc.EXPECT().CreateUser("bob", "mypassword").Return("mocked-token", nil)

	body := `{"username":"bob","password":"mypassword"}`
	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewBufferString(body))
	w := httptest.NewRecorder()

	handler.registerHandler(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", w.Code)
	}

	var resp map[string]string
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["username"] != "bob" {
		t.Errorf("expected username bob, got %s", resp["username"])
	}
}
