package baileyes.eyes.loggerstarter.logger;

import static baileyes.eyes.loggerstarter.color.LogColor.paintBlue;
import static baileyes.eyes.loggerstarter.color.LogColor.paintGreen;
import static baileyes.eyes.loggerstarter.color.LogColor.paintRed;
import static baileyes.eyes.loggerstarter.color.LogColor.paintYellow;

import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;

@Slf4j
@Aspect
@Component
public class AspectLogger {

    /**
     * Определяет точку перехвата для контроллеров
     */
    @Pointcut("within(ru.your.project.*.controller..*)")
    private void catchController() {
    }

    /**
     * Определяет точку перехвата для сервисов
     */
    @Pointcut("within(ru.your.project.*.service..*)")
    private void catchService() {
    }

    /**
     * Перехватывает методы контроллеров и выполняет логирование перед и после выполнения
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     * @return Возвращаемое значение перехваченного метода
     * @throws Throwable Если произошла ошибка во время выполнения метода
     */
    @Around("catchController()")
    public Object logController(ProceedingJoinPoint joinPoint) throws Throwable {
        return logExecution(joinPoint);
    }

    /**
     * Перехватывает методы сервисов и выполняет логирование перед и после выполнения
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     * @return Возвращаемое значение перехваченного метода
     * @throws Throwable Если произошла ошибка во время выполнения метода
     */
    @Around("catchService()")
    public Object logService(ProceedingJoinPoint joinPoint) throws Throwable {
        return logExecution(joinPoint);
    }

    /**
     * Выполняет логирование выполнения метода, включая аргументы метода и имя класса
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     * @return Возвращаемое значение перехваченного метода
     * @throws Throwable Если произошла ошибка во время выполнения метода
     */
    private Object logExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        beforeExecuting(joinPoint);

        Object retVal;
        try {
            retVal = joinPoint.proceed();
        } catch (Throwable throwable) {
            logError(joinPoint, throwable);
            throw throwable;
        } finally {
            afterExecuting(joinPoint);
        }

        Optional<Object> optionalRetVal = Optional.ofNullable(retVal);
        optionalRetVal.ifPresent(value -> log.info("Return value: " + value));

        return retVal;
    }

    /**
     * Логирует начало выполнения метода и его аргументы
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     */
    private void beforeExecuting(ProceedingJoinPoint joinPoint) {
        logMethodNameAndClassName(joinPoint);
        logMethodArguments(joinPoint);
    }

    /**
     * Логирует статус выполнения метода
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     * @param status    Статус выполнения метода (например, "started" или "finished")
     */
    private void logMethodExecutionStatus(ProceedingJoinPoint joinPoint, String status) {
        log.info("Method {} in {} {}", methodName(joinPoint), className(joinPoint), status);
    }

    /**
     * Логирует завершение выполнения метода
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     */
    private void afterExecuting(ProceedingJoinPoint joinPoint) {
        logMethodExecutionStatus(joinPoint, "finished");
    }

    /**
     * Логирует имя метода и имя класса при начале выполнения метода
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     */
    private void logMethodNameAndClassName(ProceedingJoinPoint joinPoint) {
        logMethodExecutionStatus(joinPoint, "started with next arguments: ");
    }

    /**
     * Логирует аргументы метода
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     */
    private void logMethodArguments(@NotNull ProceedingJoinPoint joinPoint) {
        Object[] arguments = joinPoint.getArgs();

        int argumentIndex = 1;
        for (Object argument : arguments) {
            String argumentValue = argument != null ? argument.toString() : "null";
            log.info(argumentIndex + ") " + paintBlue(argumentValue));
            argumentIndex++;
        }
    }

    /**
     * Возвращает имя метода
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     * @return Имя метода в желтом цвете
     */
    private @NotNull String methodName(@NotNull JoinPoint joinPoint) {
        return paintYellow(joinPoint.getSignature().getName());
    }

    /**
     * Возвращает имя класса
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     * @return Имя класса в зеленом цвете
     */
    private @NotNull String className(@NotNull JoinPoint joinPoint) {
        return paintGreen(joinPoint.getSignature().getDeclaringTypeName());
    }

    /**
     * Логирует ошибки и исключения
     *
     * @param joinPoint Точка соединения, представляющая перехваченный метод
     * @param throwable Исключение или ошибка, возникшая во время выполнения метода
     */
    private void logError(ProceedingJoinPoint joinPoint, Throwable throwable) {
        log.error(paintRed("Method {} in {} threw an exception: {}"),
            methodName(joinPoint), className(joinPoint), throwable.getMessage(), throwable);
    }
}
