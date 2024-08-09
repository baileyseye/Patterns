package baileyes.eyes.kafkastarter.config.topic;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Конфигурационный класс для настройки Kafka топиков. Этот класс создает и настраивает несколько
 * топиков для различных сервисов. Методы в этом классе создают экземпляры {@link NewTopic}, которые
 * представляют собой конфигурацию для Kafka топиков. Поля, используемые в методах: - {@code name}:
 * Имя топика. Это строка, которая идентифицирует топик в Kafka. - {@code numPartitions}: Количество
 * разделов (партиций) в топике. Это целое число, определяющее, на сколько частей будет разделен
 * топик. - {@code short}: Фактор репликации. Это короткое целое число, определяющее, сколько копий
 * данных будет храниться в кластере Kafka
 */
@Configuration
public class KafkaTopicConfig {

    @Bean
    public NewTopic userServiceTopic() {
        return new NewTopic("user-service-topic", 3, (short) 1);
    }

    @Bean
    public NewTopic clientTopic() {
        return new NewTopic("client-service-topic", 2, (short) 1);
    }

    @Bean
    public NewTopic anotherTopic() {
        return new NewTopic("another-service-topic", 1, (short) 1);
    }
}
