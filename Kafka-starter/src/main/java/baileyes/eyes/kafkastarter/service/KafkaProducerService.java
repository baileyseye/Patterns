package baileyes.eyes.kafkastarter.service;

/**
 * Интерфейс продюсера
 *
 * @param <K> тип ключа сообщения
 * @param <V> тип значения сообщения
 */
public interface KafkaProducerService<K, V> {

    /**
     * Отправляет сообщение в указанный топик Kafka с использованием транзакций Этот метод
     * гарантирует, что сообщение будет доставлено , используя транзакции для обеспечения
     * целостности данных
     *
     * @param topic   топик, в который будет отправлено сообщение
     * @param key     ключ сообщения
     * @param message значение сообщения
     */
    void sendIdempotentMessage(String topic,int partition, K key, V message);

    void sendIdempotentMessage(String topic, K key, V message);
}
