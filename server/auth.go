package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("supersecretkey")

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// User retrieval functions
type User struct {
	ID           int
	Username     string
	PasswordHash string
}

type AuthService interface {
	FindUser(username string) (*User, error)
	CreateUser(username, password string) (string, error)
	CheckPassword(hashedPassword, plaintextPassword string) error
	GenerateJWT(username string) (string, error)
}

type AuthHandler struct {
	Service AuthService
}

// HTTP handlers (login) endpoint
func (h *AuthHandler) loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	user, err := h.Service.FindUser(creds.Username)
	if err != nil {
		http.Error(w, "invalid credentials Reason: "+err.Error(), http.StatusUnauthorized)
		return
	}

	if h.Service.CheckPassword(user.PasswordHash, creds.Password) != nil {
		strErr := fmt.Sprintf("invalid credentials - CheckPassword Current: %s - Typed: %s", user.PasswordHash, creds.Password)
		http.Error(w, strErr, http.StatusUnauthorized)
		return
	}

	token, err := h.Service.GenerateJWT(user.Username)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

// HTTP handlers (register) endpoint
func (h *AuthHandler) registerHandler(w http.ResponseWriter, r *http.Request) {
	var (
		creds Credentials
		token string
		err   error
	)
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if creds.Username == "" || creds.Password == "" {
		http.Error(w, "username & password required", http.StatusBadRequest)
		return
	}

	token, err = h.Service.CreateUser(creds.Username, creds.Password)
	if err != nil {
		http.Error(w, "could not create user :"+creds.Username+" Reason: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token, "username": creds.Username})
}

func FindUser(username string) (*User, error) {
	var (
		user     User
		strQuery string = "SELECT id, username, password_hash FROM users WHERE username=$1"
	)
	row := db.QueryRow(context.Background(), strQuery, username)
	if err := row.Scan(&user.ID, &user.Username, &user.PasswordHash); err != nil {
		return nil, err
	}

	return &user, nil
}

func CreateUser(username, password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	_, err = db.Exec(context.Background(),
		"INSERT INTO users(username, password_hash) VALUES($1,$2)", username, string(hash))

	return string(hash), err
}

func CheckPassword(hashedPassword, plaintextPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plaintextPassword))
}

func GenerateJWT(username string) (string, error) {
	expiration := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiration),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ParseAndValidateToken(tokenStr string) (*Claims, error) {
	if tokenStr == "" {
		return nil, errors.New("missing token")
	}

	claims := &Claims{}
	tkn, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil || !tkn.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
