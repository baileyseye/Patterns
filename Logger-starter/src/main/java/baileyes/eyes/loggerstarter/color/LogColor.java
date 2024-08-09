package baileyes.eyes.loggerstarter.color;

import org.jetbrains.annotations.Contract;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;

@Component
public class LogColor {

    private static final String RESET = "\u001B[0m";
    private static final String YELLOW = "\u001B[33m";
    private static final String RED = "\u001B[31m";
    private static final String BLUE = "\u001B[34m";
    private static final String GREEN = "\u001B[32m";

    private LogColor() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Окрашивает строку в желтый цвет.
     *
     * @param log Строка для окрашивания
     * @return Окрашенная строка
     */
    @Contract(pure = true)
    public static @NotNull String paintYellow(String log) {
        return YELLOW + log + RESET;
    }

    /**
     * Окрашивает строку в красный цвет.
     *
     * @param log Строка для окрашивания
     * @return Окрашенная строка
     */
    @Contract(pure = true)
    public static @NotNull String paintRed(String log) {
        return RED + log + RESET;
    }

    /**
     * Окрашивает строку в синий цвет.
     *
     * @param log Строка для окрашивания
     * @return Окрашенная строка
     */
    @Contract(pure = true)
    public static @NotNull String paintBlue(String log) {
        return BLUE + log + RESET;
    }

    /**
     * Окрашивает строку в зеленый цвет.
     *
     * @param log Строка для окрашивания
     * @return Окрашенная строка
     */
    @Contract(pure = true)
    public static @NotNull String paintGreen(String log) {
        return GREEN + log + RESET;
    }
}