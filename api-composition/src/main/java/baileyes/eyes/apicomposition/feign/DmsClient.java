package baileyes.eyes.apicomposition.feign;

import baileyes.eyes.apicomposition.dto.DmsAgreementDto;
import java.util.List;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "dms-service", url = "${DMS_SERVICE_URL}")
public interface DmsClient {

    /**
     * Получение списка договоров по идентификатору физического лица
     *
     * @param individualId Идентификатор физического лица
     * @return Список договоров
     */
    @GetMapping("${DMS_API}agreements")
    List<DmsAgreementDto> getAgreementsByIndividualId(
            @RequestParam("individualId") UUID individualId);
}
