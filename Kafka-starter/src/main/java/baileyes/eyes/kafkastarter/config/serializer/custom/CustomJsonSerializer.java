package baileyes.eyes.kafkastarter.config.serializer.custom;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.serialization.Serializer;

/**
 * Кастомный сериализатор для объектов типа {@code T}, использующий Jackson для сериализации в JSON
 * Этот класс реализует интерфейс {@link Serializer} и использует {@link ObjectMapper} для
 * преобразования объектов в байтовый массив
 *
 * @param <T> тип объектов, которые будут сериализоваться
 */
@Slf4j
public class CustomJsonSerializer<T> implements Serializer<T> {

    private final ObjectMapper objectMapper;

    /**
     * Конструктор по умолчанию, который инициализирует {@link ObjectMapper} и регистрирует модуль
     * {@link JavaTimeModule}
     */
    public CustomJsonSerializer() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Сериализует объект типа {@code T} в байтовый массив
     *
     * @param topic тема Kafka, к которой относится сообщение
     * @param data объект, который нужно сериализовать
     * @return байтовый массив, представляющий сериализованный объект
     * @throws RuntimeException если произошла ошибка при сериализации объекта в JSON
     */
    @Override
    public byte[] serialize(String topic, T data) {
        try {
            return objectMapper.writeValueAsBytes(data);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize value {} to JSON", e.getMessage());
            throw new RuntimeException(e);
        }
    }
}
