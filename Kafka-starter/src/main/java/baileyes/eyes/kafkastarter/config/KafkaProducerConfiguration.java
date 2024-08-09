package baileyes.eyes.kafkastarter.config;

import baileyes.eyes.kafkastarter.config.properties.KafkaProducerProperties;
import baileyes.eyes.kafkastarter.config.serializer.avro.AvroSerializer;
import baileyes.eyes.kafkastarter.config.serializer.custom.CustomJsonSerializer;
import baileyes.eyes.kafkastarter.service.KafkaProducerService;
import baileyes.eyes.kafkastarter.service.impl.KafkaProducerServiceImpl;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Scope;

/**
 * Конфигурационный класс для настройки Kafka Producer
 * Этот класс автоматически конфигурирует Kafka Producer с использованием свойств,
 * определенных в {@linkplain KafkaProducerProperties}.
 * Он также создает бин для {@linkplain KafkaProducerService},
 * который используется для отправки сообщений в Kafka
 *
 */
@AutoConfiguration
@RequiredArgsConstructor
@ComponentScan("project.kafkastarter")
@EnableConfigurationProperties(KafkaProducerProperties.class)
public class KafkaProducerConfiguration {

    private final KafkaProducerProperties producer;
    private final AtomicInteger transactionIdCounter = new AtomicInteger(1);

    /**
     * Создает и настраивает бин {@link KafkaProducer} с идемпотентностью и транзакционной
     * поддержкой Этот бин будет создан только если в класспасе присутствует {@link KafkaProducer}
     *
     * @return настроенный экземпляр {@link KafkaProducer}
     */
    @Bean
    @Scope("singleton")
    @ConditionalOnClass(KafkaProducer.class)
    public KafkaProducer<Object, Object> kafkaIdempotentProducer() {
        Map<String, Object> properties = new HashMap<>();
        String uniqueTransactionalId = getTransactionalId();

        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, producer.getBootstrapServers());
        properties.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
        properties.put(ProducerConfig.ACKS_CONFIG, "all");
        properties.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 1);
        properties.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, uniqueTransactionalId);
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, CustomJsonSerializer.class);
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, CustomJsonSerializer.class);

        KafkaProducer<Object, Object> kafkaProducer = new KafkaProducer<>(properties);
        kafkaProducer.initTransactions();

        return kafkaProducer;
    }

    /**
     * Генерирует уникальный идентификатор транзакции для Kafka Producer Этот метод используется для
     * создания уникальных идентификаторов транзакций, чтобы избежать конфликтов
     *
     * @return уникальный идентификатор транзакции
     */
    private String getTransactionalId() {
        return producer
            .getTransactionalId()
            .concat("-")
            .concat(String.valueOf(transactionIdCounter.getAndIncrement()));
    }

    /**
     * Создает бин {@link KafkaProducerService}, который используется для отправки сообщений в Kafka
     * Этот бин будет создан только если существует бин {@link KafkaProducer}
     *
     * @param producer экземпляр {@link KafkaProducer}, который будет использоваться для отправки
     *                 сообщений
     * @return настроенный экземпляр {@link KafkaProducerService}
     */
    @Bean
    @ConditionalOnBean(name = "kafkaIdempotentProducer")
    public KafkaProducerService<Object, Object> kafkaProducerServiceApi(
        @Qualifier("kafkaIdempotentProducer") KafkaProducer<Object, Object> producer) {
        return new KafkaProducerServiceImpl<>(producer);
    }

    /**
     * Создает и настраивает бин {@link KafkaProducer} для AVRO сериализации с использованием Schema
     * Registry Этот бин будет создан только если в класспасе присутствует {@link KafkaProducer}
     *
     * @return настроенный экземпляр {@link KafkaProducer} для AVRO
     */
    @Bean
    @Scope("singleton")
    @ConditionalOnClass(KafkaProducer.class)
    public KafkaProducer<Object, Object> kafkaAvroProducer() {
        Map<String, Object> properties = new HashMap<>();
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, producer.getBootstrapServers());
        properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, AvroSerializer.class);
        properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, AvroSerializer.class);
        properties.put("schema.registry.url", producer.getSchemaRegistryUrl());

        return new KafkaProducer<>(properties);
    }

    /**
     * Создает бин {@link KafkaProducerService} для AVRO сериализации Этот бин будет создан только
     * если существует бин {@link KafkaProducer} для AVRO
     *
     * @param producer экземпляр {@link KafkaProducer}, который будет использоваться для отправки
     *                 сообщений
     * @return настроенный экземпляр {@link KafkaProducerService} для AVRO
     */
    @Bean
    @ConditionalOnBean(name = "kafkaAvroProducer")
    public KafkaProducerService<Object, Object> kafkaAvroProducerServiceApi(
        @Qualifier("kafkaAvroProducer") KafkaProducer<Object, Object> producer) {
        return new KafkaProducerServiceImpl<>(producer);
    }
}
