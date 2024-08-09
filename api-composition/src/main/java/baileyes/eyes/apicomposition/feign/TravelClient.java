package baileyes.eyes.apicomposition.feign;

import baileyes.eyes.apicomposition.dto.TravelAgreementDto;
import java.util.List;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "travel-service", url = "${TRAVEL_SERVICE_URL}")
public interface TravelClient {

    /**
     * Получение списка страховок путешествий по идентификатору физического лица
     *
     * @param individualId Идентификатор физического лица
     * @return Список страховок путешествий
     */
    @GetMapping("${TRAVEL_API}agreements")
    List<TravelAgreementDto> getTravelInsurancesByIndividualId(
            @RequestParam("individualId") UUID individualId);
}
