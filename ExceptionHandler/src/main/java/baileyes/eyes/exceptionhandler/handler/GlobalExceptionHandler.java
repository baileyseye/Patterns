package baileyes.eyes.exceptionhandler.handler;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

@Aspect
@RestControllerAdvice
public class GlobalExceptionHandler {

    @AfterThrowing(pointcut = "execution(* ru.your.project..*.*(..))")
    public void scanForExceptions() {
    }

    /**
     * Создает ResponseEntity, содержащий ErrorResponse с сообщением и любыми подавленными
     * исключениями
     *
     * @param status  HTTP-статус, который будет установлен в ResponseEntity
     * @param message основное сообщение об ошибке
     * @param ex      исключение {@link Throwable}, содержащее любые подавленные исключения
     * @return ResponseEntity, содержащий ErrorResponse с полным сообщением об ошибке
     */
    private ResponseEntity<ErrorResponse> buildErrorResponseEntity(HttpStatus status,
        String message, Throwable ex) {
        String fullMessage = Arrays.stream(ex.getSuppressed())
            .map(suppressed -> "\nSuppressed: " + suppressed.toString())
            .collect(Collectors.joining("", message, ""));

        return getErrorResponseResponseEntity(status, fullMessage);
    }

    private ResponseEntity<ErrorResponse> getErrorResponseResponseEntity(HttpStatus status,
        String fullMessage) {
        return new ResponseEntity<>(new ErrorResponse(fullMessage), status);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleMissingParams(
        MissingServletRequestParameterException ex) {
        return buildErrorResponseEntity(HttpStatus.BAD_REQUEST,
            "Missing request parameter: " + ex.getParameterName(), ex);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
        MethodArgumentNotValidException ex) {
        return buildErrorResponseEntity(HttpStatus.BAD_REQUEST,
            "Validation error: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ErrorResponse> handleBadRequestExceptions(IllegalArgumentException ex) {
        return buildErrorResponseEntity(HttpStatus.BAD_REQUEST,
            "The provided argument is invalid: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(NullPointerException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> handleNullPointerExceptions(NullPointerException ex) {
        return buildErrorResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR,
            "Null Pointer Error: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> handleIllegalStateExceptions(IllegalStateException ex) {
        return buildErrorResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR,
            "Illegal State Error: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(IOException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> handleIOExceptions(IOException ex) {
        return buildErrorResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR,
            "IO Error: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(SQLException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> handleSQLExceptions(SQLException ex) {
        return buildErrorResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR,
            "SQL Error: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(RestClientException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ResponseEntity<ErrorResponse> handleRestClientExceptions(RestClientException ex) {
        return buildErrorResponseEntity(HttpStatus.SERVICE_UNAVAILABLE,
            "Rest Client Error: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(ExecutionException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<ErrorResponse> handleExecutionExceptions(ExecutionException ex) {
        return buildErrorResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR,
            "Execution Error: " + ex.getMessage(), ex);
    }
}
