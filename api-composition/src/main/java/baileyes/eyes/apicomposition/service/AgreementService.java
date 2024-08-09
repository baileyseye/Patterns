package baileyes.eyes.apicomposition.service;

import baileyes.eyes.apicomposition.dto.CommonDto;
import baileyes.eyes.apicomposition.service.agregate.AgreementFacade;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class AgreementService {

    /**
     * Сервис для операций с договорами
     */
    private final AgreementFacade agreementFacade;

    /**
     * Получение договоров по идентификатору физического лица
     *
     * @param individualId Идентификатор физического лица
     * @return Список договоров и информация о клиентах
     */
    public CompletableFuture<Map<String, List<CommonDto>>> getAggregatedAgreements(
            UUID individualId) {
        return agreementFacade.getAggregatedAgreements(individualId);
    }
}
