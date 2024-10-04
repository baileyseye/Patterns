package baileyes.eyes.apicomposition.cotroller;

import baileyes.eyes.apicomposition.dto.CommonDto;
import baileyes.eyes.apicomposition.service.AgreementService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
@RequestMapping("api/v1/agg/individuals")
public class CompositeController {

    /**
     * Сервис для работы с договорами
     */
    private final AgreementService service;

    /**
     * Метод для получения договоров и клиентов по идентификатору физического лица
     *
     * @param individualId идентификатор физического лица
     * @return список договоров и клиентов
     */
    @GetMapping("/getAgreementsByIndividualId")
    public CompletableFuture<ResponseEntity<Map<String, List<CommonDto>>>> getAgreementsByIndividualId(
        @RequestParam UUID individualId) {
        return service.getAggregatedAgreements(individualId)
            .thenApply(ResponseEntity::ok);
    }
}
