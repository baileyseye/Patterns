package baileyes.eyes.kafkastarter.config.serializer;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

/**
 * Конфигурационный класс для настройки {@link ObjectMapper} Этот класс настраивает
 * {@link ObjectMapper} для использования в приложении, включая поддержку Java 8 Date/Time API,
 * форматирование дат, сериализацию BigDecimal как строки и игнорирование неизвестных свойств при
 * десериализации Поля, используемые в методе: - {@code objectMapper}: Экземпляр
 * {@link ObjectMapper}, который будет настроен и возвращен
 */
@AutoConfiguration
public class ObjectMapperConfiguration {

    /**
     * Создает и настраивает экземпляр {@link ObjectMapper}, если он еще не был создан
     *
     * @return настроенный экземпляр {@link ObjectMapper}
     */
    @Bean
    @ConditionalOnMissingBean(ObjectMapper.class)
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd"));
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        objectMapper.configOverride(BigDecimal.class)
            .setFormat(JsonFormat.Value.forShape(JsonFormat.Shape.STRING));
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        return objectMapper;
    }
}
