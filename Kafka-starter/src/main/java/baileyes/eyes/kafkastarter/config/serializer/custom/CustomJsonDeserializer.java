package baileyes.eyes.kafkastarter.config.serializer.custom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.serialization.Deserializer;

/**
 * Кастомный десериализатор для объектов типа {@code T}, использующий Jackson для десериализации из JSON.
 * Этот класс реализует интерфейс {@link Deserializer} и использует {@link ObjectMapper} для
 * преобразования байтового массива в объекты.
 *
 * @param <T> тип объектов, которые будут десериализоваться
 */
@Slf4j
public class CustomJsonDeserializer<T> implements Deserializer<T> {

    private final ObjectMapper objectMapper;
    private final Class<T> targetType;

    /**
     * Конструктор, который принимает тип целевого объекта и инициализирует {@link ObjectMapper},
     * регистрируя модуль {@link JavaTimeModule}.
     *
     * @param targetType класс целевого типа, в который будут десериализоваться данные
     */
    public CustomJsonDeserializer(Class<T> targetType) {
        this.targetType = targetType;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }


    /**
     * Десериализует байтовый массив в объект типа {@code T}.
     *
     * @param topic тема Kafka, к которой относится сообщение
     * @param data байтовый массив, представляющий сериализованный объект
     * @return десериализованный объект типа {@code T}
     * @throws RuntimeException если произошла ошибка при десериализации JSON в объект
     */
    @Override
    public T deserialize(String topic, byte[] data) {
        try {
            return objectMapper.readValue(data, targetType);
        } catch (Exception e) {
            log.error("Failed to deserialize JSON to value: {}", e.getMessage());
            throw new RuntimeException("Failed to deserialize JSON to value", e);
        }
    }
}