package baileyes.eyes.kafkastarter.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Конфигурационный класс для свойств Kafka Producer.
 * <p>
 * Этот класс используется для маппинга свойств, определенных в файле конфигурации приложения
 * с префиксом "project.kafka.producer". Он содержит настройки для подключения к Kafka и
 * конфигурации продюсера.
 * <p>
 * Пример конфигурации в application.yml:
 * <pre>
 * project:
 *   kafka:
 *     producer:
 *       bootstrap-servers: localhost:9092
 *       topic: my-topic
 *       transactional-id: my-transactional-id
 * </pre>
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "project.kafka.producer")
public class KafkaProducerProperties {

    /**
     * Список адресов серверов Kafka для подключения.
     * <p>
     * Пример: "localhost:9092"
     */
    private String bootstrapServers;

    /**
     * Название топика Kafka, в который будут отправляться сообщения.
     * <p>
     * Пример: "my-topic"
     */
    private String topic;

    /**
     * Идентификатор транзакции для Kafka Producer.
     * <p>
     * Пример: "my-transactional-id"
     */
    private String transactionalId;

    /**
     * URL для подключения к Schema Registry.
     * <p>
     * Пример: "localhost:8081"
     */
    private String schemaRegistryUrl;
}
