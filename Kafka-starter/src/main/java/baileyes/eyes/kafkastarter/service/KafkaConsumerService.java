package baileyes.eyes.kafkastarter.service;

import java.util.List;

/**
 * Интерфейс консюмера
 */
public interface KafkaConsumerService {

    /**
     * Слушает сообщения из указанного топика Kafka.
     * Этот метод подписывается на топик и непрерывно читает сообщения
     *
     * @param topic топик, из которого будут потребляться сообщения
     */
    void consume(String topic);

    /**
     * Слушает сообщения из указанного топика или партиций Kafka.
     * Этот метод подписывается на топик или назначает конкретные партиции и непрерывно читает сообщения.
     *
     * @param topic топик, из которого будут потребляться сообщения
     * @param partitions список партиций для чтения (опционально)
     */
    void consume(String topic, List<Integer> partitions);
}
