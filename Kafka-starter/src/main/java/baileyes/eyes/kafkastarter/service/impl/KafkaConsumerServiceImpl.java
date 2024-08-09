package baileyes.eyes.kafkastarter.service.impl;

import baileyes.eyes.kafkastarter.service.KafkaConsumerService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.TopicPartition;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.Collections;

/**
 * Реализация консюмера
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaConsumerServiceImpl implements KafkaConsumerService {

    private final KafkaConsumer<String, String> consumer;

    /**
     * Слушает сообщения из указанного топика
     *
     * @param topic топик, из которого будут отправляться сообщения
     */
    @Override
    public void consume(String topic) {
        consume(topic, null);
    }

    /**
     * Слушает сообщения из указанного топика или партиций. Подписывается на топик или
     * назначает конкретные партиции и непрерывно читает сообщения
     *
     * @param topic топик, из которого будут отправляться сообщения
     * @param partitions список партиций для чтения (опционально)
     */
    @Override
    public void consume(String topic, List<Integer> partitions) {
        if (partitions == null || partitions.isEmpty()) {
            consumer.subscribe(Collections.singletonList(topic));
        } else {
            List<TopicPartition> topicPartitions = partitions.stream()
                .map(partition -> new TopicPartition(topic, partition))
                .toList();
            consumer.assign(topicPartitions);
        }

        try {
            while (true) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
                records.forEach(record -> log.info(
                    "Consumed message: topic = {}, partition = {}, offset = {}, key = {}, value = {}",
                    record.topic(), record.partition(), record.offset(), record.key(),
                    record.value()
                ));
            }
        } catch (RuntimeException e) {
            log.error("Error while consuming messages", e);
            throw new RuntimeException("Error while consuming messages", e);
        }
    }
}
