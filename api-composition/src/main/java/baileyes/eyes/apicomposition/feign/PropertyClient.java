package baileyes.eyes.apicomposition.feign;

import java.util.List;
import java.util.UUID;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import ru.astondevs.implservice.dto.PropertyAgreementDto;

@FeignClient(name = "property-service", url = "${PROPERTY_SERVICE_URL}")
public interface PropertyClient {

    /**
     * Получение списка договоров недвижимости по идентификатору физического лица
     *
     * @param individualId Идентификатор физического лица
     * @return Список договоров недвижимости
     */
    @GetMapping("${PROPERTY_API}agreements")
    List<PropertyAgreementDto> getAgreementsByIndividualId(
            @RequestParam("individualId") UUID individualId);
}
