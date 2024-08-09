package baileyes.eyes.kafkastarter.config.retry;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;

/**
 * Конфигурационный класс для настройки механизма повторных попыток (retry) в приложении Этот класс
 * включает поддержку повторных попыток с использованием аннотации {@link EnableRetry} и
 * предоставляет бины для настройки политики повторных попыток и политики экспоненциального
 * увеличения интервала между попытками.
 */
@Configuration
@EnableRetry
public class RetryConfig {

    /**
     * Создает и настраивает {@link RetryTemplate} с простой политикой повторных попыток и
     * экспоненциальной политикой увеличения интервала между попытками
     * <p>
     * Политика повторных попыток настроена на максимум 5 попыток Начальный интервал для
     * экспоненциальной политики увеличения интервала установлен на 500 мс, множитель - 2.0,
     * максимальный интервал - 5000 мс
     *
     * @return настроенный экземпляр {@link RetryTemplate}
     */
    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();

        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(5);

        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(500);
        backOffPolicy.setMultiplier(2.0);
        backOffPolicy.setMaxInterval(5000);

        retryTemplate.setRetryPolicy(retryPolicy);
        retryTemplate.setBackOffPolicy(backOffPolicy);

        return retryTemplate;
    }
}
