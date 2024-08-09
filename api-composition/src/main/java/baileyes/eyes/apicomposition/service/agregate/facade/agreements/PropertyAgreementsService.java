package baileyes.eyes.apicomposition.service.agregate.facade.agreements;

import baileyes.eyes.apicomposition.dto.PropertyAgreementDto;
import baileyes.eyes.apicomposition.feign.PropertyClient;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class PropertyAgreementsService implements ConcurrentAgreementsService<PropertyAgreementDto> {

    private final PropertyClient propertyClient;

    @Override
    public CompletableFuture<List<PropertyAgreementDto>> getAgreements(UUID individualId) {
        return CompletableFuture.supplyAsync(() -> propertyClient.getAgreementsByIndividualId(individualId));
    }
}
