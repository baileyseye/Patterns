package baileyes.eyes.apicomposition.service.agregate.facade.agreements;

import baileyes.eyes.apicomposition.dto.TravelAgreementDto;
import baileyes.eyes.apicomposition.feign.TravelClient;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TravelAgreementsService implements ConcurrentAgreementsService<TravelAgreementDto> {

    private final TravelClient travelClient;

    @Override
    public CompletableFuture<List<TravelAgreementDto>> getAgreements(UUID individualId) {
        return CompletableFuture.supplyAsync(() -> travelClient.getTravelInsurancesByIndividualId(individualId));
    }
}
