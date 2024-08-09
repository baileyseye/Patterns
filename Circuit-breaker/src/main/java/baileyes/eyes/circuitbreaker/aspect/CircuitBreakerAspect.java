package baileyes.eyes.circuitbreaker.aspect;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import java.lang.reflect.Field;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.aspectj.lang.annotation.Aspect;

/**
 * <h1>Аспект для применения Circuit Breaker</h1>
 * <p>
 * Этот класс содержит аспекты для автоматического применения Circuit Breaker ко всем методам в
 * пакете {@code ru.your.project.service}, за исключением тех, которые уже аннотированы
 * {@link CircuitBreaker}
 * </p>
 * <p>
 * <b>Пример использования:</b>
 * </p>
 * <pre>{@code
 *   @Service
 *   public class SomeService {
 *       public void someMethod() {
 *           // Этот метод будет автоматически обернут в Circuit Breaker
 *       }
 *   }
 * }</pre>
 * <p>
 * <b>Основные компоненты:</b>
 * </p>
 * <ul>
 *     <li>{@link #servicePackagePointcut()}: Pointcut, который определяет, к каким методам будет применяться аспект</li>
 *     <li>{@link #applyDefaultCircuitBreaker(ProceedingJoinPoint)}: Аспект, который оборачивает методы в Circuit Breaker, если они не аннотированы {@link CircuitBreaker}</li>
 * </ul>
 * <p>
 * <b>Примечание:</b>
 * </p>
 * <p>
 * Методы, которые уже аннотированы {@link CircuitBreaker}, не будут оборачиваться повторно. Методы со внутренней реализацией тоже
 * </p>
 */
@Aspect
@Component
@RequiredArgsConstructor
public class CircuitBreakerAspect {

    /**
     * Реестр Circuit Breaker, используемый для получения экземпляров Circuit Breaker
     */
    private final CircuitBreakerRegistry registry;

    /**
     * Кэш для хранения информации о том, содержит ли класс инжектированное поле Circuit Breaker
     */
    private final ConcurrentMap<Class<?>, Boolean> cache = new ConcurrentHashMap<>();

    /**
     * Pointcut, который определяет, к каким методам в пакете {@code ru.your.project.service}
     * будет применяться аспект
     */
    @Pointcut("within(ru.your.project.*.service..*)")
    public void servicePackagePointcut() {}

    /**
     * Аспект, который оборачивает методы в Circuit Breaker, если они не аннотированы
     * {@link CircuitBreaker} и не используют явно инжектированное поле CircuitBreaker
     *
     * @param pjp ProceedingJoinPoint, представляющий метод, к которому применяется аспект
     * @return Результат выполнения метода
     * @throws Throwable если метод выбрасывает исключение
     */
    @Around("servicePackagePointcut() && !@annotation(io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker)")
    public Object applyDefaultCircuitBreaker(ProceedingJoinPoint pjp) throws Throwable {
        if (usesInjectedCircuitBreaker(pjp)) {
            return pjp.proceed();
        }

        return executeWithCircuitBreaker(pjp);
    }

    /**
     * Метод, который выполняет оборачивание в Circuit Breaker
     *
     * @param pjp ProceedingJoinPoint, представляющий метод, к которому применяется аспект
     * @return Результат выполнения метода
     * @throws Throwable если метод выбрасывает исключение
     */
    private Object executeWithCircuitBreaker(ProceedingJoinPoint pjp) throws Throwable {
        CircuitBreaker circuitBreaker = registry.circuitBreaker("defaultCircuitBreaker");

        return circuitBreaker.executeCallable(() -> {
            try {
                return pjp.proceed();
            } catch (Throwable e) {
                throw new RuntimeException(e);
            }
        });
    }

    /**
     * Проверяет, использует ли метод инжектированное поле CircuitBreaker
     * <p>
     * Этот метод использует кэширование для минимизации накладных расходов на рефлексию Результат
     * проверки наличия инжектированного поля CircuitBreaker в классе кэшируется, чтобы избежать
     * повторных вызовов рефлексии для одного и того же класса
     * </p>
     *
     * @param pjp ProceedingJoinPoint, представляющий метод, к которому применяется аспект
     * @return true, если метод использует инжектированное поле CircuitBreaker, иначе false
     */
    private boolean usesInjectedCircuitBreaker(ProceedingJoinPoint pjp) {
        Class<?> targetClass = pjp.getTarget().getClass();

        return cache.computeIfAbsent(targetClass, this::hasInjectedCircuitBreaker);
    }

    /**
     * Проверяет, есть ли в классе инжектированное поле CircuitBreaker
     *
     * @param targetClass класс, который проверяется на наличие инжектированного поля
     *                    CircuitBreaker
     * @return true, если класс содержит инжектированное поле CircuitBreaker, иначе false
     */
    private boolean hasInjectedCircuitBreaker(Class<?> targetClass) {
        Field[] fields = targetClass.getDeclaredFields();

        for (Field field : fields) {
            if (field.getType().equals(CircuitBreaker.class)) {
                return true;
            }
        }

        return false;
    }
}
