package baileyes.eyes.kafkastarter.service.impl;

import baileyes.eyes.kafkastarter.exception.KafkaProducerException;
import baileyes.eyes.kafkastarter.service.KafkaProducerService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.errors.AuthorizationException;
import org.apache.kafka.common.errors.OutOfOrderSequenceException;
import org.apache.kafka.common.errors.ProducerFencedException;
import org.springframework.stereotype.Service;


/**
 * Реализация Продюсера отправки идемпотентных сообщений
 *
 * @param <K> тип ключа
 * @param <V> тип значения
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerServiceImpl<K, V> implements KafkaProducerService<K, V> {

    private final KafkaProducer<K, V> producer;

    /**
     * Отправляет идемпотентное сообщение в указанный топик и партицию. Этот метод начинает
     * транзакцию, отправляет сообщение и коммитит транзакцию В случае ошибки транзакция
     * откатывается и продюсер закрывается
     *
     * @param topic   топик, в который будет отправлено сообщение
     * @param partition партиция, в которую будет отправлено сообщение
     * @param key     ключ сообщения
     * @param message сообщение для отправки
     */
    @Override
    public void sendIdempotentMessage(String topic, int partition, K key, V message) {
        try {
            log.info("Begin kafka sending message transaction");
            producer.beginTransaction();
            log.info("Sending message {} to topic {} partition {}", message.toString(), topic,
                partition);
            producer.send(new ProducerRecord<>(topic, partition, key, message));
            log.info("Commit kafka sending message transaction");
            producer.commitTransaction();
        } catch (ProducerFencedException | OutOfOrderSequenceException | AuthorizationException e) {
            log.error("Kafka can't send message to topic by the reason {}", e.getMessage());
            producer.close();
        } catch (KafkaProducerException e) {
            log.error("Transactional closed by the reason {}", e.getMessage());
            producer.abortTransaction();
        }
    }

    /**
     * Отправляет идемпотентное сообщение в указанный топик Этот метод начинает транзакцию,
     * отправляет сообщение и коммитит транзакцию В случае ошибки транзакция откатывается и продюсер
     * закрывается
     *
     * @param topic   топик, в который будет отправлено сообщение
     * @param key     ключ сообщения
     * @param message сообщение для отправки
     */
    @Override
    public void sendIdempotentMessage(String topic, K key, V message) {
        try {
            log.info("Begin kafka sending message transaction");
            producer.beginTransaction();
            log.info("Sending message {} to topic {}", message.toString(), topic);
            producer.send(new ProducerRecord<>(topic, key, message));
            log.info("Commit kafka sending message transaction");
            producer.commitTransaction();
        } catch (ProducerFencedException | OutOfOrderSequenceException | AuthorizationException e) {
            log.error("Kafka can't send message to topic by the reason {}", e.getMessage());
            producer.close();
        } catch (KafkaProducerException e) {
            log.error("Transactional closed by the reason {}", e.getMessage());
            producer.abortTransaction();
        }
    }

    @PreDestroy
    public void closeProducer() {
        producer.close();
    }
}
