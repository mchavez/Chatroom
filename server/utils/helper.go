package utils

import (
	"fmt"
	"log"

	"github.com/streadway/amqp"
)

const (
	RabbitmqServer = "amqp://guest:guest@rabbitmq:5672/"
	ChatQueue      = "chat_queue"
	StockQueue     = "stock_queue"
)

// publishQueueMessage publishes a message to a specified queue.
func PublishQueueMessage(roomName, msg, queueName string) error {
	rabbitmqConn, err := amqp.Dial(RabbitmqServer)
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ publishStockCommand -> server: %w", err)
	}
	defer rabbitmqConn.Close() // nolint:errcheck

	ch, err := rabbitmqConn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open a channel: %w", err)
	}
	defer ch.Close() // nolint:errcheck

	q, err := ch.QueueDeclare(
		queueName, // name
		false,     // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare a queue: %w", err)
	}

	body := fmt.Sprintf("%s|%s", roomName, msg)
	log.Printf("Publishing message to %s: %s", roomName, msg)
	err = ch.Publish(
		"",     // exchange
		q.Name, // routing key
		false,  // mandatory
		false,  // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(body),
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish a message: %w", err)
	}

	return nil
}
