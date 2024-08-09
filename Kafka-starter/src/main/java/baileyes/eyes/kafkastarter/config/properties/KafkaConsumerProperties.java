package baileyes.eyes.kafkastarter.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Конфигурационный класс для свойств Kafka Consumer
 * <p>
 * Этот класс используется для маппинга свойств, определенных в файле конфигурации приложения с
 * префиксом "project.kafka.consumer". Он содержит настройки для подключения к Kafka и конфигурации
 * потребителя
 * <p>
 * Пример конфигурации в application.yml:
 * <pre>
 * project:
 *   kafka:
 *     consumer:
 *       bootstrap-servers: localhost:9092
 *       group-id: my-group-id
 * </pre>
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "project.kafka.consumer")
public class KafkaConsumerProperties {

    /**
     * Список адресов серверов Kafka для подключения.
     * <p>
     * Пример: "localhost:9092"
     */
    private String bootstrapServers;

    /**
     * Идентификатор группы для Kafka Consumer
     * <p>
     * Пример: "my-group-id"
     */
    private String groupId;

    /**
     * json / avro
     */
    private String serializationType;
}
