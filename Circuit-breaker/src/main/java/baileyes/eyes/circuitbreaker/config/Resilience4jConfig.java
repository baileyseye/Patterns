package baileyes.eyes.circuitbreaker.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.jetbrains.annotations.NotNull;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.Duration;

/**
 * <h1>Конфигурация Resilience4j</h1>
 * <p>
 * Этот класс содержит конфигурацию для настройки и создания бинов {@link CircuitBreakerRegistry} и
 * {@link CircuitBreaker} с кастомными параметрами для различных сервисов
 * </p>
 *
 * <h2>Сервисы:</h2>
 * <ul>
 *     <li><b>userDataCircuitBreaker:</b> Настроен для обработки отказов в сервисе userData</li>
 *     <li><b>dmsServiceCircuitBreaker:</b> Настроен для обработки отказов в сервисе dmsService</li>
 * </ul>
 *
 * <p>
 * <b>Пример использования:</b>
 * </p>
 * <pre>{@code
 *   private final CircuitBreaker userDataCircuitBreaker;
 *   private final CircuitBreaker dmsServiceCircuitBreaker;
 *
 *   public void someMethod() {
 *       userDataCircuitBreaker.executeRunnable(() -> repository.save(mapper.mapToEntity(dto)));
 *       dmsServiceCircuitBreaker.executeRunnable(() -> repository.save(mapper.mapToEntity(dto)));
 *   }
 * }</pre>
 *
 * <p>
 * <b>Пример аннотирования класса:</b>
 * </p>
 * <pre>{@code
 *  @CircuitBreaker(name = "userDataCircuitBreaker")
 *  public class UserDataService {
 *      public void someMethod() {
 *          // Логика метода
 *      }
 *  }
 * }</pre>
 *
 * @see CircuitBreakerConfig
 * @see CircuitBreakerRegistry
 * @see CircuitBreaker
 */
@Configuration
public class Resilience4jConfig {

