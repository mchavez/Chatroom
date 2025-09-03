package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"net/http"
	"server/utils"
	"strings"

	"github.com/streadway/amqp"
)

func botStockInit() {
	rabbitConn, err := amqp.Dial(utils.RabbitmqServer)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ botInit -> bot: %v %v", err.Error(), rabbitConn)
	}
	defer rabbitConn.Close()

	log.Println("RabbitMQ(Bot) connection is ready...")
	ch, err := rabbitConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a RabbitMQ channel: %v", err)
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(utils.StockQueue, false, false, false, false, nil) // Add stock queue to rabbitMQ
	if err != nil {
		log.Fatalf("Failed to declare %s queue: %v", utils.StockQueue, err)
	}

	msgs, err := ch.Consume(q.Name, "", true, false, false, false, nil)
	if err != nil {
		log.Fatalf("Failed to register a consumer: %v", err)
	}

	for d := range msgs {
		handleBotMessage(d)
	}
}

func handleBotMessage(d amqp.Delivery) {
	parts := strings.SplitN(string(d.Body), "|", 2)
	if len(parts) < 2 {
		log.Println("Invalid message format")
		return
	}

	room := parts[0]
	stockCode := parts[1]
	quote, err := fetchStockQuote(stockCode)
	if err != nil {
		log.Printf("Error fetching stock quote for %s: %v", stockCode, err)
		return
	}

	text := fmt.Sprintf("%s quote is $%s per share", strings.ToUpper(stockCode), quote)
	log.Printf("%s", text)
	utils.PublishQueueMessage(room, text, utils.ChatQueue)
}

// fetchStockQuote retrieves the closing stock price for a given stock code.
func fetchStockQuote(code string) (string, error) {
	url := fmt.Sprintf("https://stooq.com/q/l/?s=%s&f=sd2t2ohlcv&h&e=csv", code)
	resp, err := http.Get(url) //Call stock API
	if err != nil {
		return "N/A", fmt.Errorf("failed to fetch stock quote: %w", err)
	}

	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "N/A", fmt.Errorf("received non-200 response: %d", resp.StatusCode)
	}

	reader := csv.NewReader(resp.Body)
	if _, err := reader.Read(); err != nil { // Skip header
		return "N/A", fmt.Errorf("failed to read header: %w", err)
	}

	record, err := reader.Read()
	if err != nil {
		if err == io.EOF {
			return "N/A", fmt.Errorf("no data available for stock code: %s", code)
		}
		return "N/A", fmt.Errorf("failed to read record: %w", err)
	}

	return record[6], nil // Return the closing price
}
