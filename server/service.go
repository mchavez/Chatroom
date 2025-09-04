package main

type AuthServiceImpl struct{}

func (s *AuthServiceImpl) FindUser(username string) (*User, error) {
	return FindUser(username) // calls your existing DB function
}

func (s *AuthServiceImpl) CreateUser(username, password string) (string, error) {
	return CreateUser(username, password)
}

func (s *AuthServiceImpl) CheckPassword(hashedPassword, plaintextPassword string) error {
	return CheckPassword(hashedPassword, plaintextPassword)
}

func (s *AuthServiceImpl) GenerateJWT(username string) (string, error) {
	return GenerateJWT(username)
}
