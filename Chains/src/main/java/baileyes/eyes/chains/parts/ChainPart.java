package baileyes.eyes.chains.parts;

import baileyes.eyes.chains.parts.dto.ProcessDataDto;
import baileyes.eyes.chains.parts.impl.FirstChainPart;
import baileyes.eyes.chains.parts.impl.SecondChainPart;

/**
 * Этот интерфейс определяет метод для обработки данных на каждом шаге цепочки создания адреса
 * </p>
 *
 * @see FirstChainPart
 * @see SecondChainPart
 */
public interface ChainPart {

    /**
     * Обрабатывает данные на текущем шаге цепочки
     *
     * @param previousData Данные, полученные на предыдущем шаге цепочки
     * @return Обновленные данные для следующего шага цепочки
     */
    ProcessDataDto<?> process(ProcessDataDto<?> previousData);
}
