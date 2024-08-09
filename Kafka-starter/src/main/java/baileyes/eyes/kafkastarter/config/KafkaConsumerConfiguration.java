package baileyes.eyes.kafkastarter.config;

import baileyes.eyes.kafkastarter.config.properties.KafkaConsumerProperties;
import baileyes.eyes.kafkastarter.config.serializer.avro.AvroDeserializer;
import baileyes.eyes.kafkastarter.config.serializer.custom.CustomJsonSerializer;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.apache.avro.specific.SpecificRecordBase;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Scope;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;

/**
 * Конфигурационный класс для настройки Kafka Consumer. Этот класс автоматически конфигурирует Kafka
 * Consumer с использованием свойств, определенных в {@link KafkaConsumerProperties}. Он также
 * создает бин для {@link ConcurrentKafkaListenerContainerFactory}, который используется для
 * обработки сообщений из Kafka
 *
 */
@EnableKafka
@AutoConfiguration
@RequiredArgsConstructor
@ComponentScan("project.kafkastarter")
@EnableConfigurationProperties(KafkaConsumerProperties.class)
public class KafkaConsumerConfiguration {

    private final KafkaConsumerProperties consumer;

    /**
     * Создает и настраивает бин {@link ConsumerFactory} для Kafka Consumer с JSON сериализацией.
     * Этот бин будет создан только если в класспасе присутствует {@link DefaultKafkaConsumerFactory}.
     *
     * @return настроенный экземпляр {@link ConsumerFactory}
     */
    @Bean
    @Scope("singleton")
    @ConditionalOnClass(DefaultKafkaConsumerFactory.class)
    public ConsumerFactory<String, String> jsonConsumerFactory() {
        Map<String, Object> properties = new HashMap<>();
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, consumer.getBootstrapServers());
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, CustomJsonSerializer.class);
        properties.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, consumer.getGroupId());

        return new DefaultKafkaConsumerFactory<>(properties);
    }

    /**
     * Создает и настраивает бин {@link ConsumerFactory} для Kafka Consumer с Avro сериализацией.
     * Этот бин будет создан только если в класспасе присутствует {@link DefaultKafkaConsumerFactory}.
     *
     * @return настроенный экземпляр {@link ConsumerFactory}
     */
    @Bean
    @Scope("singleton")
    @ConditionalOnClass(DefaultKafkaConsumerFactory.class)
    public <T extends SpecificRecordBase> ConsumerFactory<String, T> avroConsumerFactory(Class<T> targetType) {
        Map<String, Object> properties = new HashMap<>();
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, consumer.getBootstrapServers());
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, new AvroDeserializer<>(targetType));
        properties.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, consumer.getGroupId());

        return new DefaultKafkaConsumerFactory<>(properties);
    }

    /**
     * Создает бин {@link ConcurrentKafkaListenerContainerFactory} для JSON сериализации,
     * который используется для обработки сообщений из Kafka.
     * Этот бин будет создан только если существует бин {@link ConsumerFactory}.
     *
     * @return настроенный экземпляр {@link ConcurrentKafkaListenerContainerFactory}
     */
    @Bean(name = "jsonKafkaListenerContainerFactory")
    @ConditionalOnBean(ConsumerFactory.class)
    public ConcurrentKafkaListenerContainerFactory<String, String> jsonKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(jsonConsumerFactory());

        return factory;
    }

    /**
     * Создает бин {@link ConcurrentKafkaListenerContainerFactory} для Avro сериализации,
     * который используется для обработки сообщений из Kafka.
     * Этот бин будет создан только если существует бин {@link ConsumerFactory}.
     *
     * @return настроенный экземпляр {@link ConcurrentKafkaListenerContainerFactory}
     */
    @Bean(name = "avroKafkaListenerContainerFactory")
    @ConditionalOnBean(ConsumerFactory.class)
    public <T extends SpecificRecordBase> ConcurrentKafkaListenerContainerFactory<String, T> avroKafkaListenerContainerFactory(Class<T> targetType) {
        ConcurrentKafkaListenerContainerFactory<String, T> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(avroConsumerFactory(targetType));

        return factory;
    }

    /**
     * Создает бин {@link KafkaConsumer}, который используется для прослушивания сообщений из Kafka
     * с JSON сериализацией.
     *
     * @param consumerFactory экземпляр {@link ConsumerFactory}, который будет использоваться для
     *                        создания {@link KafkaConsumer}
     * @return настроенный экземпляр {@link KafkaConsumer}
     */
    @Bean
    public KafkaConsumer<String, String> kafkaJsonConsumer(
        ConsumerFactory<String, String> consumerFactory) {
        return (KafkaConsumer<String, String>) consumerFactory.createConsumer();
    }

    /**
     * Создает бин {@link KafkaConsumer}, который используется для прослушивания сообщений из Kafka
     * с Avro сериализацией.
     *
     * @param consumerFactory экземпляр {@link ConsumerFactory}, который будет использоваться для
     *                        создания {@link KafkaConsumer}
     * @return настроенный экземпляр {@link KafkaConsumer}
     */
    @Bean
    public <T extends SpecificRecordBase> KafkaConsumer<String, T> kafkaAvroConsumer(
        ConsumerFactory<String, T> consumerFactory) {
        return (KafkaConsumer<String, T>) consumerFactory.createConsumer();
    }
}
