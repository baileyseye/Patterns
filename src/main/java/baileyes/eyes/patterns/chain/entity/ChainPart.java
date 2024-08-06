package baileyes.eyes.patterns.chain.entity;

import baileyes.eyes.patterns.chain.entity.dto.ProcessDataDto;
import baileyes.eyes.patterns.chain.entity.impl.FirstChainPart;
import baileyes.eyes.patterns.chain.entity.impl.SecondChainPart;

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