    /**
     * <h2>Создание реестра Circuit Breaker</h2>
     * <p>
     * Этот метод создает и возвращает бин {@link CircuitBreakerRegistry} с настройками по
     * умолчанию
     * </p>
     *
     * @return настроенный {@link CircuitBreakerRegistry}
     */
    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        return CircuitBreakerRegistry.ofDefaults();
    }

    /**
     * <h2>Создание Circuit Breaker для userData</h2>
     * <p>
     * Этот метод настраивает и возвращает бин {@link CircuitBreaker} с кастомными параметрами для
     * обработки отказов в userData сервисе
     * </p>
     * <p>
     * Конфигурация включает:
     * </p>
     * <ul>
     *     <li><b>Порог отказов:</b> Процент отказов, при котором сработает Circuit Breaker (50%).</li>
     *     <li><b>Время ожидания в открытом состоянии:</b> Время, в течение которого Circuit Breaker будет оставаться открытым перед переходом в полуустановленное состояние (1000 миллисекунд)</li>
     *     <li><b>Тип скользящего окна:</b> Тип скользящего окна, используемого для записи результатов вызовов (COUNT_BASED)</li>
     *     <li><b>Размер скользящего окна:</b> Размер скользящего окна (10)</li>
     *     <li><b>Минимальное количество вызовов:</b> Минимальное количество вызовов, необходимое для расчета процента отказов (5)</li>
     *     <li><b>Разрешенное количество вызовов в полу-установленном состоянии:</b> Количество вызовов, которые разрешены при полуустановленном состоянии (3)</li>
     *     <li><b>Запись исключений:</b> Предикат для определения, какие исключения должны быть записаны как отказ (экземпляры {@link RuntimeException})</li>
     * </ul>
     * <p>
     * <b>Пример использования:</b>
     * </p>
     * <pre>{@code
     *    private CircuitBreaker userDataCircuitBreaker;
     *
     *    public void someMethod() {
     *        userDataCircuitBreaker.executeRunnable(() -> repository.save(mapper.mapToEntity(dto)));
     *    }
     * }</pre>
     *
     * @param circuitBreakerRegistry реестр Circuit Breaker.
     * @return настроенный {@link CircuitBreaker} для userData, где имя переменной = имя бина
     * @see CircuitBreakerConfig
     * @see CircuitBreakerRegistry
     */
    @Bean
    public CircuitBreaker userDataCircuitBreaker(@NotNull CircuitBreakerRegistry circuitBreakerRegistry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofMillis(1000))
            .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
            .slidingWindowSize(10)
            .minimumNumberOfCalls(5)
            .permittedNumberOfCallsInHalfOpenState(3)
            .recordException(RuntimeException.class::isInstance)
            .build();

        return circuitBreakerRegistry.circuitBreaker("userDataCircuitBreaker", config);
    }

    /**
     * <h2>Создание Circuit Breaker для dmsService</h2>
     * <p>
     * Этот метод настраивает и возвращает бин {@link CircuitBreaker} с пользовательскими
     * параметрами для обработки отказов в dmsService
     * </p>
     * <p>
     * Конфигурация включает:
     * </p>
     * <ul>
     *     <li><b>Порог отказов:</b> Процент отказов, при котором сработает Circuit Breaker (30%)</li>
     *     <li><b>Время ожидания в открытом состоянии:</b> Время, в течение которого Circuit Breaker будет оставаться открытым перед переходом в полуустановленное состояние (2000 миллисекунд)</li>
     *     <li><b>Тип скользящего окна:</b> Тип скользящего окна, используемого для записи результатов вызовов (TIME_BASED)</li>
     *     <li><b>Размер скользящего окна:</b> Размер скользящего окна (20)</li>
     *     <li><b>Минимальное количество вызовов:</b> Минимальное количество вызовов, необходимое для расчета процента отказов (10)</li>
     *     <li><b>Разрешенное количество вызовов в полу-установленном состоянии:</b> Количество вызовов, которые разрешены при полуустановленном состоянии (5)</li>
     *     <li><b>Запись исключений:</b> Предикат для определения, какие исключения должны быть записаны как отказ (экземпляры {@link RuntimeException})</li>
     * </ul>
     * <p>
     * <b>Пример использования:</b>
     * </p>
     * <pre>{@code
     *   private CircuitBreaker dmsServiceCircuitBreaker;
     *
     *   public void someMethod() {
     *       dmsServiceCircuitBreaker.executeRunnable(() -> repository.save(mapper.mapToEntity(dto)));
     *   }
     * }</pre>
     *
     * @param circuitBreakerRegistry реестр Circuit Breaker
     * @return настроенный {@link CircuitBreaker} для dmsService, где имя переменной = имя бина
     * @see CircuitBreakerConfig
     * @see CircuitBreakerRegistry
     */
    @Bean
    public CircuitBreaker anotherServiceCircuitBreaker(@NotNull CircuitBreakerRegistry circuitBreakerRegistry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(30)
            .waitDurationInOpenState(Duration.ofMillis(2000))
            .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.TIME_BASED)
            .slidingWindowSize(20)
            .minimumNumberOfCalls(10)
            .permittedNumberOfCallsInHalfOpenState(5)
            .recordException(RuntimeException.class::isInstance)
            .build();

        return circuitBreakerRegistry.circuitBreaker("anotherServiceCircuitBreaker", config);
    }

    /**
     * <h2>Создание дефолтного Circuit Breaker</h2>
     * <p>
     * Этот метод настраивает и возвращает бин {@link CircuitBreaker} с дефолтными параметрами
     * </p>
     * <p>
     * Конфигурация включает:
     * </p>
     * <ul>
     *     <li><b>Порог отказов:</b> Процент отказов, при котором сработает Circuit Breaker (90%)</li>
     *     <li><b>Время ожидания в открытом состоянии:</b> Время, в течение которого Circuit Breaker будет оставаться открытым перед переходом в полуустановленное состояние (500 миллисекунд)</li>
     *     <li><b>Тип скользящего окна:</b> Тип скользящего окна, используемого для записи результатов вызовов (COUNT_BASED)</li>
     *     <li><b>Размер скользящего окна:</b> Размер скользящего окна (5)</li>
     *     <li><b>Минимальное количество вызовов:</b> Минимальное количество вызовов, необходимое для расчета процента отказов (3)</li>
     *     <li><b>Разрешенное количество вызовов в полу-установленном состоянии:</b> Количество вызовов, которые разрешены при полуустановленном состоянии (2)</li>
     *     <li><b>Запись исключений:</b> Предикат для определения, какие исключения должны быть записаны как отказ (экземпляры {@link Exception})</li>
     * </ul>
     *
     * @param circuitBreakerRegistry реестр Circuit Breaker
     * @return настроенный {@link CircuitBreaker} по умолчанию, где имя переменной = имя бина
     */
    @Bean
    public CircuitBreaker defaultCircuitBreaker(CircuitBreakerRegistry circuitBreakerRegistry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(90)
            .waitDurationInOpenState(Duration.ofMillis(500))
            .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
            .slidingWindowSize(5)
            .minimumNumberOfCalls(3)
            .permittedNumberOfCallsInHalfOpenState(2)
            .recordException(RuntimeException.class::isInstance)
            .build();

        return circuitBreakerRegistry.circuitBreaker("defaultCircuitBreaker", config);
    }
}
